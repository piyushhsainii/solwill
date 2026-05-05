import { useCallback, useEffect, useRef, useState } from 'react'
import {
    AnchorProvider,
    BN,
    Program,
    type IdlAccounts,
} from '@coral-xyz/anchor'
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js'
import { getMint } from '@solana/spl-token'

import { useWillStore, type Asset } from '../../app/store/useWillStore'
import IDL from '../idl/idl.json'
import { DeadWallet } from '../idl/idl'
import { useSollWillWallet } from './useSolWillWallet'
import { LoadingStep, UseAnchorProviderReturn } from '../utils/helper'

const PROGRAM_ID = new PublicKey('FCLjiGPR8s4oxSi4jMd4Ra1SsJzxuN5FXq5zw8ueTsRE')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com'
const WILL_SEED = Buffer.from('will')
const VAULT_SEED = Buffer.from('vault')
const HEIR_SEED = Buffer.from('heir')

const TOKEN_META: Record<string, { symbol: string; decimals: number; icon?: string }> = {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', decimals: 6, icon: '/icons/usdc.svg' },
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: 'USDT', decimals: 6, icon: '/icons/usdt.svg' },
    So11111111111111111111111111111111111111112: { symbol: 'wSOL', decimals: 9 },
    mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: { symbol: 'mSOL', decimals: 9 },
    DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: { symbol: 'BONK', decimals: 5 },
    JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: 'JUP', decimals: 6 },
}

const decimalsCache: Record<string, number> = {}
const SOL_MINT = 'So11111111111111111111111111111111111111112'

type WillAccountData = IdlAccounts<DeadWallet>['willAccount']


type WillStatus = 'active' | 'claimed'

// Shape of the processed will data returned directly from the hook
export type WillData = {
    lastCheckin: number
    interval: number
    nextCheckin: number
    createdAt: number
    status: WillStatus
} | null

// Shape of the processed vault data returned directly from the hook
export type VaultData = {
    sol: number
    totalUsdValue: number
    assets: Asset[]
} | null

function deriveWillStatus(
    lastCheckIn: number,
    interval: number,
    claimed: boolean,
): WillStatus {
    if (claimed) return 'claimed'
    const lateBy = Math.floor(Date.now() / 1000) - (lastCheckIn + interval)
    if (lateBy <= 0) return 'active'

    return 'claimed'
}

// No JS filter needed — memcmp on-chain already scopes to this willPda only
function mapHeirs(heirAccounts: any[]) {
    return heirAccounts.map(({ publicKey, account }: any) => ({
        id: publicKey.toBase58(),
        walletAddress: (account.walletAddress as PublicKey).toBase58(),
        shareBps: (account.bps as number) / 100,
        onChain: true,
    }))
}


const storeActions = () => useWillStore.getState()

