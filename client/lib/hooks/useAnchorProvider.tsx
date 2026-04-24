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
import { UseAnchorProviderReturn } from '../utils/helper'

const PROGRAM_ID = new PublicKey('4pHVi1JXM5BL64Z92iH57wBxqdC3DWfsLgyCG9jDnUZx')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com'
const WILL_SEED = Buffer.from('will')
const VAULT_SEED = Buffer.from('vault')

const TOKEN_META: Record<string, { symbol: string; decimals: number; icon?: string }> = {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', decimals: 6, icon: '/icons/usdc.svg' },
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: 'USDT', decimals: 6, icon: '/icons/usdt.svg' },
    So11111111111111111111111111111111111111112: { symbol: 'wSOL', decimals: 9 },
    mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: { symbol: 'mSOL', decimals: 9 },
    DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: { symbol: 'BONK', decimals: 5 },
    JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: 'JUP', decimals: 6 },
}

// Cache resolved decimals so getMint is never called twice for the same mint
const decimalsCache: Record<string, number> = {}

const SOL_MINT = 'So11111111111111111111111111111111111111112'

type WillAccountData = IdlAccounts<DeadWallet>['willAccount']
type WillStatus = 'Active' | 'Grace Period' | 'Triggered' | 'Paused'

function deriveWillStatus(
    lastCheckIn: number,
    interval: number,
    claimed: boolean,
): WillStatus {
    if (claimed) return 'Triggered'
    const lateBy = Math.floor(Date.now() / 1000) - (lastCheckIn + interval)
    if (lateBy <= 0) return 'Active'
    if (lateBy <= 3 * 24 * 60 * 60) return 'Grace Period'
    return 'Triggered'
}

// Filter heirs by willPda so we never load other users' heirs
function mapHeirs(heirAccounts: any[], willPda: PublicKey) {
    return heirAccounts
        .filter(({ account }: any) => {
            try {
                return (account.owner as PublicKey).toBase58() === willPda.toBase58()
            } catch {
                return false
            }
        })
        .map(({ publicKey, account }: any) => ({
            id: publicKey.toBase58(),
            walletAddress: (account.walletAddress as PublicKey).toBase58(),
            shareBps: (account.bps as number) / 100,
            onChain: true,
        }))
}

