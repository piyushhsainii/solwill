'use client'

import { useCallback, useState } from 'react'
import {
    AnchorProvider,
    BN,
    Program,
    type Idl,
    type IdlAccounts,
} from '@coral-xyz/anchor'
import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction,
} from '@solana/web3.js'
import toast from 'react-hot-toast'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'

import IDL from '../idl/idl.json'
import { useSollWillWallet } from './useSolWillWallet'
import { DeadWallet } from '../idl/idl'

const PROGRAM_ID = new PublicKey('C4XA8MZn8ue2GATvTrWMCMFdKs92UbAofT64eaEwC527')
const WILL_SEED = Buffer.from('will')
const VAULT_SEED = Buffer.from('vault')
const HEIR_SEED = Buffer.from('heir')
const RPC_URL = clusterApiUrl('devnet')

export type WillClaimStatus = 'active' | 'triggered' | 'claimed' | 'loading' | 'not_found' | 'error'

export interface WillClaimInfo {
    willPda: string
    ownerPk: string
    lastCheckIn: number
    interval: number
    claimed: boolean
    totalBps: number
    heirCount: number
    vaultSolBalance: number     // in SOL
    status: WillClaimStatus
    secondsUntilExpiry: number  // negative means expired
    heirBps: number | null      // bps for the connected wallet, null if not an heir
    heirPda: string | null
}

/* ─── Load will info by owner pubkey ─────────────────────────────── */
export async function loadWillClaimInfo(
    ownerPubkeyStr: string,
    claimerPubkeyStr: string | null
): Promise<WillClaimInfo> {
    const connection = new Connection(RPC_URL, 'confirmed')

    let ownerPk: PublicKey
    try {
        ownerPk = new PublicKey(ownerPubkeyStr.trim())
    } catch {
        throw new Error('Invalid owner public key')
    }

    const [willPda] = PublicKey.findProgramAddressSync(
        [WILL_SEED, ownerPk.toBuffer()], PROGRAM_ID
    )
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID
    )

    // Minimal provider (read-only, no wallet needed)
    const provider = new AnchorProvider(
        connection,
        {
            publicKey: ownerPk,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any[]) => txs
        } as any,
        { commitment: 'confirmed' }
    )
    const program = new Program<DeadWallet>(IDL as Idl, provider)

    // Fetch will account
    let willData: IdlAccounts<DeadWallet>['willAccount']
    try {
        willData = await (program.account as any).willAccount.fetch(willPda)
    } catch {
        throw new Error('Will account not found for this public key')
    }

    // Fetch vault SOL balance
    let vaultSolBalance = 0
    try {
        const vaultData = await program.account.willAccount.fetch(willPda);
        console.log(vaultData)
        vaultSolBalance = (vaultData.totalBal) / 1_000_000_000
    } catch { }

    const lastCheckIn = (willData.lastCheckIn as BN).toNumber()
    const interval = (willData.interval as BN).toNumber()
    const claimed = willData.claimed as boolean
    const nowSecs = Math.floor(Date.now() / 1000)
    const expiresAt = lastCheckIn + interval
    const secondsUntilExpiry = expiresAt - nowSecs

    let status: WillClaimStatus = 'active'
    if (claimed) status = 'claimed'
    else if (secondsUntilExpiry <= 0) status = 'triggered'

    // Check if claimer is an heir
    let heirBps: number | null = null
    let heirPda: string | null = null

    if (claimerPubkeyStr) {
        try {
            const claimerPk = new PublicKey(claimerPubkeyStr.trim())
            const [heirPdaKey] = PublicKey.findProgramAddressSync(
                [HEIR_SEED, claimerPk.toBuffer(), willPda.toBuffer()],
                PROGRAM_ID
            )
            const heirData = await (program.account as any).heir.fetch(heirPdaKey)
            heirBps = heirData.bps as number
            heirPda = heirPdaKey.toBase58()
        } catch {
            // Not an heir — heirBps stays null
        }
    }

    return {
        willPda: willPda.toBase58(),
        ownerPk: ownerPk.toBase58(),
        lastCheckIn,
        interval,
        claimed,
        totalBps: willData.totalBps as number,
        heirCount: willData.heirCount as number,
        vaultSolBalance,
        status,
        secondsUntilExpiry,
        heirBps,
        heirPda,
    }
}

