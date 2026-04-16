'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    ArrowRight,
    Shield,
    Lock,
    Zap,
    Users,
    FileText,
    Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWillStore } from '../store/useWillStore'
import { usePrivy, useWallets, useLogin } from '@privy-io/react-auth'
import PhoneMockup from '@/components/Landing/PhoneMockup'

/* ─── SolWill Logo SVG ─────────────────────────────────────────── */
function SolWillLogo({ size = 32 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 3L5 9V20C5 28.5 12 35.5 20 38C28 35.5 35 28.5 35 20V9L20 3Z"
                fill="url(#shieldGradLight)" stroke="rgba(36,43,53,0.12)" strokeWidth="0.5" />
            <path d="M14 16C14 16 16 14 20 14C24 14 26 16 26 18C26 20 24 21 20 21C16 21 14 22 14 24C14 26 16 28 20 28C24 28 26 26 26 26"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <defs>
                <linearGradient id="shieldGradLight" x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#242b35" />
                    <stop offset="1" stopColor="#3d4a5c" />
                </linearGradient>
            </defs>
        </svg>
    )
}

/* ─── Phone Mockup ─────────────────────────────────────────────── */

/* ─── Slider ────────────────────────────────────────────────────── */
function SlideToConnect({
    onTriggered,
    connecting,
    done,
}: {
    onTriggered: () => void
    connecting: boolean
    done: boolean
}) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [dragX, setDragX] = useState(0)
    const [trackW, setTrackW] = useState(300)
    const knobSize = 52
    const maxDrag = trackW - knobSize - 8

    useEffect(() => {
        const el = trackRef.current
        if (!el) return
        const ro = new ResizeObserver(entries => {
            setTrackW(entries[0].contentRect.width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const progress = maxDrag > 0 ? dragX / maxDrag : 0
    const textDark = progress > 0.5 || connecting || done

    useEffect(() => {
        if (!connecting && !done && dragX > 0 && dragX < maxDrag * 0.88) {
            const raf = requestAnimationFrame(() => setDragX(0))
            return () => cancelAnimationFrame(raf)
        }
    }, [connecting])

    return (
        <div
            ref={trackRef}
            style={{
                position: 'relative',
                height: knobSize + 8,
                borderRadius: 999,
                background: '#f7f7f4',
                border: '1px solid #e4e4df',
                overflow: 'hidden',
                userSelect: 'none',
                cursor: connecting ? 'wait' : 'default',
            }}
        >
            {/* Fill */}
            <motion.div
                animate={{ width: done ? '100%' : `${4 + dragX + knobSize / 2}px` }}
                transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 999,
                    background: '#242b35',
                    zIndex: 1,
                }}
            />

            {/* Shimmer on fill */}
            {(connecting || dragX > 0) && (
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '40%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Label */}
            <div
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
                    transition: 'color 0.2s ease',
                    color: textDark ? '#ffffff' : '#8a8a82',
                }}
            >
                {done ? 'Connected ✓' : connecting ? 'Connecting…' : 'Slide to connect →'}
            </div>

            {/* Knob */}
            {!done && (
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: maxDrag }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={(_, info) => {
                        if (!connecting) {
                            setDragX(Math.max(0, Math.min(info.offset.x, maxDrag)))
                        }
                    }}
                    onDragEnd={() => {
                        if (dragX >= maxDrag * 0.88) {
                            setDragX(maxDrag)
                            onTriggered()
                        } else {
                            setDragX(0)
                        }
                    }}
                    animate={{ x: dragX }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: knobSize,
                        height: knobSize,
                        borderRadius: '50%',
                        background: '#ffffffs',
                        zIndex: 4,
                        cursor: connecting ? 'wait' : 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(36,43,53,0.18)',
                    }}
                    whileTap={{ scale: 0.93 }}
                >
                    <motion.div
                        animate={{ rotate: connecting ? 360 : dragX * 0.8 }}
                        transition={connecting
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
            setTimeout(() => router.push(willAccount ? '/dashboard' : '/setup'), 800)
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
                            <SolWillLogo size={38} />
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
                                    <svg width="18" height="18" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M64 8C33.07 8 8 33.07 8 64s25.07 56 56 56 56-25.07 56-56S94.93 8 64 8Z" fill="white" fillOpacity="0.1" />
                                        <path d="M106.5 57.5C106.5 36.79 89.71 20 69 20H59C38.29 20 21.5 36.79 21.5 57.5c0 13.47 7.17 25.26 17.86 31.83v8.17a5 5 0 0 0 5 5h4.64a5 5 0 0 0 4.47-2.76l2.24-4.49a29.9 29.9 0 0 0 8.29 1.18c2.85 0 5.6-.4 8.2-1.14l2.23 4.45a5 5 0 0 0 4.47 2.76h4.64a5 5 0 0 0 5-5v-8.12C99.3 82.83 106.5 71 106.5 57.5Z" fill="white" />
                                        <circle cx="52" cy="55" r="6" fill="rgba(255,255,255,0.5)" />
                                        <circle cx="76" cy="55" r="6" fill="rgba(255,255,255,0.5)" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{
                                        color: '#1a1a18',
                                        fontWeight: 600,
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