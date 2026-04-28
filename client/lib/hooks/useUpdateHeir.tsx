import { useCallback, useState } from 'react'
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js'
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { useWillStore } from '@/app/store/useWillStore'
import { toast } from 'sonner'
import { useSollWillWallet } from './useSolWillWallet'
import IDL from '../idl/idl.json'
import { buildAndSend } from '../utils/helper'
import { DeadWallet } from '../idl/idl'

const RPC_URL = clusterApiUrl('devnet')

const PROGRAM_ID = new PublicKey('ApK5v1ibJDetC9xiHywNGiWPN2hMu7zm4RQxGaiFsMvr')
const WILL_SEED = Buffer.from([119, 105, 108, 108])
const HEIR_SEED = Buffer.from([104, 101, 105, 114])

export function useUpdateHeir() {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const updateHeir = useWillStore((s) => s.updateHeir)
    const setTxPending = useWillStore((s) => s.setTxPending)

    const { raw, ready, loading, connected, publicKey } = useSollWillWallet()

    const executeUpdateHeir = useCallback(
        async (
            storeId: string,
            currentWalletAddress: string,
            newWalletAddress: string,
            updatedBps: number,
        ): Promise<boolean> => {
            try {
                if (!ready || loading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }
                if (updatedBps <= 0 || updatedBps > 10000) { toast.error('BPS must be between 1 and 10,000.'); return false }

                let currentHeirPk: PublicKey
                let newHeirPk: PublicKey
                try {
                    currentHeirPk = new PublicKey(currentWalletAddress)
                    newHeirPk = new PublicKey(newWalletAddress)
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

                // heirAccount PDA is derived from the CURRENT (original) heir address
                const [heirPda] = PublicKey.findProgramAddressSync(
                    [HEIR_SEED, currentHeirPk.toBuffer(), willPda.toBuffer()],
                    PROGRAM_ID,
                )

                setUpdatingId(storeId)
                setTxPending(true)
                setError(null)

                console.log('[updateHeir] willPda:', willPda.toBase58())
                console.log('[updateHeir] heirPda:', heirPda.toBase58())
                console.log('[updateHeir] currentHeir:', currentHeirPk.toBase58())
                console.log('[updateHeir] newHeir:', newHeirPk.toBase58())

                const toastId = toast.loading('Updating heir...')

                const ix = await program.methods
                    .updateHeirFromWill(updatedBps)
                    .accounts({
                        signer: ownerPk,
                        heirOriginalAddress: currentHeirPk,
                        newHeirAddress: newHeirPk,
                    })
                    .instruction()
                // const { blockhash, lastValidBlockHeight } =
                //     await connection.getLatestBlockhash('confirmed')

                // // Build transaction
                // const tx = new Transaction({
                //     feePayer: ownerPk,
                //     blockhash,
                //     lastValidBlockHeight,
                // }).add(ix)

                // // Serialize
                // let serializedTx: Uint8Array
                // try {
                //     serializedTx = new Uint8Array(
                //         tx.serialize({ requireAllSignatures: false, verifySignatures: false })
                //     )
                //     console.log('[checkinWill] serialized tx byteLength:', serializedTx.byteLength)
                // } catch (serErr) {
                //     console.error('[checkinWill] serialization failed:', serErr)
                //     throw serErr
                // }

                // // Send to Phantom
                // console.log('[checkinWill] sending to Phantom for signing...')
                // let signature: string
                // try {
                //     const result = await raw.signAndSendTransaction({
                //         transaction: serializedTx,
                //         chain: 'solana:devnet',
                //     })
                //     signature = bs58.encode(result.signature)
                //     console.log('[checkinWill] Phantom returned signature:', signature)
                // } catch (signErr) {
                //     console.error('[checkinWill] Phantom rejected or errored:', signErr)
                //     console.error('[checkinWill] signErr name:', (signErr as any)?.name)
                //     console.error('[checkinWill] signErr message:', (signErr as any)?.message)
                //     console.error('[checkinWill] signErr code:', (signErr as any)?.code)
                //     throw signErr
                // }

                // // Confirm
                // console.log('[checkinWill] confirming transaction...')
                // await connection.confirmTransaction(
                //     { signature, blockhash, lastValidBlockHeight },
                //     'confirmed'
                // )
                // console.log('[checkinWill] confirmed!')
                const sig = await buildAndSend(raw, connection, ix, ownerPk)
                console.log('[updateHeir] confirmed:', sig)
                // 
                // Mirror in Zustand — update both address and bps
                updateHeir(storeId, { walletAddress: newWalletAddress, shareBps: updatedBps })

                toast.success('Heir updated!', { id: toastId })
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[updateHeir] error:', e)
                setError(e)
                toast.error(e.message)
                return false
            } finally {
                setUpdatingId(null)
                setTxPending(false)
            }
        },
        [raw, ready, loading, connected, publicKey, updateHeir, setTxPending],
    )

    return { executeUpdateHeir, loading, updatingId, error }
}