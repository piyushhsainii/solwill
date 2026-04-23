'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowRight,
    Shield,
    Lock,
    Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWillStore } from '../store/useWillStore'
import { usePrivy, useWallets, useLogin } from '@privy-io/react-auth'
import PhoneMockup from '@/components/Landing/PhoneMockup'
import { useMotionValue, useTransform, animate, motion } from 'framer-motion'

type SlideToConnectProps = {
    onTriggered: () => void
    connecting: boolean
    done: boolean
}

function SlideToConnect({ onTriggered, connecting, done }: SlideToConnectProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [trackW, setTrackW] = useState(300)
    const knobSize = 52
    const maxDrag = trackW - knobSize - 8

    // Use motion value instead of state — no conflict with framer drag
    const x = useMotionValue(0)
    const progress = useTransform(x, [0, maxDrag], [0, 1])
    const fillWidth = useTransform(x, [0, maxDrag], [knobSize / 2 + 4, trackW])
    const textColor = useTransform(progress, [0, 0.45, 0.55], ['#8a8a82', '#8a8a82', '#ffffff'])

    /* ── Track width ─────────────────────────────────────────────── */
    useEffect(() => {
        const el = trackRef.current
        if (!el) return
        const ro = new ResizeObserver(entries => setTrackW(entries[0].contentRect.width))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    /* ── Snap back on cancel ─────────────────────────────────────── */
    const prevConnecting = useRef(connecting)
    useEffect(() => {
        const wasConnecting = prevConnecting.current
        prevConnecting.current = connecting
        if (wasConnecting && !connecting && !done) {
            animate(x, 0, { type: 'spring', stiffness: 340, damping: 30 })
        }
    }, [connecting, done, x])

    /* ── Snap back on mount / maxDrag change ─────────────────────── */
    useEffect(() => {
        if (!done && !connecting) {
            animate(x, 0, { type: 'spring', stiffness: 340, damping: 30 })
        }
    }, [maxDrag])

    const snapBack = () => animate(x, 0, { type: 'spring', stiffness: 340, damping: 30 })
    const snapForward = () => animate(x, maxDrag, { type: 'spring', stiffness: 340, damping: 30 })
    // At the top of the component, with the other motion values
    const knobRotate = useTransform(x, [0, maxDrag], [0, 80]);

    const handleDragEnd = () => {
        if (connecting) return
        const currentX = x.get()
        if (currentX >= maxDrag * 0.88) {
            snapForward()
            onTriggered()
        } else {
            snapBack()
        }
    }

    return (
        <div
            ref={trackRef}
            style={{
                position: 'relative',
                height: knobSize + 8,
                borderRadius: 999,
                background: '#f0efea',
                border: '1px solid #e4e4df',
                overflow: 'hidden',
                userSelect: 'none',
                cursor: connecting ? 'wait' : 'default',
            }}
        >
            {/* ── Fill ─────────────────────────────────────────────── */}
            <motion.div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 999,
                    background: '#242b35',
                    zIndex: 1,
                    width: done ? '100%' : fillWidth,
                }}
            />

            {/* ── Shimmer ───────────────────────────────────────────── */}
            {(connecting || done) && (
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '40%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)',
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* ── Label ────────────────────────────────────────────── */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3,
                    pointerEvents: 'none',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: (connecting || done) ? '#ffffff' : textColor,
                }}
            >
                {done ? 'Connected ✓' : connecting ? 'Connecting…' : 'Slide to connect →'}
            </motion.div>

            {/* ── Knob ─────────────────────────────────────────────── */}
            {!done && (
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: maxDrag }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={(_, info) => {
                        if (connecting) return
                        // clamp manually — dragConstraints alone can drift
                        x.set(Math.max(0, Math.min(info.point.x - (trackRef.current?.getBoundingClientRect().left ?? 0) - knobSize / 2 - 4, maxDrag)))
                    }}
                    onDragEnd={handleDragEnd}
                    style={{
                        x, // bind motion value directly — no animate conflict
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: knobSize,
                        height: knobSize,
                        borderRadius: '50%',
                        background: '#242b35',
                        zIndex: 4,
                        cursor: connecting ? 'wait' : 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(36,43,53,0.22)',
                    }}
                    whileTap={connecting ? {} : { scale: 0.93 }}
                >
                    <motion.div
                        animate={{ rotate: connecting ? 360 : 0 }}
                        style={{ rotate: connecting ? undefined : knobRotate }}
                        transition={
                            connecting
                                ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                                : { type: 'spring', stiffness: 200 }
                        }
                    >
                        <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} />
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function ConnectPage() {
    const router = useRouter()
    const { setWallet, willAccount } = useWillStore()

    const { ready, authenticated } = usePrivy()
    const { wallets } = useWallets()

    const [connecting, setConnecting] = useState(false)
    const [done, setDone] = useState(false)

    const login = useLogin({
        onComplete: async ({ user }) => {
            const address = user?.wallet?.address || wallets?.[0]?.address || ''
            if (!address) {
                setConnecting(false)
                toast.error('Wallet not found.')
                return
            }
            setWallet(address)
            setDone(true)
            toast.success(`Connected ${address.slice(0, 4)}…${address.slice(-4)}`)
            setTimeout(() => router.push('/dashboard'), 400)
        },
        onError: () => {
            setConnecting(false)
            toast.error('Connection failed.')
        },
    })

    useEffect(() => {
        if (authenticated && wallets?.[0]?.address) {
            setWallet(wallets[0].address)
            window.location.href = willAccount ? '/dashboard' : '/setup'
        }
    }, [authenticated, wallets, setWallet])

    const handleSlideTriggered = async () => {
        if (!ready || connecting) return
        try {
            setConnecting(true)
            await login.login({ loginMethods: ['wallet'], walletChainType: 'solana-only' })
        } catch {
            setConnecting(false)
            toast.error('Connection cancelled.')
        }
    }

    const features = [
        { icon: Shield, label: 'Non-Custodial' },
        { icon: Lock, label: 'End-to-End Encrypted' },
        { icon: Zap, label: 'Instant Execution' },
    ]

    return (
        <>
            <style>{`
                * { box-sizing: border-box; }

                .connect-page {
                    min-height: 100vh;
                    background: #eeeee9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    font-family: 'DM Sans', sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                /* subtle dot grid */
                .connect-page::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle, rgba(36,43,53,0.08) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }

                .split-wrapper {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 900px;
                    display: flex;
                    align-items: center;
                    gap: 60px;
                }

                .left-panel {
                    flex: 1;
                    min-width: 0;
                }

                .right-panel {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 768px) {
                    .split-wrapper { flex-direction: column; gap: 40px; }
                    .right-panel { order: -1; }
                }
            `}</style>

            <div className="connect-page">
                <div className="split-wrapper">

                    {/* ── LEFT ── */}
                    <motion.div
                        className="left-panel"
                        initial={{ opacity: 0, x: -32 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Logo row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>

                            <img src="/solwillicon.jpeg" className='w-18 h-16' alt="" />
                            <span style={{
                                color: '#1a1a18',
                                fontWeight: 800,
                                fontSize: 20,
                                letterSpacing: '-0.04em',
                                fontFamily: '"DM Sans", sans-serif',
                            }}>SolWill</span>
                            <div style={{
                                marginLeft: 4,
                                background: 'rgba(36,43,53,0.07)',
                                color: '#555550',
                                fontSize: 9,
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: 20,
                                border: '1px solid rgba(36,43,53,0.14)',
                                letterSpacing: '0.05em',
                            }}>BETA</div>
                        </div>

                        {/* Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <p className="eyebrow" style={{
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: '#8a8a82',
                                marginBottom: 16,
                                fontFamily: '"DM Sans", sans-serif',
                            }}>
                                On-chain inheritance
                            </p>

                            <h1 style={{
                                margin: '0 0 14px',
                                fontSize: 'clamp(32px, 4vw, 52px)',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                color: '#1a1a18',
                                lineHeight: 1.08,
                                fontFamily: '"Instrument Serif", serif',
                            }}>
                                Your wealth,{' '}
                                <em style={{
                                    fontStyle: 'italic',
                                    color: '#555550',
                                }}>secured forever.</em>
                            </h1>

                            <p style={{
                                margin: '0 0 32px',
                                fontSize: 17,
                                lineHeight: 1.75,
                                color: '#555550',
                                maxWidth: 480,
                                fontFamily: '"DM Sans", sans-serif',
                                fontWeight: 400,
                            }}>
                                Create an on-chain inheritance will on Solana. Assign beneficiaries, set conditions, and let smart contracts handle the rest — no lawyers, no intermediaries.
                            </p>
                        </motion.div>

                        {/* Connect card */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e4e4df',
                                borderRadius: 18,
                                padding: '28px 28px 22px',
                                boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                            }}
                        >
                            {/* Wallet pill */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 18,
                            }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: '#242b35',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <img src="/phantom.png" alt="Phantom" style={{ width: 18, height: 18 }} />
                                </div>
                                <div>
                                    <div style={{
                                        color: '#1a1a18',
                                        fontSize: 14,
                                        letterSpacing: '-0.02em',
                                        fontFamily: '"DM Sans", sans-serif',
                                    }}>
                                        Phantom Wallet
                                    </div>
                                    <div style={{
                                        color: '#8a8a82',
                                        fontSize: 11,
                                        fontFamily: '"DM Sans", sans-serif',
                                    }}>
                                        Solana · Secure login via Privy
                                    </div>
                                </div>
                                <div style={{
                                    marginLeft: 'auto',
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: done ? '#22c55e' : '#f59e0b',
                                    boxShadow: done ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
                                    transition: 'all 0.4s ease',
                                }} />
                            </div>

                            {/* Slider */}
                            <SlideToConnect
                                onTriggered={handleSlideTriggered}
                                connecting={connecting}
                                done={done}
                            />

                            {/* Trust badges */}
                            <div style={{
                                display: 'flex',
                                gap: 16,
                                marginTop: 18,
                                flexWrap: 'wrap',
                            }}>
                                {features.map(({ icon: Icon, label }) => (
                                    <div key={label} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        color: '#8a8a82',
                                    }}>
                                        <Icon size={11} />
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 500,
                                            letterSpacing: '0.01em',
                                            fontFamily: '"DM Sans", sans-serif',
                                        }}>
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Footer note */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                margin: '16px 0 0',
                                fontSize: 11,
                                color: '#8a8a82',
                                letterSpacing: '-0.01em',
                                fontFamily: '"DM Sans", sans-serif',
                            }}
                        >
                            By connecting, you agree to our{' '}
                            <span style={{ color: '#555550', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#e4e4df' }}>Terms of Service</span>
                            {' '}and{' '}
                            <span style={{ color: '#555550', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#e4e4df' }}>Privacy Policy</span>.
                        </motion.p>
                    </motion.div>

                    {/* ── RIGHT ── */}
                    <motion.div
                        className="right-panel"
                        initial={{ opacity: 0, x: 48 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <PhoneMockup />
                    </motion.div>

                </div>
            </div>
        </>
    )
}