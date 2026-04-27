'use client'

import { useCallback, useState } from 'react'
import { AnchorProvider, BN, Program, type Idl } from '@coral-xyz/anchor'
import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import toast from 'react-hot-toast'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

import IDL from '../idl/idl.json'
import { useAnchorProvider } from './useAnchorProvider'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'

const PROGRAM_ID = new PublicKey('C4XA8MZn8ue2GATvTrWMCMFdKs92UbAofT64eaEwC527')
const WILL_SEED = Buffer.from('will')
const VAULT_SEED = Buffer.from('vault')
const RPC_URL = clusterApiUrl('devnet')

/* ─── shared tx helper ───────────────────────────────────────────── */
import { VersionedTransaction, TransactionMessage } from '@solana/web3.js'
import { buildAndSend, getTokenProgramForMint } from '../utils/helper'
import { useAnchor } from '@/app/(protected)/layout'
import { DeadWallet } from '../idl/idl'



/* ═══════════════════════════════════════════════════════════════════
   useDepositSOL
   amountSol — human-readable SOL (e.g. 0.5), converted to lamports
   ═══════════════════════════════════════════════════════════════════ */
export function useDepositSOL() {
    const { raw, ready, loading: walletLoading, connected, publicKey } = useSollWillWallet()
    const { refresh } = useAnchor()
    const setTxPending = useWillStore(s => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const depositSOL = useCallback(
        async (amountSol: number): Promise<boolean> => {
            if (!raw || typeof raw.signAndSendTransaction !== 'function') {
                toast.error('Wallet disconnected. Please reconnect.')
                return false
            }
            try {
                if (!ready || walletLoading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }
                if (amountSol <= 0) { toast.error('Amount must be greater than 0'); return false }

                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, raw as any, { commitment: 'confirmed' })
                const program = new Program<DeadWallet>(IDL as Idl, provider)

                const ownerPk = publicKey
                const amountLamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL))

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()], PROGRAM_ID
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID
                )

                setLoading(true)
                setTxPending(true)
                setError(null)

                const toastId = toast.loading(`Depositing ${amountSol} SOL...`)

                console.log('[depositSOL] depositing', amountSol, 'SOL =', amountLamports.toNumber(), 'lamports')
                console.log('[depositSOL] willPda:', willPda.toBase58())
                console.log('[depositSOL] vaultPda:', vaultPda.toBase58())

                const ix = await program.methods
                    .depositSol(amountLamports)
                    .accounts({
                        owner: ownerPk,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction()

                console.log('[depositSOL] instruction built:', ix)

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash('confirmed')

                const tx = new Transaction({
                    feePayer: ownerPk,
                    blockhash,
                    lastValidBlockHeight,
                }).add(ix)

                let serializedTx: Uint8Array
                try {
                    serializedTx = new Uint8Array(
                        tx.serialize({ requireAllSignatures: false, verifySignatures: false })
                    )
                    console.log('[depositSOL] serialized tx byteLength:', serializedTx.byteLength)
                    console.log('[depositSOL] is Uint8Array:', serializedTx instanceof Uint8Array)
                } catch (serErr) {
                    console.error('[depositSOL] serialization failed:', serErr)
                    throw serErr
                }

                const logs = await connection.simulateTransaction(tx)
                console.log('[depositSOL] simulation:', logs)

                const result = await raw.signAndSendTransaction({
                    transaction: serializedTx,
                    chain: 'solana:devnet',
                })
                const signature = bs58.encode(result.signature)
                console.log('[depositSOL] signature:', signature)

                await connection.confirmTransaction(
                    { signature, blockhash, lastValidBlockHeight },
                    'confirmed'
                )

                console.log('[depositSOL] confirmed!')
                toast.success(`${amountSol} SOL deposited!`, { id: toastId })
                await refresh()
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[depositSOL] error:', e)
                setError(e)
                toast.error(parseDepositError(e))
                return false
            } finally {
                setLoading(false)
                setTxPending(false)
            }
        },
        [raw, ready, walletLoading, connected, publicKey, refresh, setTxPending]
    )

    return { depositSOL, loading, error }
}

/* ═══════════════════════════════════════════════════════════════════
   useDepositSPL
   mint        — token mint PublicKey
   amountRaw   — amount in token's smallest unit (e.g. for USDC with
                 6 decimals: 1 USDC = 1_000_000)
   ═══════════════════════════════════════════════════════════════════ */
export function useDepositSPL() {
    const { raw, ready, loading: walletLoading, connected, publicKey } = useSollWillWallet()
    const { refresh } = useAnchorProvider()
    const setTxPending = useWillStore(s => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const depositSPL = useCallback(
        async (mint: PublicKey, amountRaw: number): Promise<boolean> => {
            try {
                if (!ready || walletLoading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }
                if (amountRaw <= 0) { toast.error('Amount must be greater than 0'); return false }

                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, raw as any, { commitment: 'confirmed' })
                const program: Program<DeadWallet> = new Program<DeadWallet>(IDL as Idl, provider)

                const ownerPk = publicKey
                const amount = new BN(amountRaw)

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()], PROGRAM_ID
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID
                )

                setLoading(true)
                setTxPending(true)
                setError(null)

                console.log('[depositSPL] mint:', mint.toBase58())
                console.log('[depositSPL] amount (raw):', amountRaw)
                console.log('[depositSPL] willPda:', willPda.toBase58())
                console.log('[depositSPL] vaultPda:', vaultPda.toBase58())

                const tokenProgram = await getTokenProgramForMint(connection, mint)
                const toastId = toast.loading('Depositing token...')

                const [ownerAta] = PublicKey.findProgramAddressSync([ownerPk.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)
                console.log(`OWNER ATA`, ownerAta.toBase58())

                const [vaultAta] = PublicKey.findProgramAddressSync([vaultPda.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)
                console.log(`VAULT ATA`, vaultAta.toBase58())

                // Anchor resolves ownerAta and vaultAta automatically from the IDL seeds
                const ix = await program.methods
                    .depositSplTokens(amount)
                    .accountsPartial({
                        owner: ownerPk,
                        mint: mint,
                        ownerAta,
                        vaultAta: vaultAta,
                        vault: vaultPda,
                        willAccount: willPda,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: tokenProgram,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,

                    })
                    .instruction()
                const bx = await connection.getLatestBlockhash('confirmed')
                const tx = new Transaction({
                    feePayer: ownerPk,
                    blockhash: bx.blockhash,
                    lastValidBlockHeight: bx.lastValidBlockHeight

                }).add(ix)
                // const logs = await connection.simulateTransaction(tx)
                const sig = await buildAndSend(raw, connection, ix, ownerPk)
                console.log('[depositSPL] confirmed:', sig)

                toast.success('Token deposited!', { id: toastId })
                await refresh()
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[depositSPL] error:', e)
                setError(e)
                toast.error(parseDepositError(e))
                return false
            } finally {
                setLoading(false)
                setTxPending(false)
            }
        },
        [raw, ready, walletLoading, connected, publicKey, refresh, setTxPending]
    )

    return { depositSPL, loading, error }
}

/* ─── error parser ───────────────────────────────────────────────── */
function parseDepositError(err: Error): string {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    if (msg.includes('0x1775')) return 'Insufficient token balance.'       // custom 6005
    if (msg.includes('0x1774')) return 'You are not the will owner.'       // custom 6004
    if (msg.includes('0x177a')) return 'Max 5 assets allowed per will.'   // custom 6010
    if (msg.includes('already in use')) return 'Account already exists.'
    return msg
}