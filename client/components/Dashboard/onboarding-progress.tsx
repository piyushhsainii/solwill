import { STEPS } from '@/lib/utils/helper'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import React from 'react'

type Props = {
    currentStep: number
    completedSteps: boolean[]
}


export function OnboardingProgress({
    currentStep,
    completedSteps,
}: Props) {
    const getDone = (index: number) => {
        if (index >= currentStep) return false
        return completedSteps[index] ?? false
    }

    const pct = (currentStep / (STEPS.length - 1)) * 100

    return (
        <div
            className="card"
            style={{
                padding: '22px 16px',
                marginBottom: 28,
                background: 'var(--surface)',
                width: '100%',
            }}
        >
            {/* Top Progress */}
            <div
                style={{
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--border)',
                    overflow: 'hidden',
                    marginBottom: 28,
                }}
            >
                <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{
                        duration: 0.7,
                        ease: [0.23, 1, 0.32, 1],
                    }}
                    style={{
                        height: '100%',
                        borderRadius: 999,
                        background:
                            'linear-gradient(90deg,var(--primary),#3b4656)',
                    }}
                />
            </div>

            {/* Stepper */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 8,
                }}
            >
                {STEPS.map((step, i) => {
                    const done = getDone(i)
                    const active = i === currentStep

                    return (
                        <div
                            key={step.label}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'flex-start',
                                minWidth: 0,
                            }}
                        >
                            {/* Bubble + Label */}
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <motion.div
                                    animate={{
                                        scale: active ? 1.06 : 1,
                                        background: done
                                            ? '#43d17a'
                                            : active
                                                ? 'linear-gradient(135deg,var(--primary),#3a4555)'
                                                : 'var(--surface)',
                                        borderColor: done
                                            ? '#43d17a'
                                            : active
                                                ? 'rgba(36,43,53,.15)'
                                                : 'var(--border)',
                                        boxShadow: active
                                            ? '0 0 0 4px rgba(36,43,53,.08), var(--shadow-card)'
                                            : 'var(--shadow-card)',
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: [0.23, 1, 0.32, 1],
                                    }}
                                    style={{
                                        width: window.innerWidth < 640 ? 46 : 58,
                                        height: window.innerWidth < 640 ? 46 : 58,
                                        borderRadius: '50%',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <AnimatePresence mode="wait">
                                        {done ? (
                                            <motion.div
                                                key="check"
                                                initial={{ scale: 0, rotate: -30 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0 }}
                                            >
                                                <Check
                                                    size={18}
                                                    strokeWidth={3}
                                                    color="white"
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.span
                                                key="num"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 800,
                                                    color: active
                                                        ? '#fff'
                                                        : 'var(--text-secondary)',
                                                }}
                                            >
                                                {i + 1}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <span
                                    style={{
                                        fontSize: window.innerWidth < 640 ? 11 : 13,
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        lineHeight: 1.3,
                                        color: done
                                            ? '#43d17a'
                                            : active
                                                ? 'var(--text-primary)'
                                                : 'var(--text-secondary)',
                                        maxWidth: 90,
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector */}
                            {i < STEPS.length - 1 && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: 2,
                                        marginTop: 22,
                                        marginInline: 6,
                                        borderRadius: 999,
                                        background: 'var(--border)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            width: done ? '100%' : '0%',
                                        }}
                                        transition={{
                                            duration: 0.55,
                                            ease: [0.23, 1, 0.32, 1],
                                        }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: 999,
                                            background:
                                                'linear-gradient(90deg,#43d17a,#62e494)',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}