'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, Clock, CheckCircle, ShieldOff, Wallet, Copy, Check } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { useSollWillWallet } from '@/lib/hooks/useSolWillWallet'
import { loadWillClaimInfo, useClaimWill, WillClaimInfo } from '@/lib/hooks/useClaimWill'

/* ─── Helpers ────────────────────────────────────────────────────── */
function formatCountdown(seconds: number): string {
    const s = Math.max(0, seconds)
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${sec}s`
    return `${m}m ${sec}s`
}

function truncate(addr: string, chars = 6) {
    return `${addr.slice(0, chars)}…${addr.slice(-4)}`
}

function bpsToPercent(bps: number): string {
    return `${(bps / 100).toFixed(2)}%`
}

/* ─── Copy button ────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8A8A82', display: 'flex' }}
        >
            {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
        </button>
    )
}

/* ─── Status badge ───────────────────────────────────────────────── */
function StatusBadge({ status }: { status: WillClaimInfo['status'] }) {
    const map = {
        active: { label: 'Active', color: '#16A34A', bg: 'rgba(22,163,74,0.08)', icon: <ShieldOff size={12} /> },
        triggered: { label: 'Triggered — Claimable', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: <AlertTriangle size={12} /> },
        claimed: { label: 'Already Claimed', color: '#8A8A82', bg: 'rgba(138,138,130,0.08)', icon: <CheckCircle size={12} /> },
        loading: { label: 'Loading...', color: '#8A8A82', bg: '#F7F7F4', icon: null },
        not_found: { label: 'Not Found', color: '#D97706', bg: 'rgba(217,119,6,0.08)', icon: <AlertTriangle size={12} /> },
        error: { label: 'Error', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: <AlertTriangle size={12} /> },
    }
    const s = map[status] ?? map.error
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: s.bg, color: s.color,
            fontSize: 11, fontWeight: 400, letterSpacing: '-0.01em',
        }}>
            {s.icon}
            {s.label}
        </div>
    )
}

/* ─── Info row ───────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false, copy }: { label: string; value: string; mono?: boolean; copy?: string }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '11px 0',
            borderBottom: '1px solid #F0F0EB',
        }}>
            <span style={{ fontSize: 12, color: '#8A8A82', letterSpacing: '-0.01em' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                    fontSize: 13, color: '#1A1A18', letterSpacing: mono ? '0.02em' : '-0.01em',
                    fontFamily: mono ? 'monospace' : 'inherit',
                }}>
                    {value}
                </span>
                {copy && <CopyButton text={copy} />}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */
export default function ClaimWillPage() {
    const { publicKey, connected } = useSollWillWallet()
    const { claimWill, loading: claiming } = useClaimWill()

    const [input, setInput] = useState('')
    const [loadingInfo, setLoadingInfo] = useState(false)
    const [info, setInfo] = useState<WillClaimInfo | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [claimSuccess, setClaimSuccess] = useState(false)
    const [focused, setFocused] = useState(false)

    // Live countdown ticker
    const [tick, setTick] = useState(0)
    useEffect(() => {
        if (!info || info.status !== 'active') return
        const t = setInterval(() => setTick(v => v + 1), 1000)
        return () => clearInterval(t)
    }, [info])

    // Recompute countdown from stored info
    const secondsLeft = info
        ? info.secondsUntilExpiry - tick
        : 0

    const handleLoad = useCallback(async () => {
        if (!input.trim()) return
        setLoadingInfo(true)
        setLoadError(null)
        setInfo(null)
        setClaimSuccess(false)
        setTick(0)

        try {
            const result = await loadWillClaimInfo(
                input.trim(),
                publicKey?.toBase58() ?? null
            )
            setInfo(result)
        } catch (err: any) {
            setLoadError(err.message || 'Failed to load will')
        } finally {
            setLoadingInfo(false)
        }
    }, [input, publicKey])

    const handleClaim = useCallback(async () => {
        if (!info) return
        const success = await claimWill(info.ownerPk)
        if (success) {
            setClaimSuccess(true)
            // Reload to reflect claimed state
            setTimeout(() => handleLoad(), 2000)
        }
    }, [info, claimWill, handleLoad])

    const isTriggered = info?.status === 'triggered'
    const isClaimed = info?.status === 'claimed'
    const isActive = info?.status === 'active'
    const isHeir = info?.heirBps != null
    const canClaim = isTriggered && isHeir && !isClaimed && connected

    const stagger = {
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
    }
    const fadeUp = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>

            <div style={{
                maxWidth: 560,
                margin: '0 auto',
                padding: '32px 20px 48px',
                boxSizing: 'border-box',
                minHeight: '100vh',
            }}>
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >

                    {/* ── Header ── */}
                    <motion.div variants={fadeUp}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A82', marginBottom: 8 }}>
                            Estate Recovery
                        </div>
                        <h1 style={{
                            fontSize: 26, fontWeight: 300,
                            color: '#1A1A18', margin: '0 0 6px',
                            letterSpacing: '-0.04em',
                        }}>
                            Claim Inheritance
                        </h1>
                        <p style={{ fontSize: 13, color: '#8A8A82', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.6 }}>
                            Enter the will owner's wallet address to check status and claim your designated share.
                        </p>
                    </motion.div>

                    {/* ── Search input ── */}
                    <motion.div variants={fadeUp}>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #E4E4DF',
                            borderRadius: 20,
                            padding: '18px 20px',
                            boxShadow: '0 2px 12px rgba(36,43,53,0.05)',
                        }}>
                            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A8A82', marginBottom: 12 }}>
                                Owner Wallet Address
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <motion.div
                                    animate={{
                                        borderColor: focused ? '#242B35' : '#E4E4DF',
                                        boxShadow: focused ? '0 0 0 3px rgba(36,43,53,0.06)' : '0 0 0 0px transparent',
                                    }}
                                    transition={{ duration: 0.18 }}
                                    style={{
                                        flex: 1,
                                        borderRadius: 12,
                                        border: '1px solid #E4E4DF',
                                        background: '#FAFAF8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 12px',
                                        gap: 8,
                                    }}
                                >
                                    <Search size={15} color="#8A8A82" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                        onKeyDown={e => e.key === 'Enter' && handleLoad()}
                                        placeholder="e.g. 5NHvrqoZk4ov5Gv…"
                                        style={{
                                            flex: 1, border: 'none', background: 'transparent',
                                            color: '#1A1A18', fontSize: 13, outline: 'none',
                                            fontFamily: 'monospace', padding: '12px 0',
                                            letterSpacing: '0.01em',
                                        }}
                                    />
                                    {input && (
                                        <button
                                            onClick={() => { setInput(''); setInfo(null); setLoadError(null) }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A82', padding: 2 }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </motion.div>

                                <motion.button
                                    whileHover={input ? { scale: 1.03 } : {}}
                                    whileTap={input ? { scale: 0.97 } : {}}
                                    onClick={handleLoad}
                                    disabled={!input.trim() || loadingInfo}
                                    style={{
                                        padding: '0 18px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: input.trim() ? '#242B35' : '#E4E4DF',
                                        color: input.trim() ? '#fff' : '#8A8A82',
                                        fontSize: 13, fontWeight: 300,
                                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                                        fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        transition: 'background 0.2s',
                                        flexShrink: 0,
                                    }}
                                >
                                    {loadingInfo ? (
                                        <div style={{
                                            width: 16, height: 16, borderRadius: '50%',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            animation: 'spin 0.6s linear infinite',
                                        }} />
                                    ) : 'Look up'}
                                </motion.button>
                            </div>

                            {!connected && (
                                <div style={{
                                    marginTop: 12, padding: '10px 12px',
                                    borderRadius: 10, background: 'rgba(217,119,6,0.07)',
                                    border: '1px solid rgba(217,119,6,0.2)',
                                    fontSize: 12, color: '#D97706',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <Wallet size={13} />
                                    Connect your wallet to check if you're a registered heir.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Load error ── */}
                    <AnimatePresence>
                        {loadError && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                style={{
                                    padding: '14px 16px', borderRadius: 14,
                                    background: 'rgba(220,38,38,0.06)',
                                    border: '1px solid rgba(220,38,38,0.2)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                <AlertTriangle size={15} color="#DC2626" />
                                <span style={{ fontSize: 13, color: '#DC2626', letterSpacing: '-0.01em' }}>
                                    {loadError}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Will info card ── */}
                    <AnimatePresence>
                        {info && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                            >
                                {/* Status card */}
                                <div style={{
                                    background: '#fff',
                                    border: '1px solid #E4E4DF',
                                    borderRadius: 20,
                                    padding: '20px',
                                    boxShadow: '0 2px 12px rgba(36,43,53,0.05)',
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'flex-start', marginBottom: 16,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A82', marginBottom: 6 }}>
                                                Will Status
                                            </div>
                                            <StatusBadge status={info.status} />
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A82', marginBottom: 4 }}>
                                                Vault Balance
                                            </div>
                                            <div style={{ fontSize: 18, fontWeight: 300, color: '#1A1A18', letterSpacing: '-0.03em' }}>
                                                {info.vaultSolBalance.toFixed(4)} SOL
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <InfoRow label="Owner" value={truncate(info.ownerPk)} mono copy={info.ownerPk} />
                                        <InfoRow label="Will PDA" value={truncate(info.willPda)} mono copy={info.willPda} />
                                        <InfoRow label="Registered Heirs" value={String(info.heirCount)} />
                                        <InfoRow
                                            label="Total Allocated"
                                            value={`${(info.totalBps / 100).toFixed(0)}%`}
                                        />
                                    </div>
                                </div>

                                {/* Countdown — only when active */}
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #E4E4DF',
                                            borderRadius: 20,
                                            padding: '20px',
                                            boxShadow: '0 2px 12px rgba(36,43,53,0.05)',
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 10,
                                                background: 'rgba(22,163,74,0.07)',
                                                border: '1px solid rgba(22,163,74,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Clock size={15} color="#16A34A" strokeWidth={1.8} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, color: '#1A1A18', letterSpacing: '-0.02em' }}>
                                                    Will is still active
                                                </div>
                                                <div style={{ fontSize: 11, color: '#8A8A82' }}>
                                                    Cannot be claimed until the owner misses their check-in
                                                </div>
                                            </div>
                                        </div>

                                        {/* Countdown bar */}
                                        <div style={{
                                            padding: '14px 16px',
                                            borderRadius: 14,
                                            background: 'rgba(22,163,74,0.05)',
                                            border: '1px solid rgba(22,163,74,0.15)',
                                        }}>
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', marginBottom: 8,
                                            }}>
                                                <span style={{ fontSize: 11, color: '#8A8A82' }}>
                                                    Time until trigger window
                                                </span>
                                                <span style={{ fontSize: 14, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                                                    {secondsLeft > 0 ? formatCountdown(secondsLeft) : 'Expired'}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: 5, borderRadius: 999,
                                                background: '#E4E4DF', overflow: 'hidden',
                                            }}>
                                                <motion.div
                                                    animate={{ width: `${Math.min(100, Math.max(0, (secondsLeft / info.interval) * 100))}%` }}
                                                    transition={{ duration: 0.5 }}
                                                    style={{
                                                        height: '100%', borderRadius: 999,
                                                        background: 'linear-gradient(90deg, #16A34A88, #16A34A)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Already claimed state */}
                                {isClaimed && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            background: 'rgba(138,138,130,0.05)',
                                            border: '1px solid #E4E4DF',
                                            borderRadius: 20,
                                            padding: '20px',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                        }}
                                    >
                                        <CheckCircle size={20} color="#8A8A82" strokeWidth={1.5} />
                                        <div>
                                            <div style={{ fontSize: 14, color: '#555550', letterSpacing: '-0.02em' }}>
                                                This will has already been claimed
                                            </div>
                                            <div style={{ fontSize: 12, color: '#8A8A82', marginTop: 2 }}>
                                                All inheritance has been distributed to the registered heirs.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Heir info card */}
                                {connected && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            background: '#fff',
                                            border: isHeir
                                                ? '1px solid rgba(22,163,74,0.3)'
                                                : '1px solid rgba(220,38,38,0.2)',
                                            borderRadius: 20,
                                            padding: '20px',
                                            boxShadow: '0 2px 12px rgba(36,43,53,0.05)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isHeir ? 14 : 0 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 10,
                                                background: isHeir ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.07)',
                                                border: isHeir ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(220,38,38,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Wallet size={15} color={isHeir ? '#16A34A' : '#DC2626'} strokeWidth={1.8} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, color: '#1A1A18', letterSpacing: '-0.02em' }}>
                                                    {isHeir ? 'You are a registered heir' : 'You are not a registered heir'}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#8A8A82' }}>
                                                    {publicKey ? truncate(publicKey.toBase58(), 8) : ''}
                                                </div>
                                            </div>
                                            {isHeir && (
                                                <div style={{
                                                    marginLeft: 'auto',
                                                    padding: '4px 12px', borderRadius: 999,
                                                    background: 'rgba(22,163,74,0.08)',
                                                    fontSize: 14, fontWeight: 300,
                                                    color: '#16A34A', letterSpacing: '-0.01em',
                                                }}>
                                                    {bpsToPercent(info.heirBps!)}
                                                </div>
                                            )}
                                        </div>

                                        {isHeir && (
                                            <div style={{
                                                padding: '12px 14px',
                                                borderRadius: 12,
                                                background: 'rgba(22,163,74,0.05)',
                                                border: '1px solid rgba(22,163,74,0.12)',
                                            }}>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                                                }}>
                                                    <span style={{ fontSize: 11, color: '#8A8A82' }}>Your share</span>
                                                    <span style={{ fontSize: 11, color: '#8A8A82' }}>Estimated SOL</span>
                                                </div>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                                                }}>
                                                    <span style={{ fontSize: 22, color: '#16A34A', fontWeight: 300, letterSpacing: '-0.04em' }}>
                                                        {bpsToPercent(info.heirBps!)}
                                                    </span>
                                                    <span style={{ fontSize: 16, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.03em' }}>
                                                        ≈ {((info.heirBps! / 10000) * info.vaultSolBalance).toFixed(4)} SOL
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {!isHeir && (
                                            <div style={{
                                                marginTop: 12, padding: '10px 12px',
                                                borderRadius: 10,
                                                background: 'rgba(220,38,38,0.05)',
                                                fontSize: 12, color: '#DC2626', letterSpacing: '-0.01em',
                                            }}>
                                                Your connected wallet is not listed as an heir for this will. Connect the correct wallet to claim.
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Claim button — only when triggered + heir */}
                                {isTriggered && connected && (
                                    <AnimatePresence>
                                        {claimSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{
                                                    padding: '16px 20px',
                                                    borderRadius: 16,
                                                    background: 'rgba(22,163,74,0.08)',
                                                    border: '1px solid rgba(22,163,74,0.25)',
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                }}
                                            >
                                                <CheckCircle size={20} color="#16A34A" />
                                                <div>
                                                    <div style={{ fontSize: 14, color: '#16A34A', letterSpacing: '-0.02em' }}>
                                                        Claim submitted successfully
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#8A8A82', marginTop: 2 }}>
                                                        Your inheritance is being transferred on-chain.
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="btn">
                                                {!isHeir && (
                                                    <div style={{
                                                        marginBottom: 10, padding: '10px 14px',
                                                        borderRadius: 12,
                                                        background: 'rgba(220,38,38,0.06)',
                                                        border: '1px solid rgba(220,38,38,0.18)',
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        fontSize: 12, color: '#DC2626',
                                                    }}>
                                                        <AlertTriangle size={13} />
                                                        Only registered heirs can claim from this will.
                                                    </div>
                                                )}

                                                <motion.button
                                                    whileHover={canClaim ? { y: -1, boxShadow: '0 10px 28px rgba(36,43,53,0.18)' } : {}}
                                                    whileTap={canClaim ? { scale: 0.985 } : {}}
                                                    onClick={handleClaim}
                                                    disabled={!canClaim || claiming}
                                                    style={{
                                                        width: '100%',
                                                        padding: '14px',
                                                        borderRadius: 16,
                                                        border: 'none',
                                                        background: canClaim ? '#242B35' : '#E4E4DF',
                                                        color: canClaim ? '#fff' : '#8A8A82',
                                                        fontSize: 14, fontWeight: 300,
                                                        letterSpacing: '-0.025em',
                                                        cursor: canClaim ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', gap: 8,
                                                        fontFamily: 'inherit',
                                                        transition: 'background 0.2s',
                                                    }}
                                                >
                                                    {claiming ? (
                                                        <>
                                                            <div style={{
                                                                width: 16, height: 16, borderRadius: '50%',
                                                                border: '2px solid rgba(255,255,255,0.3)',
                                                                borderTopColor: '#fff',
                                                                animation: 'spin 0.6s linear infinite',
                                                            }} />
                                                            Claiming on-chain…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wallet size={15} strokeWidth={1.8} />
                                                            {canClaim
                                                                ? `Claim ${bpsToPercent(info.heirBps!)} — ≈ ${((info.heirBps! / 10000) * info.vaultSolBalance).toFixed(4)} SOL`
                                                                : 'Claim Inheritance'
                                                            }
                                                        </>
                                                    )}
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}

                            </motion.div>
                        )}
                    </AnimatePresence>

                </motion.div>
            </div>
        </>
    )
}