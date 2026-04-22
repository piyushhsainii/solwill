'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useCheckinWill } from '@/lib/hooks/useCheckInWill'

interface Props {
    txPending: boolean
    checkinAnim: boolean
    nextVerificationTimestamp: string
    lastCheckin?: number
    intervalSeconds?: number
}

const HOLD_DURATION = 1500 // ms to hold before triggering

function ProtectionStatusCard({
    nextVerificationTimestamp,
    lastCheckin = 0,
    intervalSeconds = 86400,
}: Props) {
    // ── Hook called at top level — correct ───────────────────────────────────
    const { checkinWill, loading: txPending, error } = useCheckinWill()

    const [now, setNow] = useState(Date.now())
    const [holdProgress, setHoldProgress] = useState(0)
    const [isHolding, setIsHolding] = useState(false)
    const [fired, setFired] = useState(false)
    const [checkinAnim, setCheckinAnim] = useState(false)

    const startRef = useRef<number>(0)
    const rafRef = useRef<number>(0)

    // Tick clock every second
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    // After tx resolves → play success animation, clear fired flag
    useEffect(() => {
        if (!txPending && fired) {
            setCheckinAnim(true)
            const t1 = setTimeout(() => setCheckinAnim(false), 800)
            const t2 = setTimeout(() => setFired(false), 1200)
            return () => { clearTimeout(t1); clearTimeout(t2) }
        }
    }, [txPending, fired])

    // ── Countdown / color tracker ─────────────────────────────────────────────
    const tracker = useMemo(() => {
        if (!lastCheckin || !intervalSeconds) {
            return {
                progress: 0,
                timeLeft: '--',
                label: 'Awaiting Data',
                color: '#8A8A82',
                bg: '#F7F7F4',
            }
        }

        const nextDue = lastCheckin * 1000 + intervalSeconds * 1000
        const remaining = nextDue - now
        const total = intervalSeconds * 1000
        const elapsed = total - remaining
        const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100)
        const ratioLeft = Math.max(remaining / total, 0)

        let color = '#16A34A'
        let bg = 'rgba(22,163,74,0.07)'
        let label = 'Healthy Window'

        if (ratioLeft <= 0.5 && ratioLeft > 0.2) {
            color = '#D97706'; bg = 'rgba(217,119,6,0.07)'; label = 'Attention Needed'
        }
        if (ratioLeft <= 0.2) {
            color = '#DC2626'; bg = 'rgba(220,38,38,0.07)'; label = 'Urgent Check-In'
        }
        if (remaining <= 0) {
            color = '#DC2626'; bg = 'rgba(220,38,38,0.07)'; label = 'Trigger Window Reached'
        }

        const secs = Math.max(Math.floor(remaining / 1000), 0)
        const days = Math.floor(secs / 86400)
        const hours = Math.floor((secs % 86400) / 3600)
        const mins = Math.floor((secs % 3600) / 60)
        let timeLeft = ''
        if (days > 0) timeLeft += `${days}d `
        if (hours > 0 || days > 0) timeLeft += `${hours}h `
        timeLeft += `${mins}m`

        return { progress, timeLeft, label, color, bg }
    }, [now, lastCheckin, intervalSeconds])

    // ── Hold-to-confirm ───────────────────────────────────────────────────────
    const startHold = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (txPending || fired) return
        e.preventDefault()
        setIsHolding(true)
        startRef.current = Date.now()

        const tick = () => {
            const elapsed = Date.now() - startRef.current
            const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100)
            setHoldProgress(pct)
            if (pct < 100) {
                rafRef.current = requestAnimationFrame(tick)
            } else {
                // Hold complete — fire the check-in
                setFired(true)
                setIsHolding(false)
                setHoldProgress(0)
                checkinWill()          // ← calls hook, which calls performCheckin() on success
            }
        }
        rafRef.current = requestAnimationFrame(tick)
    }, [txPending, fired, checkinWill])

    const cancelHold = useCallback(() => {
        if (!isHolding) return
        cancelAnimationFrame(rafRef.current)
        setIsHolding(false)
        setHoldProgress(0)
    }, [isHolding])

    // ── Derived button styles ─────────────────────────────────────────────────
    const RADIUS = 68
    const CIRC = 2 * Math.PI * RADIUS
    const strokeDash = (holdProgress / 100) * CIRC

    const buttonBg = (fired && txPending)
        ? '#16A34A'
        : isHolding
            ? '#1A1A18'
            : '#EEEEE9'

    return (
        <div style={{
            background: '#FFFFFF',
            border: '1px solid #E4E4DF',
            borderRadius: '24px',
            padding: '28px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            userSelect: 'none',
        }}>
            {/* Header */}
            <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                color: '#8A8A82',
                letterSpacing: '0.12em',
                marginBottom: '10px',
                fontWeight: 300,
            }}>
                Active Protection Status
            </div>

            {/* Title */}
            <h2 style={{
                fontSize: '26px',
                color: '#1A1A18',
                margin: '0 0 10px',
                fontWeight: 300,
                letterSpacing: '-0.03em',
            }}>
                Estate Secured
            </h2>

            {/* Description */}
            <p style={{
                fontSize: '14px',
                lineHeight: 1.7,
                color: '#555550',
                margin: '0 0 28px',
                fontWeight: 300,
                letterSpacing: '-0.01em',
            }}>
                Your digital legacy remains protected. Regular identity
                verification prevents automatic recovery execution.
            </p>

            {/* Hold Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: 10 }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>

                    {/* Layered ambient pulse rings — only when idle */}
                    {!isHolding && !txPending && (
                        <>
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.55 + i * 0.22],
                                        opacity: [0.45 - i * 0.1, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2.2,
                                        delay: i * 0.55,
                                        ease: 'easeOut',
                                    }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '50%',
                                        border: `1.5px solid ${tracker.color}`,
                                        pointerEvents: 'none',
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {/* SVG progress ring — shown while holding */}
                    <svg
                        width={160}
                        height={160}
                        viewBox="0 0 160 160"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none',
                            opacity: isHolding ? 1 : 0,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {/* Track */}
                        <circle
                            cx={80} cy={80} r={RADIUS}
                            fill="none"
                            stroke="rgba(36,43,53,0.1)"
                            strokeWidth={4}
                        />
                        {/* Progress */}
                        <circle
                            cx={80} cy={80} r={RADIUS}
                            fill="none"
                            stroke="#1A1A18"
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={`${strokeDash} ${CIRC}`}
                            style={{ transition: 'none' }}
                        />
                    </svg>

                    {/* Main button */}
                    <motion.button
                        onMouseDown={startHold}
                        onMouseUp={cancelHold}
                        onMouseLeave={cancelHold}
                        onTouchStart={startHold}
                        onTouchEnd={cancelHold}
                        disabled={txPending}
                        animate={{
                            scale: isHolding ? 0.93 : checkinAnim ? [1, 0.95, 1.04, 1] : 1,
                            backgroundColor: buttonBg,
                        }}
                        transition={{
                            scale: { type: 'spring', stiffness: 320, damping: 22 },
                            backgroundColor: { duration: 0.25 },
                        }}
                        style={{
                            position: 'absolute',
                            inset: 8,
                            borderRadius: '50%',
                            border: 'none',
                            cursor: txPending ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            fontFamily: 'inherit',
                            outline: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            boxShadow: isHolding
                                ? '0 0 0 0px transparent, 0 12px 36px rgba(36,43,53,0.18)'
                                : '0 0 0 8px rgba(238,238,233,0.85), 0 0 0 18px rgba(247,247,244,0.7), 0 8px 30px rgba(36,43,53,0.07)',
                            transition: 'box-shadow 0.3s ease',
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {txPending ? (
                                <motion.div
                                    key="spinner"
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: '2.5px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        animation: 'spin 0.65s linear infinite',
                                    }}
                                />
                            ) : (
                                <motion.div
                                    key="icon"
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <Image
                                        src="/scanner.png"
                                        alt="Fingerprint"
                                        width={58}
                                        height={58}
                                        style={{
                                            objectFit: 'contain',
                                            opacity: isHolding ? 0.4 : 0.95,
                                            filter: isHolding ? 'invert(1)' : 'none',
                                            transition: 'opacity 0.2s, filter 0.2s',
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '10px',
                                        color: isHolding ? 'rgba(255,255,255,0.7)' : '#242B35',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.12em',
                                        fontWeight: 300,
                                        fontFamily: 'inherit',
                                        transition: 'color 0.2s',
                                    }}>
                                        {isHolding ? 'Hold...' : 'Hold to Check In'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Hint text */}
                <AnimatePresence>
                    {isHolding && (
                        <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            style={{
                                fontSize: '12px',
                                color: '#8A8A82',
                                margin: 0,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {Math.ceil(((100 - holdProgress) / 100) * (HOLD_DURATION / 1000))}s remaining…
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Tracker */}
            <div style={{
                background: tracker.bg,
                border: `1px solid ${tracker.color}30`,
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '14px',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                }}>
                    <span style={{ fontSize: '12px', color: '#555550', fontWeight: 300 }}>
                        Check-In Window
                    </span>
                    <span style={{ fontSize: '12px', color: tracker.color, fontWeight: 300 }}>
                        {tracker.label}
                    </span>
                </div>

                <div style={{
                    height: '6px',
                    borderRadius: '999px',
                    background: '#E4E4DF',
                    overflow: 'hidden',
                    marginBottom: '10px',
                }}>
                    <motion.div
                        animate={{ width: `${tracker.progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                            height: '100%',
                            borderRadius: '999px',
                            background: `linear-gradient(90deg, ${tracker.color}99, ${tracker.color})`,
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: '11px', color: '#8A8A82', fontWeight: 300 }}>
                        Time Remaining
                    </span>
                    <span style={{ fontSize: '14px', color: '#1A1A18', fontWeight: 300 }}>
                        {tracker.timeLeft}
                    </span>
                </div>
            </div>

            {/* Due Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F7F7F4',
                border: '1px solid #E4E4DF',
                borderRadius: '14px',
                padding: '14px 16px',
            }}>
                <span style={{ fontSize: '13px', color: '#555550', fontWeight: 300 }}>
                    Next verification due
                </span>
                <span style={{ fontSize: '13px', color: '#1A1A18', fontWeight: 300 }}>
                    {nextVerificationTimestamp}
                </span>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default ProtectionStatusCard