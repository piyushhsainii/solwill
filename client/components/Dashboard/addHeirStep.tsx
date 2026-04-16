
import { useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Users } from "lucide-react"
import { Heir } from "@/lib/utils/helper"

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
    onComplete: () => void
    isLoading: boolean
    dir: 'forward' | 'back'
}) {
    const [address, setAddress] = useState('')
    const [share, setShare] = useState(100)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editAddr, setEditAddr] = useState('')
    const [editShare, setEditShare] = useState(0)


    const totalAllocated = heirs.reduce((s, h) => s + h.shareBps, 0)
    const remaining = 100 - totalAllocated
    const effectiveShare = Math.max(
        0,
        Math.min(share, remaining <= 0 ? 0 : remaining)
    )
    const canProceed = heirs.length > 0 && totalAllocated === 100
    const canAdd = address.trim() && effectiveShare > 0

    const handleAdd = () => {
        if (!address.trim()) return setError('Wallet address required')
        if (address.trim().length < 32)
            return setError('Invalid Solana address')
        if (effectiveShare <= 0)
            return setError('Allocation limit reached')

        setError('')
        onAdd(address.trim(), effectiveShare)
        setAddress('')
        setShare(remaining - effectiveShare > 0 ? remaining - effectiveShare : 1)
    }

    const child = {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    }
    const stagger = {
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    }
    const fadeUp = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
    }
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

    const variants = dir === 'forward' ? slideRight : slideLeft


    return (
        <motion.div variants={variants} initial="hidden" animate="show" exit="exit">
            <motion.div variants={fadeUp} initial="hidden" animate="show">
                <motion.div variants={child} style={{ textAlign: 'center', marginBottom: 26 }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 22,
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 14px 34px rgba(0,0,0,0.12)',
                        }}
                    >
                        <Users size={30} color="white" />
                    </div>

                    <h2
                        style={{
                            margin: '0 0 8px',
                            fontSize: 22,
                            fontWeight: 500,
                            letterSpacing: '-0.035em',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Designate Beneficiaries
                    </h2>

                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: 'var(--text-secondary)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Add heirs and allocate estate shares. Total must equal 100%.
                    </p>
                </motion.div>

                <motion.div variants={child}>
                    <input
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value)
                            setError('')
                        }}
                        placeholder="Solana wallet address"
                        style={{
                            width: '100%',
                            padding: '13px 14px',
                            borderRadius: 14,
                            border: `1px solid ${error ? '#ef4444' : 'var(--border)'
                                }`,
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            fontSize: 13,
                            letterSpacing: '-0.02em',
                            outline: 'none',
                            marginBottom: 8,
                        }}
                    />

                    {error && (
                        <div
                            style={{
                                fontSize: 11,
                                color: '#ef4444',
                                marginBottom: 12,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div
                        style={{
                            padding: 14,
                            borderRadius: 16,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            marginBottom: 14,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Allocation
                            </span>

                            <span
                                style={{
                                    fontSize: 18,
                                    fontWeight: 400,
                                    color: 'var(--text-primary)',
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {effectiveShare}%
                            </span>
                        </div>

                        <input
                            type="range"
                            min={1}
                            max={100}
                            value={share}
                            onChange={(e) => setShare(Number(e.target.value))}
                            style={{ width: '100%' }}
                        />

                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 11,
                                color: 'var(--text-secondary)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {remaining}% available
                        </div>
                    </div>

                    <motion.button
                        whileHover={canAdd ? { y: -2 } : {}}
                        whileTap={canAdd ? { scale: 0.99 } : {}}
                        disabled={!canAdd}
                        onClick={handleAdd}
                        style={{
                            width: '100%',
                            padding: '13px 18px',
                            borderRadius: 14,
                            border: 'none',
                            background: canAdd
                                ? 'var(--primary)'
                                : 'rgba(0,0,0,0.12)',
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 400,
                            letterSpacing: '-0.025em',
                            cursor: canAdd ? 'pointer' : 'not-allowed',
                            marginBottom: 16,
                        }}
                    >
                        Add Heir
                    </motion.button>
                </motion.div>

                <motion.div variants={child} style={{ marginBottom: 16 }}>
                    {heirs.map((heir) => (
                        <motion.div
                            key={heir.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 14,
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--text-primary)',
                                    marginBottom: 4,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {heir.walletAddress}
                            </div>

                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--text-secondary)',
                                    marginBottom: 8,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {heir.shareBps}%
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => {
                                        setEditingId(heir.id)
                                        setEditAddr(heir.walletAddress)
                                        setEditShare(heir.shareBps)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 10px',
                                        borderRadius: 10,
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => onRemove(heir.id)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 10px',
                                        borderRadius: 10,
                                        border: '1px solid rgba(239,68,68,0.18)',
                                        background: 'rgba(239,68,68,0.06)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Remove
                                </button>
                            </div>

                            {editingId === heir.id && (
                                <div style={{ marginTop: 10 }}>
                                    <input
                                        value={editAddr}
                                        onChange={(e) => setEditAddr(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: 10,
                                            borderRadius: 10,
                                            border: '1px solid var(--border)',
                                            marginBottom: 8,
                                        }}
                                    />

                                    <input
                                        type="number"
                                        value={editShare}
                                        onChange={(e) => setEditShare(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: 10,
                                            borderRadius: 10,
                                            border: '1px solid var(--border)',
                                            marginBottom: 8,
                                        }}
                                    />

                                    <button
                                        onClick={() => {
                                            onUpdate(heir.id, editAddr, editShare)
                                            setEditingId(null)
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'var(--primary)',
                                            color: 'white',
                                        }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                <motion.button
                    variants={child}
                    whileHover={canProceed ? { y: -2 } : {}}
                    whileTap={canProceed ? { scale: 0.99 } : {}}
                    disabled={!canProceed || isLoading}
                    onClick={onComplete}
                    style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: 14,
                        border: 'none',
                        background: canProceed
                            ? 'var(--primary)'
                            : 'rgba(0,0,0,0.12)',
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 400,
                        letterSpacing: '-0.025em',
                    }}
                >
                    {isLoading ? 'Saving...' : 'Confirm Beneficiaries'}
                </motion.button>
            </motion.div>
        </motion.div>
    )
}