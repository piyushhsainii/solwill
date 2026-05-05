'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ExternalLink, Copy, Check, Loader2 } from 'lucide-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Asset, useWillStore } from '@/app/store/useWillStore'

/* ─── Live SOL price ─────────────────────────────────────────────── */
function useSolPrice() {
    const [price, setPrice] = useState<number | null>(null)
    const controllerRef = useRef<AbortController | null>(null)
    useEffect(() => {
        let cancelled = false
        const fetchPrice = async () => {
            controllerRef.current?.abort()
            controllerRef.current = new AbortController()
            try {
                const res = await fetch(
                    'https://lite-api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112',
                    { signal: controllerRef.current.signal }
                )
                const json = await res.json()
                const p = json?.data?.['So11111111111111111111111111111111111111112']?.price
                if (!cancelled && p != null) { setPrice(Number(p)); return }
            } catch (err: any) { if (err?.name === 'AbortError') return }
            try {
                const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
                const json = await res.json()
                if (!cancelled && json?.solana?.usd) setPrice(Number(json.solana.usd))
            } catch { }
        }
        fetchPrice()
        const interval = setInterval(fetchPrice, 30_000)
        return () => { cancelled = true; clearInterval(interval); controllerRef.current?.abort() }
    }, [])
    return price
}

interface MintDetails {
    address: string
    decimals: number
    supply: string
    isInitialized: boolean
    freezeAuthority: string | null
    mintAuthority: string | null
}

