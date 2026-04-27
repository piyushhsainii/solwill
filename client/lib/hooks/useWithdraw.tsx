'use client'

import { useCallback, useState } from 'react'
import { AnchorProvider, BN, Program, type Idl } from '@coral-xyz/anchor'
import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction,
} from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import toast from 'react-hot-toast'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

import IDL from '../idl/idl.json'
import { useAnchorProvider } from './useAnchorProvider'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'
import { useAnchor } from '@/app/(protected)/layout'
import { DeadWallet } from '../idl/idl'

const PROGRAM_ID = new PublicKey('C4XA8MZn8ue2GATvTrWMCMFdKs92UbAofT64eaEwC527')
const WILL_SEED = Buffer.from('will')
const VAULT_SEED = Buffer.from('vault')
const RPC_URL = clusterApiUrl('devnet')

/* ─── shared tx helper ───────────────────────────────────────────── */
async function buildAndSend(
    raw: any,
    connection: Connection,
    ix: any,
    ownerPk: PublicKey
): Promise<string> {
    const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed')

    const tx = new Transaction({ feePayer: ownerPk, blockhash, lastValidBlockHeight }).add(ix)

    const serializedTx = new Uint8Array(
        tx.serialize({ requireAllSignatures: false, verifySignatures: false })
    )

    const result = await raw.signAndSendTransaction({
        transaction: serializedTx,
        chain: 'solana:devnet',
    })

    const signature = bs58.encode(result.signature)

    await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
    )

    return signature
}

/* ═══════════════════════════════════════════════════════════════════
   useWithdrawSOL
   amountLamports — raw lamport amount (u32 per IDL)
   Note: IDL uses u32 for withdrawSolToken amt, max ~4.29 SOL
   ═══════════════════════════════════════════════════════════════════ */
export function useWithdrawSOL() {
    const { raw, ready, loading: walletLoading, connected, publicKey } = useSollWillWallet()
    const { refresh } = useAnchor()
    const setTxPending = useWillStore(s => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const withdrawSOL = useCallback(
        // amountSol — human-readable SOL, e.g. 0.5
        async (amountSol: number): Promise<boolean> => {
            try {
                if (!ready || walletLoading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }
                if (amountSol <= 0) { toast.error('Amount must be greater than 0'); return false }

                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, raw as any, { commitment: 'confirmed' })
                const program = new Program<DeadWallet>(IDL as Idl, provider)

                const ownerPk = publicKey

                // IDL uses u32 for amt — max ~4.29 billion lamports (~4.29 SOL)
                const amountLamports = Math.floor(amountSol * 1_000_000_000)
                if (amountLamports > 4_294_967_295) {
                    toast.error('Amount exceeds u32 max (~4.29 SOL per withdrawal)')
                    return false
                }

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()], PROGRAM_ID
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID
                )

                setLoading(true)
                setTxPending(true)
                setError(null)

                console.log('[withdrawSOL] withdrawing', amountSol, 'SOL =', amountLamports, 'lamports')
                console.log('[withdrawSOL] willPda:', willPda.toBase58())
                console.log('[withdrawSOL] vaultPda:', vaultPda.toBase58())

                const toastId = toast.loading(`Withdrawing ${amountSol} SOL...`)

                const ix = await program.methods
                    .withdrawSolToken(amountLamports)
                    .accounts({
                        signer: ownerPk,
                    })
                    .instruction()

                const sig = await buildAndSend(raw, connection, ix, ownerPk)
                console.log('[withdrawSOL] confirmed:', sig)

                toast.success(`${amountSol} SOL withdrawn!`, { id: toastId })
                await refresh()
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[withdrawSOL] error:', e)
                setError(e)
                toast.error(parseWithdrawError(e))
                return false
            } finally {
                setLoading(false)
                setTxPending(false)
            }
        },
        [raw, ready, walletLoading, connected, publicKey, refresh, setTxPending]
    )

    return { withdrawSOL, loading, error }
}

/* ═══════════════════════════════════════════════════════════════════
   useWithdrawSPL
   mint      — token mint PublicKey
   amountRaw — raw token units (u32 per IDL)
               e.g. for USDC (6 decimals): 1 USDC = 1_000_000
   ═══════════════════════════════════════════════════════════════════ */
export function useWithdrawSPL() {
    const { raw, ready, loading: walletLoading, connected, publicKey } = useSollWillWallet()
    const { refresh } = useAnchorProvider()
    const setTxPending = useWillStore(s => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const withdrawSPL = useCallback(
        async (mint: PublicKey, amountRaw: number): Promise<boolean> => {
            try {
                if (!ready || walletLoading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }
                if (amountRaw <= 0) { toast.error('Amount must be greater than 0'); return false }
                if (amountRaw > 4_294_967_295) {
                    toast.error('Amount exceeds u32 max')
                    return false
                }

                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, raw as any, { commitment: 'confirmed' })
                const program = new Program<DeadWallet>(IDL as Idl, provider)

                const ownerPk = publicKey

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()], PROGRAM_ID
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID
                )

                // Derive ATAs
                // ownerAta: token account for owner
                const ownerAta = getAssociatedTokenAddressSync(mint, ownerPk)
                // vaultAta: token account owned by vault PDA (allowOwnerOffCurve = true)
                const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true)

                setLoading(true)
                setTxPending(true)
                setError(null)

                console.log('[withdrawSPL] mint:', mint.toBase58())
                console.log('[withdrawSPL] amount (raw):', amountRaw)
                console.log('[withdrawSPL] willPda:', willPda.toBase58())
                console.log('[withdrawSPL] vaultPda:', vaultPda.toBase58())
                console.log('[withdrawSPL] ownerAta:', ownerAta.toBase58())
                console.log('[withdrawSPL] vaultAta:', vaultAta.toBase58())

                const toastId = toast.loading('Withdrawing token...')

                const ix = await program.methods
                    .withdrawSplToken(amountRaw)
                    .accountsPartial({
                        signer: ownerPk,
                        willAccount: willPda,
                        ownerAta: ownerAta,
                        vault: vaultPda,
                        vaultMint: mint,
                        vaultAta: vaultAta,
                    })
                    .instruction()

                const sig = await buildAndSend(raw, connection, ix, ownerPk)
                console.log('[withdrawSPL] confirmed:', sig)

                toast.success('Token withdrawn!', { id: toastId })
                await refresh()
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[withdrawSPL] error:', e)
                setError(e)
                toast.error(parseWithdrawError(e))
                return false
            } finally {
                setLoading(false)
                setTxPending(false)
            }
        },
        [raw, ready, walletLoading, connected, publicKey, refresh, setTxPending]
    )

    return { withdrawSPL, loading, error }
}

/* ─── error parser ───────────────────────────────────────────────── */
function parseWithdrawError(err: Error): string {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    if (msg.includes('0x1770') || msg.includes('lowBalance')) return 'Insufficient vault balance.'
    if (msg.includes('0x1771') || msg.includes('unauthorisedDepositor')) return 'You are not the vault owner.'
    if (msg.includes('0x1775') || msg.includes('ownerNotValid')) return 'Owner mismatch.'
    if (msg.includes('0x177d') || msg.includes('vaultAtaInvalid')) return 'Vault token account does not exist.'
    if (msg.includes('0x177e') || msg.includes('mintAccountNotValid')) return 'Token mint not registered in will.'
    if (msg.includes('already in use')) return 'Account already exists.'
    return msg
}