'use client'

import { useCallback, useState } from 'react'
import {
    AnchorProvider,
    Program,
    type Idl,
} from '@coral-xyz/anchor'
import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction,
} from '@solana/web3.js'
import toast from 'react-hot-toast'

import IDL from '../idl/idl.json'
import type { DeadWallet } from '../idl/idl'
import { useAnchorProvider } from './useAnchorProvider'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

const PROGRAM_ID = new PublicKey('4pHVi1JXM5BL64Z92iH57wBxqdC3DWfsLgyCG9jDnUZx')
const WILL_SEED = Buffer.from('will')
const RPC_URL = clusterApiUrl('devnet')

export function useCheckinWill() {
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

    const checkinWill = useCallback(async (): Promise<boolean> => {
        try {
            if (!ready || walletLoading) {
                toast.error('Wallet still loading...')
                return false
            }

            if (!connected || !publicKey || !raw) {
                toast.error('Please connect wallet.')
                return false
            }

            const connection = new Connection(RPC_URL, 'confirmed')

            const provider = new AnchorProvider(
                connection,
                raw as any,
                { commitment: 'confirmed' }
            )

            const program = new Program<DeadWallet>(IDL as Idl, provider)

            const ownerPk = publicKey

            // checkinWill uses 'owner' not 'signer' — derived from IDL
            const [willPda] = PublicKey.findProgramAddressSync(
                [WILL_SEED, ownerPk.toBuffer()],
                PROGRAM_ID
            )

            setLoading(true)
            setTxPending(true)
            setError(null)

            console.log('[checkinWill] checking in...', {
                ownerPk: ownerPk.toBase58(),
                willPda: willPda.toBase58(),
            })

            const toastId = toast.loading('Recording check-in...')

            // Build instruction — IDL uses 'owner' as signer for checkinWill
            const ix = await program.methods
                .checkinWill()
                .accounts({
                    owner: ownerPk,
                })
                .instruction()

            console.log('[checkinWill] instruction built:', ix)

            // Fetch blockhash
            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash('confirmed')

            // Build transaction
            const tx = new Transaction({
                feePayer: ownerPk,
                blockhash,
                lastValidBlockHeight,
            }).add(ix)

            // Serialize
            let serializedTx: Uint8Array
            try {
                serializedTx = new Uint8Array(
                    tx.serialize({ requireAllSignatures: false, verifySignatures: false })
                )
                console.log('[checkinWill] serialized tx byteLength:', serializedTx.byteLength)
            } catch (serErr) {
                console.error('[checkinWill] serialization failed:', serErr)
                throw serErr
            }

            // Send to Phantom
            console.log('[checkinWill] sending to Phantom for signing...')
            let signature: string
            try {
                const result = await raw.signAndSendTransaction({
                    transaction: serializedTx,
                    chain: 'solana:devnet',
                })
                signature = bs58.encode(result.signature)
                console.log('[checkinWill] Phantom returned signature:', signature)
            } catch (signErr) {
                console.error('[checkinWill] Phantom rejected or errored:', signErr)
                console.error('[checkinWill] signErr name:', (signErr as any)?.name)
                console.error('[checkinWill] signErr message:', (signErr as any)?.message)
                console.error('[checkinWill] signErr code:', (signErr as any)?.code)
                throw signErr
            }

            // Confirm
            console.log('[checkinWill] confirming transaction...')
            await connection.confirmTransaction(
                { signature, blockhash, lastValidBlockHeight },
                'confirmed'
            )
            console.log('[checkinWill] confirmed!')

            toast.success('Check-in recorded on-chain!', { id: toastId })

            // Refresh store with updated lastCheckIn
            await refresh()

            return true
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            console.error('[checkinWill] error:', e)
            setError(e)
            toast.error(parseCheckinError(e))
            return false
        } finally {
            setLoading(false)
            setTxPending(false)
        }
    }, [raw, ready, walletLoading, connected, publicKey, refresh, setTxPending])

    return { checkinWill, loading, error }
}

function parseCheckinError(err: Error): string {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    if (msg.includes('willDeadlinePassed') || msg.includes('0x1801')) return 'Check-in deadline already passed.'
    if (msg.includes('willAlreadyClaimed') || msg.includes('0x17f7')) return 'Will has already been claimed.'
    if (msg.includes('signTransaction')) return 'Wallet cannot sign transaction.'
    return msg
}