async function fetchUsdPrices(mints: string[]): Promise<Record<string, number>> {
    // Always include SOL for the vault balance price
    const ids = [SOL_MINT, ...mints.filter((m) => m !== SOL_MINT)].join(',')
    try {
        const res = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`)
        const json = await res.json()
        const out: Record<string, number> = {}
        for (const [mint, data] of Object.entries(json.data as Record<string, any>)) {
            out[mint] = parseFloat((data as any)?.price ?? '0')
        }
        return out
    } catch {
        return {}
    }
}

async function resolveDecimals(conn: Connection, mint: PublicKey): Promise<number> {
    const key = mint.toBase58()
    if (decimalsCache[key] !== undefined) return decimalsCache[key]
    const meta = TOKEN_META[key]
    if (meta) {
        decimalsCache[key] = meta.decimals
        return meta.decimals
    }
    try {
        const info = await getMint(conn, mint)
        decimalsCache[key] = info.decimals
        return info.decimals
    } catch {
        decimalsCache[key] = 6 // safe fallback
        return 6
    }
}

const storeActions = () => useWillStore.getState()

export function useAnchorProvider(): UseAnchorProviderReturn {
    const wallet = useSollWillWallet()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [program, setProgram] = useState<Program<DeadWallet> | null>(null)
    const [heirs, setHeirs] = useState<any[]>([])

    // All mutable state in refs — never in dep arrays
    const willPdaRef = useRef<PublicKey | null>(null)
    const vaultPdaRef = useRef<PublicKey | null>(null)
    const programRef = useRef<Program<DeadWallet> | null>(null)
    const walletAddressRef = useRef<string | null>(null)
    const isRefreshingRef = useRef(false)

    // ── Core refresh — reads everything from refs at call time ──────────────
    const runRefresh = useCallback(async () => {
        const prog = programRef.current
        const willPda = willPdaRef.current
        const vaultPda = vaultPdaRef.current

        if (!prog || !willPda || !vaultPda) {
            console.warn('[runRefresh] refs not ready — skipping')
            return
        }
        if (isRefreshingRef.current) {
            console.warn('[runRefresh] already refreshing — skipping')
            return
        }

        isRefreshingRef.current = true
        setLoading(true)
        setError(null)

        const conn = prog.provider.connection

        try {
            // ── 1. Batch: willAccount + vaultAccount in parallel ─────────────────
            const [willData, vaultLamports] = await Promise.all([
                prog.account.willAccount.fetch(willPda).catch(() => null) as Promise<WillAccountData | null>,
                conn.getBalance(vaultPda).catch(() => 0),
            ])

            // ── 2. WillAccount ────────────────────────────────────────────────────
            if (!willData) {
                storeActions().setWillAccount(null)
            } else {
                const lastCheckIn = (willData.lastCheckIn as BN).toNumber()
                const interval = (willData.interval as BN).toNumber()
                storeActions().setWillAccount({
                    lastCheckin: lastCheckIn,
                    interval,
                    nextCheckin: lastCheckIn + interval,
                    createdAt: lastCheckIn,
                    status: deriveWillStatus(lastCheckIn, interval, willData.claimed as boolean),
                })
            }

            // ── 3. SPL assets from willAccount.assets (no extra RPC call) ────────
            const splAssets: Asset[] = []

            if (willData && Array.isArray((willData as any).assets)) {
                const rawAssets = (willData as any).assets as Array<{ mint: PublicKey; balance: BN }>

                // Resolve decimals in parallel — getMint only fires for unknown mints
                await Promise.all(
                    rawAssets.map(async ({ mint, balance }) => {
                        const mintStr = mint.toBase58()
                        const decimals = await resolveDecimals(conn, mint)
                        const meta = TOKEN_META[mintStr]
                        splAssets.push({
                            symbol: meta?.symbol ?? mintStr.slice(0, 6),
                            mint: mintStr,
                            amount: balance.toNumber() / Math.pow(10, decimals),
                            usdPrice: 0,
                            usdValue: 0,
                            icon: meta?.icon,
                        })
                    }),
                )
            }

            // ── 4. Single price fetch — only if there are assets ─────────────────
            const splMints = splAssets.map((a) => a.mint!)
            const prices = splMints.length > 0 || vaultLamports > 0
                ? await fetchUsdPrices(splMints)
                : {}

            const solPrice = prices[SOL_MINT] ?? 0
            const solAmount = vaultLamports / LAMPORTS_PER_SOL

            const solAsset: Asset = {
                symbol: 'SOL',
                amount: solAmount,
                usdPrice: solPrice,
                usdValue: solAmount * solPrice,
            }

            const hydratedSpl = splAssets.map((a) => ({
                ...a,
                usdPrice: prices[a.mint!] ?? 0,
                usdValue: (prices[a.mint!] ?? 0) * a.amount,
            }))

            const allAssets = [solAsset, ...hydratedSpl].filter((a) => a.amount > 0)

            storeActions().setVaultAccount({
                sol: solAmount,
                usdc: hydratedSpl.find((a) => a.symbol === 'USDC')?.amount ?? 0,
                totalUsdValue: allAssets.reduce((sum, a) => sum + a.usdValue, 0),
                assets: allAssets,
            })

            // ── 5. Heirs — filtered by willPda (not global) ──────────────────────
            const heirAccounts = await program?.account.heir.all() ?? [];
            console.log(`original heri acc`, heirAccounts)
            const mapped = mapHeirs(heirAccounts, willPda)
            console.log(`mapped`, mapped)
            storeActions().setHeirs(mapped)
            setHeirs(mapped)

            console.log('[runRefresh] done — assets:', allAssets.length, 'heirs:', mapped.length)

        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            console.error('[runRefresh] error:', e)
            setError(e)
        } finally {
            setLoading(false)
            isRefreshingRef.current = false
        }
    }, []) // stable — reads refs at call time, no deps needed

    // ── Init: runs exactly once per wallet address ────────────────────────────
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

        // Snapshot wallet values — stable at this point
        const publicKey = wallet.publicKey
        const raw = wallet.raw

        const init = async () => {
            try {
                setLoading(true)
                setError(null)

                const conn = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(conn, raw as any, { commitment: 'confirmed' })
                const prog = new Program<DeadWallet>(IDL as any, provider)

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, publicKey.toBuffer()], PROGRAM_ID,
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID,
                )

                // Write refs BEFORE anything that depends on them
                willPdaRef.current = willPda
                vaultPdaRef.current = vaultPda
                programRef.current = prog

                setProgram(prog)

                // Load heirs immediately so UI isn't empty before runRefresh completes
                try {
                    const heirAccounts = await (prog.account as any).heir.all()
                    const mapped = mapHeirs(heirAccounts, willPda)
                    storeActions().setHeirs(mapped)
                    setHeirs(mapped)
                    console.log('[init] heirs loaded:', mapped.length)
                } catch (e) {
                    console.warn('[init] heir fetch failed:', e)
                    // Non-fatal — runRefresh will retry
                }

                // Full data refresh — willAccount, vault, SPL assets, prices, heirs again
                await runRefresh()

            } catch (e) {
                console.error('[useAnchorProvider] init error:', e)
                programRef.current = null
                willPdaRef.current = null
                vaultPdaRef.current = null
                setProgram(null)
                setError(e as Error)
                setLoading(false)
            }
        }

        init()
    }, [wallet.address, runRefresh])

    return {
        loading,
        error,
        refresh: runRefresh,
        program,
        pdas: { willPda: willPdaRef.current, vaultPda: vaultPdaRef.current },
        Heirs: heirs,
    }
}