export function useAnchorProvider(): UseAnchorProviderReturn {
    const wallet = useSollWillWallet()

    const [loading, setLoading] = useState(true)
    const [initializing, setInitializing] = useState(true)  // ← add this
    const [loadingStep, setLoadingStep] = useState<LoadingStep>('wallet')
    const [error, setError] = useState<Error | null>(null)
    const [heirs, setHeirs] = useState<any[]>([])

    // willData and vaultData exposed directly from the hook so consumers
    // don't have to go through the store if they prefer local state
    const [willData, setWillData] = useState<WillData>(null)
    const [vaultData, setVaultData] = useState<VaultData>(null)

    // All mutable state in refs — keeps runRefresh stable with zero deps
    const willPdaRef = useRef<PublicKey | null>(null)
    const vaultPdaRef = useRef<PublicKey | null>(null)
    const programRef = useRef<Program<DeadWallet> | null>(null)
    const walletAddressRef = useRef<string | null>(null)
    const isRefreshingRef = useRef(false)


    const runRefresh = useCallback(async () => {
        const prog = programRef.current
        const willPda = willPdaRef.current
        const vaultPda = vaultPdaRef.current

        if (!prog || !willPda || !vaultPda) {
            console.warn('[runRefresh] refs not ready — skipping')
            return
        }
        if (isRefreshingRef.current) {
            console.warn('[runRefresh] already in progress — skipping')
            return
        }

        isRefreshingRef.current = true
        setLoading(true)
        setError(null)

        const conn = prog.provider.connection

        try {
            // ── 1. willAccount + vault balance — one round trip ──────────────
            const [rawWillData] = await Promise.all([
                prog.account.willAccount.fetch(willPda).catch(() => null) as Promise<WillAccountData | null>,
            ])

            // ── 2. Process and store will account ────────────────────────────
            if (!rawWillData) {
                setWillData(null)
                storeActions().setWillAccount(null)
            } else {
                const lastCheckIn = (rawWillData.lastCheckIn as BN).toNumber()
                const interval = (rawWillData.interval as BN).toNumber()
                const processed: WillData = {
                    lastCheckin: lastCheckIn,
                    interval,
                    nextCheckin: lastCheckIn + interval,
                    createdAt: lastCheckIn,
                    status: deriveWillStatus(lastCheckIn, interval, rawWillData.claimed as boolean),
                }
                setWillData(processed)
                storeActions().setWillAccount(processed)
            }

            // ── 3. SPL token assets embedded in willAccount ──────────────────
            const splAssets: Asset[] = []

            if (rawWillData && Array.isArray((rawWillData as any).assets)) {
                const rawAssets = rawWillData.assets as Array<{ mint: PublicKey; balance: number, decimals: number }>
                await Promise.all(
                    rawAssets.map(async ({ mint, balance, decimals }) => {
                        const mintStr = mint.toBase58()
                        // const decimals = await resolveDecimals(conn, mint)
                        // const meta = TOKEN_META[mintStr]
                        splAssets.push({
                            symbol: mintStr.slice(0, 6),
                            mint: mintStr,
                            amount: balance,
                            usdPrice: 0,
                            usdValue: 0,
                            icon: '/meta-icon.png',
                            decimals: decimals
                        })
                    }),
                )
            }

            // ── 4. USD prices — single fetch ─────────────────────────────────
            const splMints = splAssets.map((a) => a.mint!)
            const prices: any = {}
            //  splMints.length > 0 || rawWillData?.totalBal > 0
            //     ? await fetchUsdPrices(splMints)
            //     : {}

            const solPrice = prices[SOL_MINT] ?? 0
            const solAmount = rawWillData?.totalBal ? rawWillData.totalBal / LAMPORTS_PER_SOL : 0

            const solAsset: Asset = {
                symbol: 'SOL',
                amount: solAmount,
                usdPrice: solPrice,
                usdValue: solAmount * solPrice,
                decimals: 9,
                icon: "/sol-logo.png",
                mint: SOL_MINT

            }

            const hydratedSpl = splAssets.map((a) => ({
                ...a,
                usdPrice: prices[a.mint!] ?? 0,
                usdValue: (prices[a.mint!] ?? 0) * a.amount,
            }))

            const allAssets = [solAsset, ...hydratedSpl].filter((a) => a.amount > 0)

            const processedVault: VaultData = {
                sol: solAmount,
                totalUsdValue: allAssets.reduce((sum, a) => sum + a.usdValue, 0),
                assets: allAssets,
            }

            setVaultData(processedVault)
            storeActions().setVaultAccount(processedVault)

            // ── 5. Heirs — scoped on-chain via memcmp ────────────────────────
            // offset 8 skips the Anchor discriminator and matches the `will`
            // PublicKey field (first field in the Heir struct).
            // Adjust offset if your struct has fields before `will`.
            const heirAccounts = await prog.account.heir.all(
                //     [
                //     {
                //         memcmp: {
                //             offset: 8,
                //             bytes: willPda.toBase58(),
                //         },
                //     },
                // ]
            )
            console.log(heirAccounts)
            console.log('[runRefresh] raw heir accounts:', heirAccounts)

            const mapped = mapHeirs(heirAccounts)
            const myHeirs = heirAccounts.filter((data) => {
                const [expectedPda] = PublicKey.findProgramAddressSync(
                    [HEIR_SEED, data.account.walletAddress.toBuffer(), willPda.toBuffer()],
                    PROGRAM_ID
                )
                return expectedPda.equals(data.publicKey)

            });
            const heirs = myHeirs.map((data) => {
                return {
                    id: data.publicKey.toBase58(),
                    onChain: true,
                    shareBps: data.account.bps,
                    walletAddress: data.account.walletAddress.toBase58()
                }
            })

            storeActions().setHeirs(heirs)
            console.log('[runRefresh] done — assets:', allAssets.length, 'heirs:', mapped.length)

        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            console.error('[runRefresh] error:', e)
            setError(e)
        } finally {
            setLoading(false)
            setInitializing(false)  // ← only flipped once, never again
            isRefreshingRef.current = false
        }
    }, [])

    useEffect(() => {
        const address = wallet.address

        if (address === walletAddressRef.current) return
        walletAddressRef.current = address

        if (!wallet.ready || wallet.loading || !address || !wallet.publicKey || !wallet.raw) {
            setLoading(!wallet.ready || wallet.loading)
            return
        }

        storeActions().setConnected(true)
        storeActions().setWallet(address)

        const publicKey = wallet.publicKey
        const raw = wallet.raw
        if (!wallet.ready || wallet.loading || !address) {
            setLoading(true)
            setLoadingStep('wallet')   // ← waiting on wallet
            return
        }
        const init = async () => {
            try {
                setLoading(true)
                setLoadingStep('chain')
                setError(null)

                const conn = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(conn, raw as any, { commitment: 'confirmed' })
                const prog = new Program<DeadWallet>(IDL as any, provider)

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, publicKey.toBuffer()],
                    PROGRAM_ID,
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()],
                    PROGRAM_ID,
                )

                willPdaRef.current = willPda
                vaultPdaRef.current = vaultPda
                programRef.current = prog

                const { willAccount, vaultAccount } = useWillStore.getState()
                if (willAccount !== null || vaultAccount !== null) {
                    console.log('[init] store has data — skipping RPC')
                    setLoading(false)
                    setInitializing(false)  // ← add this
                    return
                }

                console.log('[init] no cache — fetching from chain')

                // ── 1. Will account + vault balance in one round trip ────────────
                const [rawWillData] = await Promise.all([
                    prog.account.willAccount.fetch(willPda).catch(() => null) as Promise<WillAccountData | null>,
                ])

                // ── 2. Will account ──────────────────────────────────────────────
                if (!rawWillData) {
                    setWillData(null)
                    storeActions().setWillAccount(null)
                } else {
                    const lastCheckIn = (rawWillData.lastCheckIn as BN).toNumber()
                    const interval = (rawWillData.interval as BN).toNumber()
                    const processed: WillData = {
                        lastCheckin: lastCheckIn,
                        interval,
                        nextCheckin: lastCheckIn + interval,
                        createdAt: lastCheckIn,
                        status: deriveWillStatus(lastCheckIn, interval, rawWillData.claimed as boolean),
                    }
                    setWillData(processed)
                    storeActions().setWillAccount(processed)
                }

                // ── 3. SPL assets from willAccount ───────────────────────────────
                const splAssets: Asset[] = []
                if (rawWillData && Array.isArray(rawWillData.assets)) {
                    const rawAssets = rawWillData.assets as Array<{ mint: PublicKey; balance: BN, decimals: number }>
                    await Promise.all(
                        rawAssets.map(async ({ mint, balance, decimals }) => {
                            const mintStr = mint.toBase58()

                            const meta = TOKEN_META[mintStr]
                            splAssets.push({
                                symbol: meta?.symbol ?? mintStr.slice(0, 6),
                                mint: mintStr,
                                amount: balance.toNumber(),
                                usdPrice: 0,
                                usdValue: 0,
                                icon: meta?.icon,
                                decimals: decimals
                            })
                        }),
                    )
                }

                // ── 4. USD prices ────────────────────────────────────────────────
                const splMints = splAssets.map((a) => a.mint!)
                const prices: any = {}
                // splMints.length > 0 || vaultLamports > 0
                //     ? await fetchUsdPrices(splMints)
                //     : {}
                const solAmount = rawWillData?.totalBal ? rawWillData.totalBal / LAMPORTS_PER_SOL : 0
                const solPrice = prices[SOL_MINT] ?? 0

                const allAssets = [
                    {
                        symbol: 'SOL',
                        amount: solAmount,
                        usdPrice: solPrice,
                        usdValue: solAmount * solPrice,
                        decimals: 9,
                        icon: "/sol-logo.png",
                        mint: SOL_MINT

                    },
                    ...splAssets.map((a) => ({
                        ...a,
                        usdPrice: prices[a.mint!] ?? 0,
                        usdValue: (prices[a.mint!] ?? 0) * (a.amount * 0),
                        amount: a.amount ?? 0,
                        symbol: "",
                        icon: "/meta-icon.png",
                        mint: a.mint,
                        decimals: a.decimals
                    })),
                ]

                const processedVault: VaultData = {
                    sol: solAmount,
                    totalUsdValue: allAssets.reduce((sum, a) => sum + a.usdValue, 0),
                    assets: allAssets,
                }
                setVaultData(processedVault)
                storeActions().setVaultAccount(processedVault)

                // ── 5. Heirs — scoped to this will via memcmp ────────────────────
                // prog.account.heir.all() with no filter fetches ALL heirs on-chain
                // across every user — memcmp scopes it to only this willPda
                const heirAccounts = await prog.account.heir.all();
                const myHeirs = heirAccounts.filter((data) => {
                    const [expectedPda] = PublicKey.findProgramAddressSync(
                        [HEIR_SEED, data.account.walletAddress.toBuffer(), willPda.toBuffer()],
                        PROGRAM_ID
                    )
                    return expectedPda.equals(data.publicKey)

                });
                const heirs = myHeirs.map((data) => {
                    return {
                        id: data.publicKey.toBase58(),
                        onChain: true,
                        shareBps: data.account.bps,
                        walletAddress: data.account.walletAddress.toBase58()
                    }
                })

                storeActions().setHeirs(heirs)
                setHeirs(heirs)

                console.log('[init] done — assets:', allAssets.length, 'heirs:', heirs.length)

            } catch (e) {
                console.error('[useAnchorProvider] init error:', e)
                programRef.current = null
                willPdaRef.current = null
                vaultPdaRef.current = null
                setError(e as Error)
            } finally {
                setLoading(false)
                setLoadingStep('done')
                setInitializing(false)  // ← add this
            }
        }

        init()
    }, [wallet.address])

    return {
        loading,
        initializing,
        loadingStep,
        error,
        refresh: runRefresh,
        program: programRef.current,
        pdas: {
            willPda: willPdaRef.current,
            vaultPda: vaultPdaRef.current,
        },
        willData,
        vaultData,
        Heirs: heirs,
    }
}