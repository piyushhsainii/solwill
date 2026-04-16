/**
 * useAnchorProvider.ts
 *
 * Loads on-chain state from the `dead_wallet` Anchor program and hydrates
 * useWillStore. Call `refresh()` any time you need to re-sync after a tx.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
    AnchorProvider,
    BN,
    Program,
    type IdlAccounts,
    setProvider,
} from '@coral-xyz/anchor'
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js'
import { getMint } from '@solana/spl-token'
import { usePrivy, useWallets } from '@privy-io/react-auth'

import { useWillStore, type Asset, type Heir } from '../../app/store/useWillStore'
import IDL from '../idl/idl.json'
import { DeadWallet } from '../idl/idl'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSollWillWallet } from './useSolWillWallet'

/* ─── Constants ─────────────────────────────────────────────────── */

const PROGRAM_ID = new PublicKey('Mxa8zNFzuZdNAcoRuJDXMD5XccdmJrarcAyrW24DuQa')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.mainnet-beta.solana.com'

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

/* ─── IDL type helpers ──────────────────────────────────────────── */

type WillAccountData = IdlAccounts<DeadWallet>['willAccount']
type VaultData = IdlAccounts<DeadWallet>['vault']
type HeirData = IdlAccounts<DeadWallet>['heir']

/* ─── Status derivation ─────────────────────────────────────────── */

type WillStatus = 'Active' | 'Grace Period' | 'Triggered' | 'Paused'

function deriveWillStatus(
    lastCheckIn: number,
    interval: number,
    claimed: boolean,
): WillStatus {
    if (claimed) return 'Triggered'
    const nowSec = Math.floor(Date.now() / 1000)
    const lateBy = nowSec - (lastCheckIn + interval)
    if (lateBy <= 0) return 'Active'
    if (lateBy <= 3 * 24 * 60 * 60) return 'Grace Period'
    return 'Triggered'
}

/* ─── Hook return type ──────────────────────────────────────────── */

export interface UseAnchorProviderReturn {
    loading: boolean
    error: Error | null
    refresh: () => Promise<void>
    program: Program<DeadWallet> | null
    pdas: {
        willPda: PublicKey | null
        vaultPda: PublicKey | null
    }
}

/* ─── Main hook ─────────────────────────────────────────────────── */

