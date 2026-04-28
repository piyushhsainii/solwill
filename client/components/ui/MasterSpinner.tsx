'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingStep } from '@/lib/utils/helper'

const STEP_MESSAGES: Record<LoadingStep, string> = {
    wallet: 'Connecting wallet…',
    chain: 'Loading your will from chain…',
    done: 'Almost there…',
}

interface FullScreenLoaderProps {
    label?: string
    step?: LoadingStep
}

const MESSAGES = [
    'Initialising vault…',
    'Connecting to Solana…',
    'Verifying identity…',
    'Loading your will…',
    'Almost there…',
]

interface FullScreenLoaderProps {
    label?: string
    step?: LoadingStep   // ← must be LoadingStep, not string
}
export default function FullScreenLoader({ label, step }: FullScreenLoaderProps) {
    const [msgIndex, setMsgIndex] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (step) return  // ← skip cycling if we have a real step
        const iv = setInterval(() => {
            setMsgIndex(i => (i + 1) % MESSAGES.length)
        }, 1800)
        return () => clearInterval(iv)
    }, [step])

    // Progress bar: reset and re-animate when step changes
    useEffect(() => {
        setProgress(0)
        let p = 0
        const iv = setInterval(() => {
            const step = p < 60 ? 3 : p < 85 ? 1 : 0.3
            p = Math.min(p + step, 92)
            setProgress(p)
        }, 80)
        return () => clearInterval(iv)
    }, [step])  // ← re-run per step, not per mount

    const displayMsg = label ?? (step ? STEP_MESSAGES[step as LoadingStep] : MESSAGES[msgIndex])

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#EEEEE9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflow: 'hidden',
        }}>
            {/* Subtle grain texture overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                pointerEvents: 'none',
            }} />

            {/* Radial glow behind logo */}
            <div style={{
                position: 'absolute',
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(36,43,53,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0,
                }}
            >
                {/* Logo with floating + pulse ring animation */}
                <div style={{ position: 'relative', marginBottom: 32 }}>
                    {/* Outer pulse ring */}
                    <motion.div
                        animate={{
                            scale: [1, 1.18, 1],
                            opacity: [0.15, 0, 0.15],
                        }}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{
                            position: 'absolute',
                            inset: -24,
                            borderRadius: '50%',
                            border: '1.5px solid #242B35',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Middle pulse ring */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0, 0.1],
                        }}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: 0.4,
                        }}
                        style={{
                            position: 'absolute',
                            inset: -12,
                            borderRadius: '50%',
                            border: '1px solid #242B35',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Logo container */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: 28,
                            background: '#FFFFFF',
                            border: '1px solid #E4E4DF',
                            boxShadow: '0 8px 32px rgba(36,43,53,0.10), 0 2px 8px rgba(36,43,53,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <img
                            src="/solwillicon.jpeg"
                            alt="SolWill"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </motion.div>
                </div>

                {/* Wordmark */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{
                        fontSize: 22,
                        fontWeight: 300,
                        color: '#1A1A18',
                        letterSpacing: '-0.03em',
                        marginBottom: 6,
                        fontFamily: '"DM Sans", sans-serif',
                    }}
                >
                    SolWill
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{
                        fontSize: 11,
                        fontWeight: 400,
                        color: '#8A8A82',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        marginBottom: 44,
                        fontFamily: '"DM Sans", sans-serif',
                    }}
                >
                    Secure Legacy Vault
                </motion.div>

                {/* Progress bar */}
                <div style={{
                    width: 200,
                    height: 2,
                    borderRadius: 999,
                    background: '#E4E4DF',
                    overflow: 'hidden',
                    marginBottom: 18,
                }}>
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{
                            height: '100%',
                            borderRadius: 999,
                            background: '#242B35',
                        }}
                    />
                </div>

                {/* Cycling status message */}
                <div style={{ height: 20, overflow: 'hidden', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={displayMsg}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            style={{
                                margin: 0,
                                fontSize: 12,
                                color: '#8A8A82',
                                fontWeight: 300,
                                letterSpacing: '-0.01em',
                                fontFamily: '"DM Sans", sans-serif',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {displayMsg}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Bottom node indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                style={{
                    position: 'absolute',
                    bottom: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 14px',
                    borderRadius: 999,
                    background: '#FFFFFF',
                    border: '1px solid #E4E4DF',
                    boxShadow: '0 1px 6px rgba(36,43,53,0.06)',
                }}
            >
                {/* Pulsing green dot */}
                <div style={{ position: 'relative', width: 6, height: 6 }}>
                    <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: '#43d17a',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: '#43d17a',
                    }} />
                </div>
                <span style={{
                    fontSize: 11,
                    color: '#555550',
                    fontWeight: 300,
                    letterSpacing: '-0.01em',
                    fontFamily: '"DM Sans", sans-serif',
                }}>
                    Devnet
                </span>
            </motion.div>
        </div>
    )
}