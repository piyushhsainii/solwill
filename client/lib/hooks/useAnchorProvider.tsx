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
const HEIR_DISCRIMINATOR = Buffer.from([102, 55, 217, 17, 95, 202, 14, 93])

const TOKEN_META: Record<string, { symbol: string; decimals: number; icon?: string }> = {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', decimals: 6, icon: '/icons/usdc.svg' },
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: 'USDT', decimals: 6, icon: '/icons/usdt.svg' },
    So11111111111111111111111111111111111111112: { symbol: 'wSOL', decimals: 9 },
    mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: { symbol: 'mSOL', decimals: 9 },
    DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: { symbol: 'BONK', decimals: 5 },
    JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: 'JUP', decimals: 6 },
}

type WillAccountData = IdlAccounts<DeadWallet>['willAccount']
type VaultData = IdlAccounts<DeadWallet>['vault']
type HeirData = IdlAccounts<DeadWallet>['heir']
type WillStatus = 'Active' | 'Grace Period' | 'Triggered' | 'Paused'

function deriveWillStatus(lastCheckIn: number, interval: number, claimed: boolean): WillStatus {
    if (claimed) return 'Triggered'
    const lateBy = Math.floor(Date.now() / 1000) - (lastCheckIn + interval)
    if (lateBy <= 0) return 'Active'
    if (lateBy <= 3 * 24 * 60 * 60) return 'Grace Period'
    return 'Triggered'
}


const storeActions = () => useWillStore.getState()

export function useAnchorProvider(): UseAnchorProviderReturn {
    const wallet = useSollWillWallet()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [program, setProgram] = useState<Program<DeadWallet> | null>(null)

    const willPdaRef = useRef<PublicKey | null>(null)
    const vaultPdaRef = useRef<PublicKey | null>(null)
    const [Heirs, setHeirs] = useState<any[]>([])

    useEffect(() => {

        if (!wallet.ready || wallet.loading) {
            setLoading(true)
            return
        }

        if (wallet.address) {
            storeActions().setConnected(true)
            storeActions().setWallet(wallet.address)
        }

        if (!wallet.address || !wallet.publicKey || !wallet.raw) {
            setLoading(false)
            return
        }
        console.log(`Wallet`, wallet)
        const init = async () => {
            try {
                setLoading(true)
                setError(null)

                const conn = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(conn, wallet.raw as any, { commitment: 'confirmed' })
                const prog = new Program<DeadWallet>(IDL as any, provider)

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, wallet.publicKey!.toBuffer()],
                    PROGRAM_ID,
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()],
                    PROGRAM_ID,
                )
                const heirAccounts = await prog?.account.heir.all()
                console.log(`heir accounts`, heirAccounts)
                heirAccounts && storeActions().setHeirs(heirAccounts.map(({ publicKey, account }: any) => ({
                    id: publicKey.toBase58(),
                    walletAddress: (account.walletAddress as PublicKey).toBase58(),
                    shareBps: (account.bps / 100) as number,
                    onChain: true,
                })))
                willPdaRef.current = willPda
                vaultPdaRef.current = vaultPda
                setHeirs(heirAccounts.map(({ publicKey, account }: any) => ({
                    id: publicKey.toBase58(),
                    walletAddress: (account.walletAddress as PublicKey).toBase58(),
                    shareBps: (account.bps / 100) as number,
                    onChain: true,
                })))
                willPdaRef.current = willPda
                vaultPdaRef.current = vaultPda

                setProgram(prog)
            } catch (e) {
                console.error('[useAnchorProvider] init error:', e)
                setProgram(null)
                setError(e as Error)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [wallet.ready, wallet.address])
    /* ── 2. Fetch on-chain state ─────────────────────────────────── */
    const refresh = useCallback(async () => {
        if (!wallet.ready || !program || !wallet.publicKey || !willPdaRef.current || !vaultPdaRef.current) return

        const willPda = willPdaRef.current
        const vaultPda = vaultPdaRef.current
        const conn = program.provider.connection

        setLoading(true)
        setError(null)

        try {
            let willData: WillAccountData | null = null
            try {
                willData = await (program.account as any).willAccount.fetch(willPda) as WillAccountData
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

            let solBalance = 0
            try {
                const vaultData = await (program.account as any).vault.fetch(vaultPda) as VaultData
                solBalance = (vaultData.solBalance as BN).toNumber() / LAMPORTS_PER_SOL
            } catch { }

            const splAssets: Asset[] = []
            if (willData && Array.isArray((willData as any).assets)) {
                const rawAssets = (willData as any).assets as Array<{ mint: PublicKey; balance: BN }>
                await Promise.allSettled(rawAssets.map(async ({ mint, balance }) => {
                    const mintStr = mint.toBase58()
                    const meta = TOKEN_META[mintStr]
                    let decimals = meta?.decimals ?? 6
                    try { decimals = (await getMint(conn, mint)).decimals } catch { }
                    const amount = balance.toNumber() / Math.pow(10, decimals)
                    splAssets.push({
                        symbol: meta?.symbol ?? mintStr.slice(0, 6),
                        mint: mintStr,
                        amount,
                        usdPrice: 0,
                        usdValue: 0,
                        icon: meta?.icon,
                    })
                }))
            }

            const solAsset: Asset = { symbol: 'SOL', amount: solBalance, usdPrice: 0, usdValue: 0 }
            const allAssets = [solAsset, ...splAssets].filter(a => a.amount > 0)

            storeActions().setVaultAccount({
                sol: solBalance,
                usdc: splAssets.find(a => a.symbol === 'USDC')?.amount ?? 0,
                totalUsdValue: 0,
                assets: allAssets,
            })

            const heirAccounts = await (program.account as any).heir.all()
            storeActions().setHeirs(heirAccounts.map(({ publicKey, account }: any) => ({
                id: publicKey.toBase58(),
                walletAddress: (account.walletAddress as PublicKey).toBase58(),
                shareBps: (account.bps / 100) as number,
                onChain: true,
            })))

        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            setError(e)
            console.error('[useAnchorProvider] refresh failed:', e)
        } finally {
            setLoading(false)
        }
    }, [wallet.ready, wallet.publicKey, program])
    const hasInitialFetched = useRef(false)

    /* ── 3. Auto-refresh once — only on first ready ──────────── */
    useEffect(() => {
        if (
            wallet.ready &&
            wallet.address &&
            program &&
            willPdaRef.current &&
            vaultPdaRef.current &&
            !hasInitialFetched.current  // ← gate: only run once
        ) {
            hasInitialFetched.current = true
            refresh()
        }
    }, [wallet.ready, wallet.address, program])

    return { loading, error, refresh, program, pdas: { willPda: willPdaRef.current, vaultPda: vaultPdaRef.current }, Heirs }
}

/* ─── bs58 encode ───────────────────────────────────────────────── */
function bs58Encode(buf: Buffer): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const digits = [0]
    for (let i = 0; i < buf.length; i++) {
        let carry = buf[i]
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8
            digits[j] = carry % 58
            carry = (carry / 58) | 0
        }
        while (carry > 0) {
            digits.push(carry % 58)
            carry = (carry / 58) | 0
        }
    }
    let str = ''
    for (let k = 0; buf[k] === 0 && k < buf.length - 1; k++) str += '1'
    for (let k = digits.length - 1; k >= 0; k--) str += ALPHABET[digits[k]]
    return str
}