export function useAnchorProvider(): UseAnchorProviderReturn {
    const {
        ready,
        loading: walletLoading,
        connected: walletConnected,
        address,
        publicKey,
        signTransaction,
        signAllTransactions,
    } = useSollWillWallet()

    /* read store state */
    const willAccount = useWillStore((s) => s.willAccount)
    const vaultAccount = useWillStore((s) => s.vaultAccount)
    const connected = useWillStore((s) => s.connected)

    /* actions */
    const setWallet = useWillStore((s) => s.setWallet)
    const setState = useWillStore.setState

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [program, setProgram] =
        useState<Program<DeadWallet> | null>(null)

    const willPdaRef = useRef<PublicKey | null>(null)
    const vaultPdaRef = useRef<PublicKey | null>(null)

    /* ── 1. Init Anchor provider ───────────────────────────── */
    useEffect(() => {
        if (!ready || walletLoading) {
            setLoading(true)
            return
        }

        // if address exists, user is connected in app terms
        if (address) {
            setState({ connected: true })
            setWallet(address)
        }

        // signer not ready yet
        if (!address || !publicKey || !signTransaction) {
            setLoading(false)
            return
        }

        const init = async () => {
            try {
                setLoading(true)
                setError(null)

                const conn = new Connection(RPC_URL, 'confirmed')

                const anchorWallet = {
                    publicKey,
                    signTransaction,
                    signAllTransactions:
                        signAllTransactions ??
                        (async (txs: any[]) =>
                            Promise.all(txs.map(signTransaction))),
                }

                const provider = new AnchorProvider(
                    conn,
                    anchorWallet as any,
                    { commitment: 'confirmed' }
                )

                setProvider(provider)

                const prog = new Program<DeadWallet>(
                    IDL as any,
                    provider
                )

                setProgram(prog)

                const [willPda] =
                    PublicKey.findProgramAddressSync(
                        [WILL_SEED, publicKey.toBuffer()],
                        PROGRAM_ID
                    )

                const [vaultPda] =
                    PublicKey.findProgramAddressSync(
                        [VAULT_SEED, willPda.toBuffer()],
                        PROGRAM_ID
                    )

                willPdaRef.current = willPda
                vaultPdaRef.current = vaultPda
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error(String(err))
                )
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [
        ready,
        walletLoading,
        address,
        publicKey,
        signTransaction,
        signAllTransactions,
    ])

    /* ── 2. Fetch on-chain state ───────────────────────────── */
    const refresh = useCallback(async () => {
        if (
            !ready ||
            !program ||
            !publicKey ||
            !willPdaRef.current ||
            !vaultPdaRef.current
        ) {
            return
        }

        const ownerPk = publicKey
        const willPda = willPdaRef.current
        const vaultPda = vaultPdaRef.current
        const conn = program.provider.connection

        setLoading(true)
        setError(null)

        try {
            let willData: WillAccountData | null = null

            try {
                willData = await (
                    program.account as any
                ).willAccount.fetch(
                    willPda
                ) as WillAccountData
            } catch {
                setState({
                    willAccount: null,
                })
            }

            if (willData) {
                const lastCheckIn = (
                    willData.lastCheckIn as BN
                ).toNumber()

                const interval = (
                    willData.interval as BN
                ).toNumber()

                setState({
                    willAccount: {
                        lastCheckin: lastCheckIn,
                        interval,
                        nextCheckin:
                            lastCheckIn + interval,
                        createdAt: lastCheckIn,
                        status: deriveWillStatus(
                            lastCheckIn,
                            interval,
                            willData.claimed as boolean
                        ),
                    },
                })
            }

            let solBalance = 0

            try {
                const vaultData = await (
                    program.account as any
                ).vault.fetch(vaultPda) as VaultData

                solBalance =
                    (
                        vaultData.solBalance as BN
                    ).toNumber() /
                    LAMPORTS_PER_SOL
            } catch { }

            const splAssets: Asset[] = []

            if (
                willData &&
                Array.isArray((willData as any).assets)
            ) {
                const rawAssets = (
                    willData as any
                ).assets as Array<{
                    mint: PublicKey
                    balance: BN
                }>

                await Promise.allSettled(
                    rawAssets.map(
                        async ({ mint, balance }) => {
                            const mintStr =
                                mint.toBase58()

                            const meta =
                                TOKEN_META[mintStr]

                            let decimals =
                                meta?.decimals ?? 6

                            try {
                                const mintInfo =
                                    await getMint(
                                        conn,
                                        mint
                                    )

                                decimals =
                                    mintInfo.decimals
                            } catch { }

                            const amount =
                                balance.toNumber() /
                                Math.pow(
                                    10,
                                    decimals
                                )

                            let usdPrice = 0

                            try {
                                const res =
                                    await fetch(
                                        `https://price.jup.ag/v6/price?ids=${mintStr}`
                                    )

                                const json =
                                    await res.json()

                                usdPrice =
                                    json?.data?.[
                                        mintStr
                                    ]?.price ?? 0
                            } catch { }

                            splAssets.push({
                                symbol:
                                    meta?.symbol ??
                                    mintStr.slice(
                                        0,
                                        6
                                    ),
                                mint: mintStr,
                                amount,
                                usdPrice,
                                usdValue:
                                    amount *
                                    usdPrice,
                                icon: meta?.icon,
                            })
                        }
                    )
                )
            }

            let solUsdPrice = 0

            try {
                const res = await fetch(
                    'https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112'
                )

                const json = await res.json()

                solUsdPrice =
                    json?.data?.[
                        'So11111111111111111111111111111111111111112'
                    ]?.price ?? 0
            } catch { }

            const solAsset: Asset = {
                symbol: 'SOL',
                amount: solBalance,
                usdPrice: solUsdPrice,
                usdValue:
                    solBalance * solUsdPrice,
            }

            const allAssets = [
                solAsset,
                ...splAssets,
            ].filter((a) => a.amount > 0)

            const totalUsd = allAssets.reduce(
                (sum, a) => sum + a.usdValue,
                0
            )

            setState({
                vaultAccount: {
                    sol: solBalance,
                    usdc:
                        splAssets.find(
                            (a) =>
                                a.symbol === 'USDC'
                        )?.amount ?? 0,
                    totalUsdValue: totalUsd,
                    assets: allAssets,
                },
            })

            const heirAccounts =
                await conn.getProgramAccounts(
                    PROGRAM_ID,
                    {
                        commitment: 'confirmed',
                        filters: [
                            {
                                memcmp: {
                                    offset: 0,
                                    bytes:
                                        bs58Encode(
                                            HEIR_DISCRIMINATOR
                                        ),
                                },
                            },
                            {
                                memcmp: {
                                    offset: 10,
                                    bytes:
                                        ownerPk.toBase58(),
                                },
                            },
                        ],
                    }
                )

            const parsedHeirs: Heir[] =
                heirAccounts.map(
                    ({ pubkey, account }) => {
                        const decoded = (
                            program.account as any
                        ).heir.coder.accounts.decode(
                            'heir',
                            account.data
                        ) as HeirData

                        return {
                            id: pubkey.toBase58(),
                            walletAddress: (
                                decoded.walletAddress as PublicKey
                            ).toBase58(),
                            shareBps:
                                decoded.bps as number,
                        }
                    }
                )

            setState({
                heirs: parsedHeirs,
            })
        } catch (err) {
            const e =
                err instanceof Error
                    ? err
                    : new Error(String(err))

            setError(e)
        } finally {
            setLoading(false)
        }
    }, [ready, program, publicKey, setState])

    /* ── 3. Auto refresh ───────────────────────────────────── */
    useEffect(() => {
        if (
            ready &&
            walletConnected &&
            program &&
            address
        ) {
            refresh()
        }
    }, [
        ready,
        walletConnected,
        address,
        program,
        refresh,
    ])

    return {
        loading,
        error,
        refresh,
        program,
        pdas: {
            willPda: willPdaRef.current,
            vaultPda: vaultPdaRef.current,
        },
    }
}

/* ─── bs58 encode helper ────────────────────────────────────────── */
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