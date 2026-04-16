import { Heir } from '@/app/store/useWillStore'
import { fadeUp } from '@/lib/utils/helper'
import { AnimatePresence, motion } from 'framer-motion'
import { UserPlus, Users } from 'lucide-react'
import Link from 'next/link'

const DesignatedHeirs = ({
    activeHeirs,
    avatarColors,
}: {
    activeHeirs: Heir[]
    avatarColors: string[]
}) => {
    return (
        <motion.div variants={fadeUp} style={{ gridColumn: 'span 9' }}>
            <motion.div
                whileHover={{
                    y: -2,
                    boxShadow: '0 18px 42px rgba(36,43,53,0.08)',
                    borderColor: '#242B35',
                }}
                transition={{ duration: 0.22 }}
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #E4E4DF',
                    borderRadius: '24px',
                    padding: '26px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                    }}
                >
                    <span
                        style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            color: '#8A8A82',
                            letterSpacing: '0.14em',
                        }}
                    >
                        Designated Beneficiaries
                    </span>

                    <Link href="/setup">
                        <motion.button
                            whileHover={{
                                scale: 1.04,
                                background: '#242B35',
                                color: '#fff',
                            }}
                            whileTap={{ scale: 0.96 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 11,
                                padding: '7px 14px',
                                borderRadius: 999,
                                background: '#EEEEE9',
                                border: '1px solid #E4E4DF',
                                cursor: 'pointer',
                            }}
                        >
                            <UserPlus size={12} /> Add
                        </motion.button>
                    </Link>
                </div>

                {/* SUBTITLE (slightly larger as requested earlier) */}
                <p
                    style={{
                        fontSize: '12px',
                        color: '#8A8A82',
                        marginBottom: '18px',
                        lineHeight: 1.6,
                    }}
                >
                    Authorised entities for automatic estate transfer
                </p>

                {/* LIST */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '10px',
                        flex: 1,
                    }}
                >
                    <AnimatePresence>
                        {activeHeirs.map((heir, i) => {
                            const address = heir.walletAddress || ''
                            const truncated = address
                                ? `${address.slice(0, 4)}...${address.slice(-4)}`
                                : 'Unknown'

                            const bps = heir.shareBps || 0
                            const percentage = bps / 100 // FIXED clarity

                            return (
                                <motion.div
                                    key={heir.id || i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ delay: i * 0.04 }}
                                    whileHover={{
                                        y: -2,
                                        background: '#F7F7F4',
                                        borderColor: '#242B35',
                                    }}
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        padding: 12,
                                        borderRadius: 16,
                                        border: '1px solid #E4E4DF',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {/* AVATAR */}
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: '50%',
                                            background:
                                                avatarColors[i % avatarColors.length],
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: 12,
                                        }}
                                    >
                                        {address ? (
                                            address.slice(0, 2).toUpperCase()
                                        ) : (
                                            <Users size={14} />
                                        )}
                                    </div>

                                    {/* INFO */}
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: '#1A1A18',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {truncated}
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent:
                                                    'space-between',
                                                marginTop: 6,
                                                marginBottom: 6,
                                            }}
                                        >
                                            <span style={{ fontSize: 10, color: '#8A8A82' }}>
                                                {bps} bps
                                            </span>
                                            <span style={{ fontSize: 10, color: '#555' }}>
                                                {percentage.toFixed(2)}%
                                            </span>
                                        </div>

                                        {/* PROGRESS */}
                                        <div
                                            style={{
                                                height: 4,
                                                borderRadius: 999,
                                                background: '#E4E4DF',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <motion.div
                                                animate={{
                                                    width: `${percentage}%`,
                                                }}
                                                transition={{ duration: 0.4 }}
                                                style={{
                                                    height: '100%',
                                                    borderRadius: 999,
                                                    background:
                                                        avatarColors[i %
                                                        avatarColors.length],
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default DesignatedHeirs