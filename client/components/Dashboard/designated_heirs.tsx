import { Heir } from '@/app/store/useWillStore'
import { fadeUp } from '@/lib/utils/helper'
import { AnimatePresence, motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

const RingProgress = ({
    percentage,
    color,
    size = 90,
    stroke = 5,
}: {
    percentage: number
    color: string
    size?: number
    stroke?: number
}) => {
    const radius = (size - stroke * 2) / 2
    const circumference = 2 * Math.PI * radius
    const clamped = Math.min(100, Math.max(0, percentage))
    const offset = circumference * (1 - clamped / 100)
    const cx = size / 2
    const cy = size / 2

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E4E4DF" strokeWidth={stroke} />
            <motion.circle
                cx={cx} cy={cy} r={radius} fill="none"
                stroke={color} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                transform={`rotate(-90 ${cx} ${cy})`}
            />
        </svg>
    )
}

const RING_SIZE = 90
const RING_STROKE = 5

const DesignatedHeirs = ({
    activeHeirs,
    avatarColors,
    mobile = false,
}: {
    activeHeirs: Heir[]
    avatarColors: string[]
    mobile?: boolean
}) => {
    const inner = (
        <motion.div
            whileHover={{ y: -2, boxShadow: '0 18px 42px rgba(36,43,53,0.08)', borderColor: '#242B35' }}
            transition={{ duration: 0.22 }}
            style={{
                background: '#FFFFFF',
                border: '1px solid #E4E4DF',
                borderRadius: 24,
                padding: 26,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                boxSizing: 'border-box',
                minWidth: 0,
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 6,
            }}>
                <span style={{
                    fontSize: 10, textTransform: 'uppercase',
                    color: '#8A8A82', letterSpacing: '0.14em',
                }}>
                    Designated Beneficiaries
                </span>
                <Link href="/manage-heirs">
                    <motion.button
                        whileHover={{ scale: 1.04, background: '#242B35', color: '#fff' }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 11, padding: '7px 14px', borderRadius: 999,
                            background: '#EEEEE9', border: '1px solid #E4E4DF', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <UserPlus size={12} /> Add
                    </motion.button>
                </Link>
            </div>

            <p style={{ fontSize: 12, color: '#8A8A82', marginBottom: 22, lineHeight: 1.6 }}>
                Authorised entities for automatic estate transfer
            </p>

            {/* Heir cards — wrap on all screen sizes */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: mobile ? 16 : 20,
                flex: 1,
                alignItems: 'flex-start',
            }}>
                <AnimatePresence>
                    {activeHeirs.map((heir, i) => {
                        const address = heir.walletAddress || ''
                        const truncated = address
                            ? `${address.slice(0, 4)}...${address.slice(-4)}`
                            : 'Unknown'
                        const bps = heir.shareBps || 0
                        const percentage = bps / 100
                        const color = '#000000'
                        const ringSize = mobile ? 72 : RING_SIZE

                        return (
                            <motion.div
                                key={heir.id || i}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
                                style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: 10, width: ringSize,
                                }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.06 }}
                                    style={{ position: 'relative', width: ringSize, height: ringSize, cursor: 'default' }}
                                >
                                    <RingProgress
                                        percentage={percentage} color={color}
                                        size={ringSize} stroke={RING_STROKE}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: RING_STROKE + 3, left: RING_STROKE + 3,
                                        width: ringSize - (RING_STROKE + 3) * 2,
                                        height: ringSize - (RING_STROKE + 3) * 2,
                                        borderRadius: '50%', overflow: 'hidden', background: '#F0F0EA',
                                    }}>
                                        <img
                                            src="/user_pfp.png" alt="heir avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                        />
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.06 + 0.3 }}
                                        style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            background: color, color: '#fff',
                                            fontSize: 9, fontWeight: 600,
                                            padding: '2px 6px', borderRadius: 999,
                                            border: '2px solid #fff', lineHeight: 1.4,
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        {percentage.toFixed(1)}%
                                    </motion.div>
                                </motion.div>

                                <div style={{
                                    fontSize: 11, color: '#1A1A18', textAlign: 'center',
                                    letterSpacing: '0.03em', fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {truncated}
                                </div>
                                <div style={{ fontSize: 10, color: '#8A8A82', marginTop: -6 }}>
                                    {bps} bps
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    )

    if (mobile) {
        return <motion.div variants={fadeUp} style={{ minWidth: 0 }}>{inner}</motion.div>
    }

    return (
        <motion.div variants={fadeUp} className="col-span-9" style={{ minWidth: 0 }}>
            {inner}
        </motion.div>
    )
}

export default DesignatedHeirs