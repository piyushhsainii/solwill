'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import IDL from '../idl/idl.json'
import { DeadWallet } from '../idl/idl'
import { useAnchorProvider } from './useAnchorProvider'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'
import { buildAndSend } from '../utils/helper'

const PROGRAM_ID = new PublicKey('4pHVi1JXM5BL64Z92iH57wBxqdC3DWfsLgyCG9jDnUZx')
const RPC_URL = clusterApiUrl('devnet')

export function useUpdateInterval() {
    const { raw: wallet } = useSollWillWallet()
    const { refresh } = useAnchorProvider()
    const setTxPending = useWillStore((s) => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const anchorWallet = useMemo(() => {
        if (!wallet || typeof wallet.signAndSendTransaction !== 'function') {
            toast.error('Wallet disconnected. Please reconnect.')
            return false
        }
        if (!wallet || !wallet.address || !wallet.signTransaction) return null
        return {
            publicKey: wallet.address,
            signTransaction: (tx: any) => wallet.signTransaction!(tx),
        }
    }, [wallet])

    const program = useMemo(() => {
        if (!anchorWallet) return null
        const conn = new Connection(RPC_URL, 'confirmed')
        const provider = new AnchorProvider(conn, anchorWallet as any, { commitment: 'confirmed' })
        return new Program<DeadWallet>(IDL as any, provider)
    }, [anchorWallet])

    const updateInterval = useCallback(
        async (intervalDays: number): Promise<boolean> => {


            if (!program || !wallet) {
                toast.error('Program not ready.')
                return false
            }

            if (intervalDays < 7) {
                toast.error('Minimum interval is 7 days.')
                return false
            }

            if (intervalDays > 1825) {
                toast.error('Maximum interval is 5 years (1825 days).')
                return false
            }

            const intervalSeconds = new BN(intervalDays * 86400)

            setLoading(true)
            setTxPending(true)
            setError(null)

            const toastId = toast.loading('Updating interval…')
            const connection = new Connection(RPC_URL, 'confirmed')

            try {
                const ix = await program.methods
                    .updateWillFun(intervalSeconds)
                    .accounts({ signer: wallet.address })
                    .instruction()

                const sig = await buildAndSend(wallet, connection, ix, new PublicKey(wallet.address))


                toast.success(`Interval updated to ${intervalDays} days`, { id: toastId })
                await refresh()
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                setError(e)
                toast.error(parseError(e), { id: toastId })
                return false
            } finally {
                setLoading(false)
                setTxPending(false)
            }
        },
        [wallet, program, refresh, setTxPending]
    )

    return { updateInterval, loading, error }
}

function parseError(err: Error) {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('WillTriggered') || msg.includes('triggered')) return 'Will has been triggered and cannot be modified.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    return msg
}