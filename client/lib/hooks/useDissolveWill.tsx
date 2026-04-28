'use client'

import { useCallback, useState } from 'react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import toast from 'react-hot-toast'
import IDL from '../idl/idl.json'
import { useWillStore } from '@/app/store/useWillStore'
import { useSollWillWallet } from './useSolWillWallet'
import { buildAndSend } from '../utils/helper'
import { useAnchor } from '@/app/(protected)/layout'
import { DeadWallet } from '../idl/idl'

const RPC_URL = clusterApiUrl('devnet')

export function useDissolveWill() {
    const { raw: wallet } = useSollWillWallet()
    const { refresh } = useAnchor()
    const setTxPending = useWillStore((s) => s.setTxPending)
    const PROGRAM_ID = new PublicKey('ApK5v1ibJDetC9xiHywNGiWPN2hMu7zm4RQxGaiFsMvr')

    const HEIR_SEED = Buffer.from('heir')

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
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('vault'), willPda.toBuffer()],
                    program.programId
                )

                // ── Fetch on-chain will account ──────────────────────────
                const willData = await program.account.willAccount.fetch(willPda) as any
                const onChainAssets = willData.assets as Array<{ mint: PublicKey }>
                const onChainHeirCount = willData.heirCount as number

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log('[dissolveWill] on-chain will account:')
                console.log('  willPda:       ', willPda.toBase58())
                console.log('  vaultPda:      ', vaultPda.toBase58())
                console.log('  owner:         ', ownerPk.toBase58())
                console.log('  assets.len():  ', onChainAssets.length)
                console.log('  heir_count:    ', onChainHeirCount)
                console.log('  expected remainingAccounts:', (onChainAssets.length * 3) + onChainHeirCount)
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

                // ── Build asset remaining accounts ───────────────────────
                const assetAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = []

                await Promise.all(
                    onChainAssets.map(async (asset, idx) => {
                        const mintPk = asset.mint

                        // ✅ Check which token program owns this mint
                        const mintInfo = await connection.getAccountInfo(mintPk)
                        if (!mintInfo) {
                            console.warn(`[dissolveWill] asset[${idx}] mint not found on-chain:`, mintPk.toBase58())
                            return
                        }

                        const tokenProgramId = mintInfo.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()
                            ? TOKEN_2022_PROGRAM_ID
                            : TOKEN_PROGRAM_ID

                        console.log(`[dissolveWill] asset[${idx}] using token program:`, tokenProgramId.toBase58())

                        const vaultAta = getAssociatedTokenAddressSync(mintPk, vaultPda, true, tokenProgramId)
                        const ownerAta = getAssociatedTokenAddressSync(mintPk, ownerPk, false, tokenProgramId)

                        const vaultAtaInfo = await connection.getAccountInfo(vaultAta)
                        console.log(`  mint:     `, mintPk.toBase58())
                        console.log(`  vaultAta: `, vaultAta.toBase58())
                        console.log(`  ownerAta: `, ownerAta.toBase58())
                        console.log(`  vaultAta exists: `, !!vaultAtaInfo)

                        if (!vaultAtaInfo) {
                            console.warn(`[dissolveWill] skipping — vault ATA not initialized`)
                            return
                        }

                        assetAccounts.push(
                            { pubkey: vaultAta, isSigner: false, isWritable: true },
                            { pubkey: ownerAta, isSigner: false, isWritable: true },
                            { pubkey: mintPk, isSigner: false, isWritable: false },
                        )
                    })
                )

                // ── Build heir remaining accounts ────────────────────────
                const allHeirAccounts = await program.account.heir.all()
                console.log('[dissolveWill] total heir accounts on-chain (unfiltered):', allHeirAccounts.length)

                const myHeirAccounts = allHeirAccounts.filter((data) => {
                    const [expectedPda] = PublicKey.findProgramAddressSync(
                        [HEIR_SEED, data.account.walletAddress.toBuffer(), willPda.toBuffer()],
                        PROGRAM_ID
                    )
                    return expectedPda.equals(data.publicKey)

                });
                console.log('[dissolveWill] heirs belonging to this will:', myHeirAccounts.length)

                const heirRemainingAccounts = myHeirAccounts.map(({ publicKey, account }, idx) => {
                    const heirOriginalPk = account.walletAddress as PublicKey
                    const [expectedPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from('heir'), heirOriginalPk.toBuffer(), willPda.toBuffer()],
                        program.programId
                    )

                    console.log(`[dissolveWill] heir[${idx}]:`)
                    console.log(`  walletAddress: `, heirOriginalPk.toBase58())
                    console.log(`  heirPda:       `, publicKey.toBase58())
                    console.log(`  expectedPda:   `, expectedPda.toBase58())
                    console.log(`  pda match:     `, publicKey.toBase58() === expectedPda.toBase58())

                    return { pubkey: publicKey, isSigner: false, isWritable: true }
                })

                const remainingAccounts = [...assetAccounts, ...heirRemainingAccounts]

                // ── Final count check before sending ─────────────────────
                const expectedCount = (onChainAssets.length * 3) + onChainHeirCount
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log('[dissolveWill] final remainingAccounts summary:')
                console.log('  asset accounts: ', assetAccounts.length, '(expected', onChainAssets.length * 3, ')')
                console.log('  heir accounts:  ', heirRemainingAccounts.length, '(expected', onChainHeirCount, ')')
                console.log('  total passing:  ', remainingAccounts.length, '(expected', expectedCount, ')')
                console.log('  count match:    ', remainingAccounts.length === expectedCount)
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

                if (remainingAccounts.length !== expectedCount) {
                    throw new Error(
                        `[dissolveWill] account count mismatch — passing ${remainingAccounts.length}, program expects ${expectedCount}`
                    )
                }

                // ── Build instruction ────────────────────────────────────
                const ix = await program.methods
                    .dissolveWill()
                    .accounts({
                        signer: ownerPk,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .remainingAccounts(remainingAccounts)
                    .instruction()

                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
                const tx = new Transaction({ feePayer: ownerPk, blockhash, lastValidBlockHeight }).add(ix)

                const simResult = await connection.simulateTransaction(tx)
                console.log('[dissolveWill] simulation logs:', simResult.value.logs)
                console.log('[dissolveWill] simulation err: ', simResult.value.err)

                if (simResult.value.err) {
                    throw new Error(`Simulation failed: ${JSON.stringify(simResult.value.err)}`)
                }

                const sig = await buildAndSend(wallet, connection, ix, ownerPk)
                console.log('[dissolveWill] confirmed sig:', sig)

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
                console.error('[dissolveWill] error:', e)
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