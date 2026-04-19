import { useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, Loader2 } from "lucide-react"
import { Heir } from "@/lib/utils/helper"

const slideRight = {
    hidden: { opacity: 0, x: 52 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, x: -52, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}
const slideLeft = {
    hidden: { opacity: 0, x: -52 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, x: 52, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

const child = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] } },
}
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

/* ── Tiny avatar initials ── */
function HeirAvatar({ address }: { address: string }) {
    const initials = address.slice(0, 2).toUpperCase()
    const hue = address.charCodeAt(0) * 7 % 360
    return (
        <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `hsl(${hue}, 28%, 88%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: `hsl(${hue}, 28%, 32%)`,
            flexShrink: 0, letterSpacing: '0.04em',
        }}>
            {initials}
        </div>
    )
}

/* ── Arc progress ring ── */
function AllocationRing({ pct }: { pct: number }) {
    const r = 26
    const circ = 2 * Math.PI * r
    const filled = (pct / 100) * circ
    const color = pct === 100 ? '#43d17a' : pct > 100 ? '#ef4444' : 'var(--primary)'

    return (
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
            <circle cx={32} cy={32} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
            <motion.circle
                cx={32} cy={32} r={r} fill="none"
                stroke={color} strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: circ - filled }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                transform="rotate(-90 32 32)"
            />
            <text x={32} y={36} textAnchor="middle"
                style={{ fontSize: 13, fontWeight: 700, fill: color, letterSpacing: '-0.03em' }}>
                {pct}%
            </text>
        </svg>
    )
}
type HeirStatus = 'idle' | 'pending' | 'success' | 'error'

export default function AddHeirsStep({
    heirs,
    onAdd,
    onUpdate,
    onRemove,
    onComplete,
    isLoading,
    dir,
}: {
    heirs: Heir[]
    onAdd: (address: string, share: number) => void
    onUpdate: (id: string, address: string, share: number) => void
    onRemove: (id: string) => void
    onComplete: (
        onHeirStatus: (id: string, status: HeirStatus) => void
    ) => Promise<void>
    isLoading: boolean
    dir: 'forward' | 'back'
}) {
    const [address, setAddress] = useState('')
    const [share, setShare] = useState(100)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editAddr, setEditAddr] = useState('')
    const [editShare, setEditShare] = useState(0)
    const [focused, setFocused] = useState(false)
    const [heirStatuses, setHeirStatuses] = useState<Record<string, HeirStatus>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const totalAllocated = heirs.reduce((s, h) => s + h.shareBps, 0)
    const remaining = 100 - totalAllocated
    const effectiveShare = Math.max(0, Math.min(share, remaining <= 0 ? 0 : remaining))
    const canProceed = heirs.length > 0 && totalAllocated === 100 && !isSubmitting
    const canAdd = address.trim().length >= 32 && effectiveShare > 0

    const successCount = Object.values(heirStatuses).filter(s => s === 'success').length
    const hasAnyStatus = Object.keys(heirStatuses).length > 0

    const handleAdd = () => {
        if (!address.trim()) return setError('Wallet address required')
        if (address.trim().length < 32) return setError('Invalid Solana address')
        if (effectiveShare <= 0) return setError('No allocation remaining')
        setError('')
        onAdd(address.trim(), effectiveShare)
        setAddress('')
        setShare(remaining - effectiveShare > 0 ? remaining - effectiveShare : 1)
    }

    const handleComplete = async () => {
        setIsSubmitting(true)
        // Reset all to idle first
        setHeirStatuses(Object.fromEntries(heirs.map(h => [h.id, 'idle'])))

        await onComplete((id, status) => {
            setHeirStatuses(prev => ({ ...prev, [id]: status }))
        })

        setIsSubmitting(false)
    }

    const variants = dir === 'forward' ? slideRight : slideLeft

    return (
        <motion.div variants={variants} initial="hidden" animate="show" exit="exit">
            <motion.div variants={stagger} initial="hidden" animate="show">

                {/* ── Header ── */}
                <motion.div variants={child} style={{ marginBottom: 28 }}>
                    <h2 style={{
                        margin: '0 0 6px',
                        fontSize: 20,
                        fontWeight: 500,
                        letterSpacing: '-0.04em',
                        color: 'var(--text-primary)',
                    }}>
                        Designate beneficiaries
                    </h2>
                    <p style={{
                        margin: 0, fontSize: 13, lineHeight: 1.6,
                        color: 'var(--text-secondary)', letterSpacing: '-0.01em',
                    }}>
                        Assign Solana wallet addresses and allocate shares. Total must equal 100%.
                    </p>
                </motion.div>

                {/* ── Input row ── */}
                <motion.div variants={child} style={{ marginBottom: 10 }}>
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'stretch',
                    }}>
                        {/* Address field */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <motion.div
                                animate={{
                                    borderColor: error
                                        ? '#ef4444'
                                        : focused
                                            ? 'var(--primary)'
                                            : 'var(--border)',
                                    boxShadow: focused
                                        ? '0 0 0 3px rgba(36,43,53,0.07)'
                                        : '0 0 0 0px transparent',
                                }}
                                transition={{ duration: 0.18 }}
                                style={{
                                    borderRadius: 14,
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    overflow: 'hidden',
                                }}
                            >
                                <input
                                    value={address}
                                    onChange={e => { setAddress(e.target.value); setError('') }}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="Solana wallet address"
                                    style={{
                                        width: '100%',
                                        padding: '13px 14px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        fontSize: 13,
                                        letterSpacing: '-0.01em',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Add button */}
                        <motion.button
                            whileHover={canAdd ? { scale: 1.04 } : {}}
                            whileTap={canAdd ? { scale: 0.96 } : {}}
                            disabled={!canAdd}
                            onClick={handleAdd}
                            style={{
                                width: 46, height: 46,
                                borderRadius: 14,
                                border: 'none',
                                background: canAdd ? 'var(--primary)' : 'var(--border)',
                                color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: canAdd ? 'pointer' : 'not-allowed',
                                flexShrink: 0,
                                transition: 'background 0.2s',
                            }}
                        >
                            <Plus size={18} strokeWidth={2.5} />
                        </motion.button>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                style={{
                                    margin: '6px 0 0 4px', fontSize: 11,
                                    color: '#ef4444', letterSpacing: '-0.01em',
                                }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Allocation slider card ── */}
                <motion.div variants={child} style={{
                    padding: '16px 18px',
                    borderRadius: 18,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    {/* Ring */}
                    <AllocationRing pct={totalAllocated === 100 ? 100 : effectiveShare} />

                    {/* Slider section */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 10,
                        }}>
                            <span style={{
                                fontSize: 12, fontWeight: 500,
                                color: 'var(--text-secondary)', letterSpacing: '-0.01em',
                            }}>
                                Share for this heir
                            </span>
                            <span style={{
                                fontSize: 12,
                                color: remaining === 0 ? '#43d17a' : 'var(--text-secondary)',
                                letterSpacing: '-0.01em',
                            }}>
                                {remaining}% remaining
                            </span>
                        </div>

                        {/* Custom slider */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="range"
                                min={1}
                                max={100}
                                step={1}
                                value={share}
                                onChange={e => setShare(Number(e.target.value))}
                                disabled={remaining <= 0}
                                style={{
                                    width: '100%',
                                    height: 4,
                                    appearance: 'none',
                                    background: `linear-gradient(to right, var(--primary) ${effectiveShare}%, var(--border) ${effectiveShare}%)`,
                                    borderRadius: 999,
                                    outline: 'none',
                                    cursor: remaining <= 0 ? 'not-allowed' : 'pointer',
                                    opacity: remaining <= 0 ? 0.4 : 1,
                                }}
                            />
                        </div>

                        <style>{`
                            input[type=range]::-webkit-slider-thumb {
                                appearance: none;
                                width: 18px; height: 18px;
                                border-radius: 50%;
                                background: var(--primary);
                                border: 2.5px solid white;
                                box-shadow: 0 1px 6px rgba(0,0,0,0.18);
                                cursor: pointer;
                                transition: transform 0.15s ease;
                            }
                            input[type=range]::-webkit-slider-thumb:hover {
                                transform: scale(1.2);
                            }
                            input[type=range]::-moz-range-thumb {
                                width: 18px; height: 18px;
                                border-radius: 50%;
                                background: var(--primary);
                                border: 2.5px solid white;
                                box-shadow: 0 1px 6px rgba(0,0,0,0.18);
                                cursor: pointer;
                            }
                        `}</style>
                    </div>
                </motion.div>

                {/* ── Heirs list ── */}
                <AnimatePresence>
                    {heirs.length > 0 && (
                        <motion.div
                            variants={child}
                            style={{
                                borderRadius: 18,
                                border: '1px solid var(--border)',
                                overflow: 'hidden',
                                marginBottom: 20,
                            }}
                        >
                            {heirs.map((heir, idx) => {
                                const status = heirStatuses[heir.id] ?? 'idle'
                                return (
                                    <motion.div
                                        key={heir.id}
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                                    >
                                        <div style={{
                                            padding: '13px 16px',
                                            borderBottom: idx < heirs.length - 1
                                                ? '1px solid var(--border)' : 'none',
                                            background: status === 'success'
                                                ? 'rgba(67,209,122,0.04)'
                                                : status === 'error'
                                                    ? 'rgba(239,68,68,0.04)'
                                                    : 'var(--surface)',
                                            transition: 'background 0.3s',
                                        }}>
                                            {editingId === heir.id ? (
                                                /* keep your existing edit mode JSX unchanged */
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                                                >
                                                    <input
                                                        value={editAddr}
                                                        onChange={e => setEditAddr(e.target.value)}
                                                        style={{
                                                            padding: '10px 12px', borderRadius: 10,
                                                            border: '1px solid var(--border)',
                                                            background: 'transparent',
                                                            color: 'var(--text-primary)',
                                                            fontSize: 12, outline: 'none',
                                                            fontFamily: 'inherit',
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input
                                                            type="number"
                                                            value={editShare}
                                                            min={1} max={100}
                                                            onChange={e => setEditShare(Number(e.target.value))}
                                                            style={{
                                                                flex: 1, padding: '10px 12px', borderRadius: 10,
                                                                border: '1px solid var(--border)',
                                                                background: 'transparent',
                                                                color: 'var(--text-primary)',
                                                                fontSize: 12, outline: 'none',
                                                                fontFamily: 'inherit',
                                                            }}
                                                        />
                                                        <button onClick={() => { onUpdate(heir.id, editAddr, editShare); setEditingId(null) }}
                                                            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                            Save
                                                        </button>
                                                        <button onClick={() => setEditingId(null)}
                                                            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <HeirAvatar address={heir.walletAddress} />

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: 12, color: 'var(--text-primary)',
                                                            letterSpacing: '-0.01em',
                                                            overflow: 'hidden', textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {heir.walletAddress.slice(0, 6)}…{heir.walletAddress.slice(-4)}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 11, color: 'var(--text-secondary)',
                                                            marginTop: 2, letterSpacing: '-0.01em',
                                                        }}>
                                                            {heir.shareBps}% share
                                                        </div>
                                                    </div>

                                                    {/* Share pill */}
                                                    <div style={{
                                                        padding: '4px 10px', borderRadius: 999,
                                                        background: 'var(--primary)',
                                                        color: 'white', fontSize: 11, fontWeight: 600,
                                                        letterSpacing: '-0.01em', flexShrink: 0,
                                                    }}>
                                                        {heir.shareBps}%
                                                    </div>

                                                    {/* Status indicator OR action buttons */}
                                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                                                        {status === 'pending' && (
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                                style={{ display: 'flex' }}
                                                            >
                                                                <Loader2 size={16} color="var(--text-secondary)" />
                                                            </motion.div>
                                                        )}
                                                        {status === 'success' && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                                                style={{
                                                                    width: 22, height: 22, borderRadius: '50%',
                                                                    background: '#43d17a',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Check size={12} color="white" strokeWidth={3} />
                                                            </motion.div>
                                                        )}
                                                        {status === 'error' && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                style={{
                                                                    width: 22, height: 22, borderRadius: '50%',
                                                                    background: 'rgba(239,68,68,0.1)',
                                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 11, color: '#ef4444', fontWeight: 700,
                                                                }}
                                                            >
                                                                !
                                                            </motion.div>
                                                        )}
                                                        {status === 'idle' && !isSubmitting && (
                                                            <>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                                                    onClick={() => { setEditingId(heir.id); setEditAddr(heir.walletAddress); setEditShare(heir.shareBps) }}
                                                                    style={{
                                                                        width: 30, height: 30, borderRadius: 8,
                                                                        border: '1px solid var(--border)',
                                                                        background: 'transparent', cursor: 'pointer',
                                                                        fontSize: 11, color: 'var(--text-secondary)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    }}
                                                                >✎</motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                                                    onClick={() => onRemove(heir.id)}
                                                                    style={{
                                                                        width: 30, height: 30, borderRadius: 8,
                                                                        border: '1px solid rgba(239,68,68,0.2)',
                                                                        background: 'rgba(239,68,68,0.06)',
                                                                        cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <X size={13} color="#ef4444" strokeWidth={2.5} />
                                                                </motion.button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Allocation status bar ── */}
                {heirs.length > 0 && (
                    <motion.div
                        variants={child}
                        style={{
                            marginBottom: 20,
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: totalAllocated === 100
                                ? 'rgba(67,209,122,0.08)'
                                : totalAllocated > 100
                                    ? 'rgba(239,68,68,0.06)'
                                    : 'var(--surface)',
                            border: `1px solid ${totalAllocated === 100
                                ? 'rgba(67,209,122,0.25)'
                                : totalAllocated > 100
                                    ? 'rgba(239,68,68,0.2)'
                                    : 'var(--border)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: totalAllocated === 100
                                ? '#43d17a'
                                : totalAllocated > 100
                                    ? '#ef4444'
                                    : '#f59e0b',
                        }} />
                        <span style={{
                            fontSize: 12, color: totalAllocated === 100
                                ? '#43d17a'
                                : totalAllocated > 100
                                    ? '#ef4444'
                                    : 'var(--text-secondary)',
                            letterSpacing: '-0.01em',
                        }}>
                            {totalAllocated === 100
                                ? 'All shares allocated — ready to confirm'
                                : totalAllocated > 100
                                    ? `Over-allocated by ${totalAllocated - 100}%`
                                    : `${totalAllocated}% of 100% allocated`}
                        </span>
                    </motion.div>
                )}

                {/* ── Confirm button ── */}
                <motion.button
                    variants={child}
                    whileHover={canProceed ? { y: -1 } : {}}
                    whileTap={canProceed ? { scale: 0.985 } : {}}
                    disabled={!canProceed || isLoading}
                    onClick={handleComplete}
                    style={{
                        width: '100%', padding: '14px 18px', borderRadius: 16,
                        border: 'none',
                        background: canProceed ? 'var(--primary)' : 'var(--border)',
                        color: canProceed ? 'white' : 'var(--text-secondary)',
                        fontSize: 14, fontWeight: 500, letterSpacing: '-0.025em',
                        cursor: canProceed ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, fontFamily: 'inherit',
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ display: 'flex' }}
                            >
                                <Loader2 size={15} color="white" />
                            </motion.div>
                            {`Adding heirs… ${successCount}/${heirs.length}`}
                        </>
                    ) : canProceed ? (
                        <><Check size={15} strokeWidth={2.5} />Confirm beneficiaries</>
                    ) : (
                        'Confirm beneficiaries'
                    )}
                </motion.button>

            </motion.div>
        </motion.div>

    )
}