/* ═══════════════════════════════════════════════════════════════════
   useClaimWill
   ═══════════════════════════════════════════════════════════════════ */
export function useClaimWill() {
    const { raw, ready, loading: walletLoading, connected, publicKey } = useSollWillWallet()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const claimWill = useCallback(
        async (ownerPubkeyStr: string): Promise<boolean> => {
            try {
                if (!ready || walletLoading) { toast.error('Wallet still loading...'); return false }
                if (!connected || !publicKey || !raw) { toast.error('Please connect wallet.'); return false }

                let ownerPk: PublicKey
                try {
                    ownerPk = new PublicKey(ownerPubkeyStr.trim())
                } catch {
                    toast.error('Invalid owner public key')
                    return false
                }

                const connection = new Connection(RPC_URL, 'confirmed')
                const provider = new AnchorProvider(connection, raw as any, { commitment: 'confirmed' })
                const program = new Program<DeadWallet>(IDL as Idl, provider)

                const claimerPk = publicKey

                const [willPda] = PublicKey.findProgramAddressSync(
                    [WILL_SEED, ownerPk.toBuffer()], PROGRAM_ID
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [VAULT_SEED, willPda.toBuffer()], PROGRAM_ID
                )
                const [heirPda] = PublicKey.findProgramAddressSync(
                    [HEIR_SEED, claimerPk.toBuffer(), willPda.toBuffer()],
                    PROGRAM_ID
                )

                setLoading(true)
                setError(null)

                console.log('[claimWill] claiming...', {
                    ownerPk: ownerPk.toBase58(),
                    claimerPk: claimerPk.toBase58(),
                    willPda: willPda.toBase58(),
                    vaultPda: vaultPda.toBase58(),
                    heirPda: heirPda.toBase58(),
                })

                const toastId = toast.loading('Claiming your inheritance...')

                const ix = await program.methods
                    .claimLl()
                    .accounts({
                        signer: claimerPk,
                        willAccountAddress: ownerPk,
                        // willAccount: willPda,
                        // heirAccount: heirPda,
                        heirAccountAddress: claimerPk,
                        tokenProgram: ""
                        // vaultAccount: vaultPda,
                    })
                    .instruction()

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash('confirmed')

                const tx = new Transaction({
                    feePayer: claimerPk,
                    blockhash,
                    lastValidBlockHeight,
                }).add(ix)

                const serializedTx = new Uint8Array(
                    tx.serialize({ requireAllSignatures: false, verifySignatures: false })
                )

                let signature: string
                try {
                    const result = await raw.signAndSendTransaction({
                        transaction: serializedTx,
                        chain: 'solana:devnet',
                    })
                    signature = bs58.encode(result.signature)
                    console.log('[claimWill] Phantom returned signature:', signature)
                } catch (signErr) {
                    console.error('[claimWill] Phantom rejected:', signErr)
                    throw signErr
                }

                await connection.confirmTransaction(
                    { signature, blockhash, lastValidBlockHeight },
                    'confirmed'
                )
                console.log('[claimWill] confirmed!')

                toast.success('Inheritance claimed successfully!', { id: toastId })
                return true
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err))
                console.error('[claimWill] error:', e)
                setError(e)
                toast.error(parseClaimError(e))
                return false
            } finally {
                setLoading(false)
            }
        },
        [raw, ready, walletLoading, connected, publicKey]
    )

    return { claimWill, loading, error }
}

function parseClaimError(err: Error): string {
    const msg = err.message || ''
    if (msg.includes('User rejected')) return 'Transaction cancelled.'
    if (msg.includes('insufficient funds')) return 'Not enough SOL for fees.'
    if (msg.includes('willActive') || msg.includes('0x17f8')) return 'Will is still active — cannot claim yet.'
    if (msg.includes('willAlreadyClaimed') || msg.includes('0x17f7')) return 'This will has already been claimed.'
    if (msg.includes('heirNotValid') || msg.includes('0x17f6')) return 'Your wallet is not a registered heir.'
    if (msg.includes('claimFundsAccountsNotValid') || msg.includes('0x180b')) return 'Claim accounts are invalid.'
    if (msg.includes('ownerNotValid') || msg.includes('0x17f5')) return 'Owner mismatch.'
    return msg
}