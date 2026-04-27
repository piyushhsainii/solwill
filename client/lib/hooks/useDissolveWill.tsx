'use client'

import { useCallback, useState } from 'react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import toast from 'react-hot-toast'
import IDL from '../idl/idl.json'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'
import { buildAndSend } from '../utils/helper'
import { useAnchor } from '@/app/(protected)/layout'
import { DeadWallet } from '../idl/idl'

const RPC_URL = clusterApiUrl('devnet')

export function useDissolveWill() {
    // Read wallet identity only — no Connection, no Program, no RPC
    const { raw: wallet } = useSollWillWallet()
    const { refresh } = useAnchor()
    const setTxPending = useWillStore((s) => s.setTxPending)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const dissolveWill = useCallback(
        async (): Promise<boolean> => {
            if (!wallet?.address || !wallet.signTransaction) {
                toast.error('Wallet not connected.')
                return false
            }

            if (typeof wallet.signAndSendTransaction !== 'function') {
                toast.error('Wallet does not support signing. Please reconnect.')
                return false
            }

            setLoading(true)
            setTxPending(true)
            setError(null)

            const toastId = toast.loading('Dissolving will…')

            try {
                const ownerPk = new PublicKey(wallet.address)
                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, wallet as any)
                const program = new Program<DeadWallet>(IDL as any, provider)

                // ── Derive PDAs ──────────────────────────────────────────
                const [willPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('will'), ownerPk.toBuffer()],
                    program.programId
                )

                // ── Build remaining accounts ─────────────────────────────
                // Order: [vault_ata, owner_ata, mint] * assets.len()  then  [heir_pda] * heir_count
                const assets = useWillStore.getState().vaultAccount?.assets ?? []
                const heirs = useWillStore.getState().heirs ?? []

                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('vault'), willPda.toBuffer()],
                    program.programId
                )

                const assetAccounts = assets
                    .filter((asset) => asset.symbol !== 'SOL')  // 👈 skip SOL
                    .flatMap((asset) => {
                        const mintPk = new PublicKey(asset.mint!)
                        const vaultAta = getAssociatedTokenAddressSync(mintPk, vaultPda, true)
                        const ownerAta = getAssociatedTokenAddressSync(mintPk, ownerPk)

                        return [
                            { pubkey: vaultAta, isSigner: false, isWritable: true },
                            { pubkey: ownerAta, isSigner: false, isWritable: true },
                            { pubkey: mintPk, isSigner: false, isWritable: false },
                        ]
                    })

                const heirAccounts = heirs.map((heir) => {
                    const heirOriginalPk = new PublicKey(heir.walletAddress)
                    const [heirPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from('heir'), heirOriginalPk.toBuffer(), willPda.toBuffer()],
                        program.programId
                    )
                    return { pubkey: heirPda, isSigner: false, isWritable: true }
                })

                const remainingAccounts = [...assetAccounts, ...heirAccounts]

                const ix = await program.methods
                    .dissolveWill()
                    .accounts({
                        signer: ownerPk,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .remainingAccounts(remainingAccounts)
                    .instruction()

                const sig = await buildAndSend(wallet, connection, ix, ownerPk)
                console.log('[useDissolveWill] sig:', sig)

                toast.success('Will dissolved successfully.', { id: toastId })

                useWillStore.setState({
                    willAccount: null,
                    vaultAccount: null,
                    heirs: [],
                })

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
        [wallet?.address, refresh, setTxPending]
    )

    return { dissolveWill, loading, error }
}

function parseError(err: Error) {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('WillTriggered') || msg.includes('triggered')) return 'Will has been triggered and cannot be dissolved.'
    if (msg.includes('HeirsExist') || msg.includes('heirs')) return 'Remove all heirs before dissolving the will.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    return msg
}