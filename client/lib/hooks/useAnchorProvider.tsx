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

const PROGRAM_ID = new PublicKey('uJ5ujCBYYNJ7V4Fpurewj9cDSPT3jHnEKLnaxYPYss9')
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

type WillAccountData = IdlAccounts<DeadWallet>['willAccount']
type WillStatus = 'Active' | 'Grace Period' | 'Triggered' | 'Paused'

function deriveWillStatus(lastCheckIn: number, interval: number, claimed: boolean): WillStatus {
    if (claimed) return 'Triggered'
    const lateBy = Math.floor(Date.now() / 1000) - (lastCheckIn + interval)
    if (lateBy <= 0) return 'Active'
    if (lateBy <= 3 * 24 * 60 * 60) return 'Grace Period'
    return 'Triggered'
}

function mapHeirs(heirAccounts: any[]) {
    return heirAccounts.map(({ publicKey, account }: any) => ({
        id: publicKey.toBase58(),
        walletAddress: (account.walletAddress as PublicKey).toBase58(),
        shareBps: (account.bps / 100) as number,
        onChain: true,
    }))
}

const storeActions = () => useWillStore.getState()

export function useAnchorProvider(): UseAnchorProviderReturn {
    const wallet = useSollWillWallet()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [program, setProgram] = useState<Program<DeadWallet> | null>(null)
    const [Heirs, setHeirs] = useState<any[]>([])

    // ALL mutable values live in refs — nothing that changes should be in useCallback/useEffect deps
    const willPdaRef = useRef<PublicKey | null>(null)
    const vaultPdaRef = useRef<PublicKey | null>(null)
    const programRef = useRef<Program<DeadWallet> | null>(null)
    const walletAddressRef = useRef<string | null>(null)  // tracks last inited address
    const isRefreshingRef = useRef(false)                 // prevents concurrent refresh calls

    // Keep refresh in a ref so it can be called without ever appearing in a dep array
    const refreshRef = useRef<() => Promise<void>>(async () => { })

    async function fetchUsdPrices(mints: string[]): Promise<Record<string, number>> {
        const SOL_MINT = 'So11111111111111111111111111111111111111112'
        const allMints = [SOL_MINT, ...mints].join(',')
        try {
            const res = await fetch(`https://api.jup.ag/price/v2?ids=${allMints}`)
            const json = await res.json()
            const prices: Record<string, number> = {}
            for (const [mint, data] of Object.entries(json.data as Record<string, any>)) {
                prices[mint] = parseFloat((data as any)?.price ?? '0')
            }
            return prices
        } catch {
            return {}
        }
    }

    // Plain async fn — reads everything from refs, never a dep anywhere
    const runRefresh = async () => {
        const prog = programRef.current
        const willPda = willPdaRef.current
        const vaultPda = vaultPdaRef.current

        if (!prog || !willPda || !vaultPda) return
        if (isRefreshingRef.current) return  // guard against concurrent calls
        isRefreshingRef.current = true

        const conn = prog.provider.connection
        setLoading(true)
        setError(null)

        try {
            // ── Will account ────────────────────────────────────────────────
            let willData: WillAccountData | null = null
            try {
                willData = await (prog.account as any).willAccount.fetch(willPda) as WillAccountData
            } catch {
                storeActions().setWillAccount(null)
            }

            if (willData) {
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

            // ── Vault balance ───────────────────────────────────────────────
            let solBalance = 0
            try {
                await prog.account.vault.fetch(vaultPda)
                const raw = await conn.getBalance(vaultPda)
                solBalance = raw / LAMPORTS_PER_SOL
            } catch { }

            // ── SPL assets ──────────────────────────────────────────────────
            const SOL_MINT = 'So11111111111111111111111111111111111111112'
            const splAssets: Asset[] = []

            if (willData && Array.isArray((willData as any).assets)) {
                const rawAssets = (willData as any).assets as Array<{ mint: PublicKey; balance: BN }>
                await Promise.allSettled(rawAssets.map(async ({ mint, balance }) => {
                    const mintStr = mint.toBase58()
                    const meta = TOKEN_META[mintStr]
                    let decimals = meta?.decimals ?? 6
                    try { decimals = (await getMint(conn, mint)).decimals } catch { }
                    splAssets.push({
                        symbol: meta?.symbol ?? mintStr.slice(0, 6),
                        mint: mintStr,
                        amount: balance.toNumber() / Math.pow(10, decimals),
                        usdPrice: 0,
                        usdValue: 0,
                        icon: meta?.icon,
                    })
                }))
            }

            // ── Prices: single batched call ─────────────────────────────────
            const prices = await fetchUsdPrices(splAssets.map(a => a.mint!))
            const solPrice = prices[SOL_MINT] ?? 0

            const solAsset: Asset = {
                symbol: 'SOL',
                amount: solBalance,
                usdPrice: solPrice,
                usdValue: solBalance * solPrice,
            }

            const hydratedSpl = splAssets.map(a => ({
                ...a,
                usdPrice: prices[a.mint!] ?? 0,
                usdValue: (prices[a.mint!] ?? 0) * a.amount,
            }))

            const allAssets = [solAsset, ...hydratedSpl].filter(a => a.amount > 0)
            storeActions().setVaultAccount({
                sol: solBalance,
                usdc: hydratedSpl.find(a => a.symbol === 'USDC')?.amount ?? 0,
                totalUsdValue: allAssets.reduce((sum, a) => sum + a.usdValue, 0),
                assets: allAssets,
            })

            // ── Heirs ───────────────────────────────────────────────────────
            const heirAccounts = await (prog.account as any).heir.all()
            const mapped = mapHeirs(heirAccounts)
            storeActions().setHeirs(mapped)
            setHeirs(mapped)

        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            setError(e)
            console.error('[useAnchorProvider] refresh failed:', e)
        } finally {
            setLoading(false)
            isRefreshingRef.current = false
        }
    }

    // Always point the ref at the latest closure
    refreshRef.current = runRefresh

    // Stable identity for consumers — calling this will always use the latest runRefresh
    const refresh = useCallback(() => refreshRef.current(), [])

    // ── Init: keyed ONLY on wallet.address (a primitive string) ──────────────
    useEffect(() => {
        const address = wallet.address

        // Short-circuit if address hasn't actually changed (Privy re-renders a lot)
        if (address === walletAddressRef.current) return
        walletAddressRef.current = address

        if (!wallet.ready || wallet.loading || !address || !wallet.publicKey || !wallet.raw) {
            if (!wallet.ready || wallet.loading) setLoading(true)
            else setLoading(false)
            return
        }

        storeActions().setConnected(true)
        storeActions().setWallet(address)

        const publicKey = wallet.publicKey  // snapshot — stable at this point
        const raw = wallet.raw              // snapshot

        const init = async () => {
            try {
                setLoading(true)
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

                // Write to refs before any awaits that depend on them
                willPdaRef.current = willPda
                vaultPdaRef.current = vaultPda
                programRef.current = prog

                // Heirs fetched once here; refresh() will re-fetch on manual trigger
                const heirAccounts = await prog.account.heir.all()
                const mapped = mapHeirs(heirAccounts)
                storeActions().setHeirs(mapped)
                setHeirs(mapped)

                // Set program state last — this is what triggers the rest of the UI
                setProgram(prog)

                // Full data refresh — exactly once per wallet session
                await refreshRef.current()

            } catch (e) {
                console.error('[useAnchorProvider] init error:', e)
                programRef.current = null
                setProgram(null)
                setError(e as Error)
                setLoading(false)
            }
        }

        init()

        // ✅ Single primitive dep — this effect runs ONCE per wallet address.
        // wallet.ready/loading/publicKey/raw are read inside but NOT deps,
        // so Privy re-renders never re-trigger init.
    }, [wallet.address])

    return {
        loading,
        error,
        refresh,
        program,
        pdas: { willPda: willPdaRef.current, vaultPda: vaultPdaRef.current },
        Heirs,
    }
}