'use client'

import { useCallback, useState } from 'react'
import { AnchorProvider, BN, Program, type Idl } from '@coral-xyz/anchor'
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

import IDL from '../idl/idl.json'
import type { DeadWallet } from '../idl/idl'
import { useAnchorProvider } from './useAnchorProvider'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'

const PROGRAM_ID = new PublicKey('4pHVi1JXM5BL64Z92iH57wBxqdC3DWfsLgyCG9jDnUZx')
const WILL_SEED = Buffer.from('will')
const HEIR_SEED = Buffer.from('heir')
const RPC_URL = clusterApiUrl('devnet')

export function useAddHeir() {
    const {
        raw,
        ready,
        loading: walletLoading,
        connected,
        publicKey,
    } = useSollWillWallet()

    const { refresh } = useAnchorProvider()
    const setTxPending = useWillStore((s) => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const addHeir = useCallback(
        async (heirAddress: string, bps: number): Promise<boolean> => {
            if (!raw || typeof raw.signAndSendTransaction !== 'function') {
                toast.error('Wallet disconnected. Please reconnect.')
                return false
            }
            try {
                if (!ready || walletLoading) {
                    toast.error('Wallet still loading...')
                    return false
                }

                if (!connected || !publicKey || !raw) {
                    toast.error('Please connect wallet.')
                    return false
                }

                if (bps <= 0 || bps > 10000) {
                    toast.error('BPS must be between 1 and 10000.')
                    return false
                }

                let heirPk: PublicKey
                try {
                    heirPk = new PublicKey(heirAddress)
                } catch {
                    toast.error('Invalid heir address.')
                    return false
                }

                const connection = new Connection(RPC_URL, 'confirmed')

                const provider = new AnchorProvider(connection, raw as any, {
                    commitment: 'confirmed',
                })

                const program = new Program<DeadWallet>(IDL as Idl, provider)

                const ownerPk = publicKey

                // Derive PDAs
                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()],
                    PROGRAM_ID
                )

                const [heirPda] = PublicKey.findProgramAddressSync(
                    [HEIR_SEED, heirPk.toBuffer(), willPda.toBuffer()],
                    PROGRAM_ID
                )

                setLoading(true)
                setTxPending(true)
                setError(null)

                const toastId = toast.loading('Adding heir...')

                console.log('[addHeir] building instruction...', {
                    ownerPk: ownerPk.toBase58(),
                    heirPk: heirPk.toBase58(),
                    willPda: willPda.toBase58(),
                    heirPda: heirPda.toBase58(),
                    bps,
                })

                // IDL accounts: signer, heirAccount (PDA), willAccount (PDA), heirOriginalAddress, systemProgram
                const ix = await program.methods
                    .addHeirsToWill(bps)
                    .accounts({
                        signer: ownerPk,
                        heirOriginalAddress: heirPk,
                    })
                    .instruction()

                console.log('[addHeir] instruction built:', ix)

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
                    console.log('[createWill] serialized tx byteLength:', serializedTx.byteLength)
                    console.log('[createWill] is Uint8Array:', serializedTx instanceof Uint8Array)
                } catch (serErr) {
                    console.error('[createWill] serialization failed:', serErr)
                    throw serErr
                }

                console.log('[addHeir] sending to Phantom...')
                const logs = await connection.simulateTransaction(tx)
                console.log(logs)

                const result = await raw.signAndSendTransaction({
                    transaction: serializedTx,
                    chain: 'solana:devnet',
                })
                const signature = bs58.encode(result.signature)
                console.log('[addHeir] signature:', signature)

                await connection.confirmTransaction(
                    { signature, blockhash, lastValidBlockHeight },
                    'confirmed'
                )

                console.log('[addHeir] confirmed!')
                toast.success('Heir added!', { id: toastId })

                // await refresh()

                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error(e)
                setError(e)
                toast.error(parseAnchorError(e))
                return false
            } finally {
                setLoading(false)
                setTxPending(false)
            }
        },
        [raw, ready, walletLoading, connected, publicKey, refresh, setTxPending]
    )

    return { addHeir, loading, error }
}

function parseAnchorError(err: Error): string {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('already in use')) return 'Heir already added.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    if (msg.includes('signTransaction')) return 'Wallet cannot sign transaction.'
    if (msg.includes('exceeds 10000')) return 'Total BPS would exceed 100%.'
    return msg
}