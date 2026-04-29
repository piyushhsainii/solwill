import { useCallback, useState } from 'react'
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { useWillStore } from '@/app/store/useWillStore'
import { toast } from 'sonner'
import { useSollWillWallet } from './useSolWillWallet'
import IDL from '../idl/idl.json'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { useAnchorProvider } from './useAnchorProvider'
import { useAnchor } from '@/app/(protected)/layout'
import { DeadWallet } from '../idl/idl'

const RPC_URL = clusterApiUrl('devnet')

const PROGRAM_ID = new PublicKey('55rDQhusthW8fWxRaTVaaszshovzhLRUCxdYsiAtWVHz')
const WILL_SEED = Buffer.from([119, 105, 108, 108])
const HEIR_SEED = Buffer.from([104, 101, 105, 114])

export function useRemoveHeir() {
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const removeHeir = useWillStore((s) => s.removeHeir)
    const setTxPending = useWillStore((s) => s.setTxPending)
    const { refresh } = useAnchor()

    const { raw, ready, loading, connected, publicKey } = useSollWillWallet()

    // storeId             — Zustand heir id
    // heirWalletAddress   — the heir's wallet address (used to derive the PDA)
    // newHeirAddress      — the IDL requires a newHeirAddress even on remove
    //                       pass the same address or PublicKey.default if unused
    const executeRemoveHeir = useCallback(
        async (
            storeId: string,
            heirWalletAddress: string,
            newHeirAddress: string,
            bps: number,
        ): Promise<boolean> => {
            try {
                if (!ready || loading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }

                let heirPk: PublicKey
                let newHeirPk: PublicKey
                try {
                    heirPk = new PublicKey(heirWalletAddress)
                    newHeirPk = new PublicKey(newHeirAddress)
                } catch {
                    toast.error('Invalid heir wallet address.')
                    return false
                }

                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, raw as any, { commitment: 'confirmed' })
                const program = new Program<DeadWallet>(IDL as Idl, provider)

                const ownerPk = publicKey

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()],
                    PROGRAM_ID,
                )

                const [heirPda] = PublicKey.findProgramAddressSync(
                    [HEIR_SEED, heirPk.toBuffer(), willPda.toBuffer()],
                    PROGRAM_ID,
                )

                setRemovingId(storeId)
                setTxPending(true)
                setError(null)

                console.log('[removeHeir] willPda:', willPda.toBase58())
                console.log('[removeHeir] heirPda:', heirPda.toBase58())
                console.log('[removeHeir] heirOriginalAddress:', heirPk.toBase58())

                const toastId = toast.loading('Removing heir...')

                const ix = await program.methods
                    .removeHeirFromWill(bps)
                    .accounts({
                        signer: ownerPk,
                        heirOriginalAddress: heirPk,
                        newHeirAddress: newHeirPk,
                    })
                    .instruction()

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

                toast.success('Heir removed!', { id: toastId })
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[removeHeir] error:', e)
                setError(e)
                toast.error(e.message)
                return false
            } finally {
                setRemovingId(null)
                setTxPending(false)
            }
        },
        [raw, ready, loading, connected, publicKey, removeHeir, setTxPending],
    )

    return { executeRemoveHeir, loading, removingId, error }
}