function shortAddr(addr: string) {
    if (!addr || addr.length < 12) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`
}

/* ─── Token detail dialog ────────────────────────────────────────── */
function TokenDialog({ token, onClose }: { token: Asset; onClose: () => void }) {
    const [details, setDetails] = useState<MintDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const isSol = !token.mint || token.symbol === 'SOL'

    useEffect(() => {
        if (isSol) return  // SOL has no mint — skip entirely

        if (!token.mint) { setError('No mint address available.'); return }

        let cancelled = false
        setLoading(true)
        setError(null)
        setDetails(null)

        async function fetchMint() {
            try {
                const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
                const mintPubkey = new PublicKey(token.mint!)

                // Try both programs — handles standard SPL and Token-2022
                let mintInfo = null
                for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
                    try {
                        mintInfo = await getMint(connection, mintPubkey, 'confirmed', programId)
                        break
                    } catch { }
                }

                if (!mintInfo) throw new Error('Not found on either token program.')

                if (!cancelled) {
                    setDetails({
                        address: token.mint!,
                        decimals: mintInfo.decimals,
                        supply: mintInfo.supply.toString(),
                        isInitialized: mintInfo.isInitialized,
                        freezeAuthority: mintInfo.freezeAuthority?.toBase58() ?? null,
                        mintAuthority: mintInfo.mintAuthority?.toBase58() ?? null,
                    })
                }
            } catch {
                if (!cancelled) setError('Could not fetch mint data from blockchain.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchMint()
        return () => { cancelled = true }
    }, [token.mint, isSol])

    function copyAddr() {
        if (!token.mint) return
        navigator.clipboard.writeText(token.mint)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
    }

    const Row = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg)', border: '1px solid var(--border)', gap: '12px',
        }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
            <span style={{
                fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
                fontFamily: mono ? 'monospace' : 'inherit',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{value}</span>
        </div>
    )

    const HoldingsRow = () => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--primary)', marginTop: '4px', gap: '12px',
        }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>Your holdings</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', fontFamily: 'monospace' }}>
                {token.amount.toLocaleString()} {token.symbol}
            </span>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(26,26,24,0.38)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '420px',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 24px 64px rgba(36,43,53,0.16)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 20px 16px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {token.icon
                            ? <img src={token.mint == '6vksGfmFm9xQHxnMWEhJUj3GnC5r8d2jUxzJHZ26txLq' ? "https://sync-pay-six.vercel.app/palm-tree.svg" : token.icon} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt={token.symbol} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            : <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>{token.symbol?.[0] ?? '?'}</span>
                        }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{token.symbol}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Token details</div>
                    </div>
                    <button onClick={onClose} style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
                        transition: 'all 0.15s ease',
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Mint address — SPL only */}
                {!isSol && token.mint && (
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Mint Address
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                                {token.mint}
                            </span>
                            <button onClick={copyAddr} style={{ flexShrink: 0, padding: '5px 10px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', transition: 'all 0.15s ease' }}>
                                {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <a href={`https://explorer.solana.com/address/${token.mint}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                                style={{ flexShrink: 0, padding: '5px 8px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s ease', textDecoration: 'none' }}>
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                )}

                {/* Dialog body */}
                <div style={{ padding: '20px' }}>
                    {/* SOL — static info, no RPC needed */}
                    {isSol && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Row label="Network" value="Solana (Native)" />
                            <Row label="Decimals" value="9" mono />
                            <Row label="Type" value="Native SOL" />
                            <HoldingsRow />
                        </div>
                    )}

                    {/* SPL — loading */}
                    {!isSol && loading && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px 0', color: 'var(--text-muted)' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                <Loader2 size={18} />
                            </motion.div>
                            <span style={{ fontSize: '14px' }}>Fetching on-chain data…</span>
                        </div>
                    )}

                    {/* SPL — error */}
                    {!isSol && error && (
                        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    {/* SPL — details */}
                    {!isSol && details && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Row label="Decimals" value={details.decimals.toString()} mono />
                            <Row label="Total Supply" value={Number(details.supply).toLocaleString()} mono />
                            <Row label="Initialized" value={details.isInitialized ? '✓ Yes' : '✗ No'} />
                            <Row label="Mint Authority" value={details.mintAuthority ? shortAddr(details.mintAuthority) : 'None (frozen)'} />
                            <Row label="Freeze Authority" value={details.freezeAuthority ? shortAddr(details.freezeAuthority) : 'None'} />
                            <HoldingsRow />
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function LockedAssets() {
    const router = useRouter()
    const [selected, setSelected] = useState<Asset | null>(null)
    const solPrice = useSolPrice()

    const { vaultAccount } = useWillStore()
    const assets = vaultAccount?.assets ?? []
    const solAsset = assets.find(a => a.symbol === 'SOL')
    const solUsdValue = solPrice != null && solAsset ? solAsset.amount * solPrice : null

    console.log(assets)

    return (
        <>
            <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',        // ✅ fills parent height
                minWidth: 0,
                boxSizing: 'border-box',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 20px 14px', gap: '12px', minWidth: 0,
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        {/* ✅ "Will Treasury" — semibold, 15px */}
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            Will Treasury
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {assets.length} token{assets.length !== 1 ? 's' : ''} secured in vault
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/manage-funds')}
                        style={{
                            flexShrink: 0, padding: '7px 16px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg)', border: '1px solid var(--border)',
                            fontSize: '13px', fontWeight: 400, color: 'var(--text-primary)',
                            cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                    >
                        Manage
                    </button>
                </div>

                {/* Token list — flex: 1 fills remaining height */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0, overflowY: 'auto' }}>
                    {assets.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>
                            No assets in vault yet
                        </div>
                    )}

                    {assets.map((asset, i) => {
                        const isSol = asset.symbol === 'SOL'
                        // ✅ SOL gets live price × amount, SPL uses stored usdValue
                        const usd = isSol ? solUsdValue : (asset.usdValue ?? null)

                        return (
                            <motion.div
                                key={i}
                                onClick={() => setSelected(asset)}
                                whileHover={{ scale: 1.008, boxShadow: 'var(--shadow-hover)' }}
                                whileTap={{ scale: 0.995 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '13px 14px', borderRadius: 'var(--radius-lg)',
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    cursor: 'pointer', minWidth: 0, overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c8c8c2' }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'var(--bg)', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, overflow: 'hidden',
                                }}>
                                    {asset.icon
                                        ? <img src={asset.mint == '6vksGfmFm9xQHxnMWEhJUj3GnC5r8d2jUxzJHZ26txLq' ? "https://sync-pay-six.vercel.app/palm-tree.svg" : asset.icon} style={{ width: '26px', height: '26px', objectFit: 'contain' }} alt={asset.symbol} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                        : <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{asset.symbol?.[0] ?? '?'}</span>
                                    }
                                </div>

                                {/* Name + subtitle */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                        {asset.symbol || shortAddr(asset.mint ?? '')}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                        {isSol ? 'Native SOL' : shortAddr(asset.mint ?? '')}
                                    </div>
                                </div>

                                {/* Amount + USD */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                        {
                                            asset.symbol !== "SOL" ?
                                                asset.amount / Math.pow(10, asset.decimals) :
                                                asset.amount
                                        }
                                        {asset.symbol}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {usd != null
                                            ? `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : isSol && solPrice === null ? 'Loading…' : '$0'
                                        }
                                    </div>
                                </div>

                                {/* Chevron */}
                                <div style={{ color: 'var(--border)', flexShrink: 0 }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Add button pinned to bottom */}
                <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <motion.button
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                        onClick={() => router.push('/manage-funds')}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: 'var(--primary)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#ffffff',
                            boxShadow: '0 4px 16px rgba(36,43,53,0.22)',
                        }}
                    >
                        <Plus size={18} strokeWidth={2} />
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {selected && <TokenDialog token={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </>
    )
}