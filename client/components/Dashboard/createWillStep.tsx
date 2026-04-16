'use client'
import { useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, LockIcon, ShieldCheck } from "lucide-react"

export default function CreateWillStep({
    onComplete,
    isLoading,
    dir,
}: {
    onComplete: (intervalDays: number) => void
    isLoading: boolean
    dir: 'forward' | 'back'
}) {


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

    const [intervalDays, setIntervalDays] = useState(30)
    const variants = dir === 'forward' ? slideRight : slideLeft
    const intervals = [7, 14, 30, 60, 90]

    /* ─── Helpers ────────────────────────────────────────────────────────── */
    function LockIcon({ size, color }: { size: number; color?: string }) {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        )
    }
    function Spinner() {
        return (
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.25)',
                    borderTopColor: 'white', flexShrink: 0,
                }}
            />
        )
    }


    return (
        <motion.div variants={variants} initial="hidden" animate="show" exit="exit">
            <motion.div variants={fadeUp} initial="hidden" animate="show">
                <motion.div variants={child} style={{ textAlign: 'center', marginBottom: 30 }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 22,
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--primary)',
                            boxShadow: '0 14px 34px rgba(0,0,0,0.12)',
                        }}
                    >
                        <ShieldCheck size={30} color="white" />
                    </motion.div>

                    <h2
                        style={{
                            margin: '0 0 8px',
                            fontSize: 22,
                            fontWeight: 500,
                            letterSpacing: '-0.035em',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Create Your On-Chain Will
                    </h2>

                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: 'var(--text-secondary)',
                            maxWidth: 390,
                            marginInline: 'auto',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Set your check-in interval. Miss it and the recovery protocol triggers
                        automatically to protect your heirs.
                    </p>
                </motion.div>

                <motion.div variants={child} style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginBottom: 10,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Check-in Interval
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {intervals.map((d) => {
                            const active = intervalDays === d
                            return (
                                <motion.button
                                    key={d}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIntervalDays(d)}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: 12,
                                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'
                                            }`,
                                        background: active
                                            ? 'rgba(0,0,0,0.04)'
                                            : 'var(--surface)',
                                        color: 'var(--text-primary)',
                                        fontSize: 13,
                                        fontWeight: 400,
                                        letterSpacing: '-0.025em',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {d}d
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>

                <motion.div
                    variants={child}
                    style={{
                        padding: '15px 16px',
                        borderRadius: 16,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        marginBottom: 26,
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: 'rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <LockIcon size={16} color="var(--text-primary)" />
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Secured by smart contracts
                        </div>

                        <div
                            style={{
                                marginTop: 2,
                                fontSize: 11,
                                color: 'var(--text-secondary)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Verify every {intervalDays} days to keep the vault active.
                        </div>
                    </div>
                </motion.div>

                <motion.button
                    variants={child}
                    whileHover={!isLoading ? { y: -2 } : {}}
                    whileTap={!isLoading ? { scale: 0.99 } : {}}
                    disabled={isLoading}
                    onClick={() => onComplete(intervalDays)}
                    style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 14,
                        border: 'none',
                        background: isLoading
                            ? 'rgba(0,0,0,0.12)'
                            : 'var(--primary)',
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 400,
                        letterSpacing: '-0.025em',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                >
                    {isLoading ? (
                        <>
                            <Spinner /> Deploying...
                        </>
                    ) : (
                        <>
                            Create Will <ArrowRight size={16} />
                        </>
                    )}
                </motion.button>
            </motion.div>
        </motion.div>
    )
}