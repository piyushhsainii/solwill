'use client'

import { useCallback, useState } from 'react'
import {
    AnchorProvider,
    BN,
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
import { useAnchorProvider } from './useAnchorProvider'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { useAnchor } from '@/app/(protected)/layout'
import { DeadWallet } from '../idl/idl'

const PROGRAM_ID = new PublicKey(
    '55rDQhusthW8fWxRaTVaaszshovzhLRUCxdYsiAtWVHz'
)

const WILL_SEED = Buffer.from('will')
const VAULT_SEED = Buffer.from('vault')
const RPC_URL = clusterApiUrl('devnet')

export function useCreateWill() {
    const {
        raw,
        ready,
        loading: walletLoading,
        connected,
        publicKey,
    } = useSollWillWallet()

    const { refresh } = useAnchor()
    const setTxPending = useWillStore((s) => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const createWill = useCallback(
        async (intervalDays: number): Promise<boolean> => {
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

                const program = new Program<DeadWallet>(
                    IDL as Idl,
                    provider
                )

                const ownerPk = publicKey
                const intervalSeconds = new BN(
                    Math.floor(intervalDays * 86400)
                )

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()],
                    PROGRAM_ID
                )

                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()],
                    PROGRAM_ID
                )

                setLoading(true)
                setTxPending(true)
                setError(null)

                const toastId = toast.loading('Creating will...')

                // 1. Build the instruction
                console.log('[createWill] building instruction...', {
                    ownerPk: ownerPk.toBase58(),
                    intervalSeconds: intervalSeconds.toNumber(),
                    willPda: willPda.toBase58(),
                    vaultPda: vaultPda.toBase58(),
                })
                const ix = await program.methods
                    .initialize(intervalSeconds)
                    .accounts({ signer: ownerPk })
                    .instruction()
                console.log('[createWill] instruction built:', ix)

                // 2. Fetch blockhash
                console.log('[createWill] fetching blockhash...')
                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash('confirmed')
                console.log('[createWill] blockhash:', blockhash)

                // 3. Build transaction
                const tx = new Transaction({
                    feePayer: ownerPk,
                    blockhash,
                    lastValidBlockHeight,
                }).add(ix)
                console.log('[createWill] transaction built, instructions:', tx.instructions.length)

                // 4. Serialize
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

                console.log('[createWill] sending to Phantom for signing...')
                let signature: string
                try {
                    const result = await raw.signAndSendTransaction({
                        transaction: serializedTx,
                        chain: 'solana:devnet',
                    })
                    signature = bs58.encode(result.signature)
                    console.log('[createWill] Phantom returned signature:', signature)
                    console.log('[createWill] Phantom returned signature:', signature)
                } catch (signErr) {
                    console.error('[createWill] Phantom rejected or errored:', signErr)
                    console.error('[createWill] signErr name:', (signErr as any)?.name)
                    console.error('[createWill] signErr message:', (signErr as any)?.message)
                    console.error('[createWill] signErr code:', (signErr as any)?.code)
                    throw signErr
                }

                // 6. Confirm
                console.log('[createWill] confirming transaction...')
                await connection.confirmTransaction(
                    { signature, blockhash, lastValidBlockHeight },
                    'confirmed'
                )
                console.log('[createWill] confirmed!')

                toast.success('Will created!', { id: toastId })

                await refresh()

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

    return { createWill, loading, error }
}

function parseAnchorError(err: Error): string {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('already in use')) return 'Will already exists.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    if (msg.includes('signTransaction')) return 'Wallet cannot sign transaction.'
    return msg
}