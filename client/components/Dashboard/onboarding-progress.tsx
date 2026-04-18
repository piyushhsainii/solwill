import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'
import { STEPS } from '@/lib/utils/helper'

type Props = {
    currentStep: number
    completedSteps: boolean[]
    goNext: () => void
    goBack: () => void
    isNextLocked: boolean          // ← new
}

export function OnboardingProgress({
    currentStep,
    completedSteps,
    goNext,
    goBack,
    isNextLocked
}: Props) {
    const getDone = (index: number) => {
        if (index >= currentStep) return false
        return completedSteps[index] ?? false
    }

    const isFirst = currentStep === 0 || (currentStep === 1 && completedSteps[0])


    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 4px',
                marginBottom: 28,
                width: '100%',
            }}
        >
            {/* BACK BUTTON — hidden on first step */}
            <AnimatePresence>
                {!isFirst && (
                    <motion.button
                        key="back"
                        initial={{ opacity: 0, scale: 0.7, x: -8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.7, x: -8 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        whileHover={{ scale: 1.08, x: -2 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={goBack}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            color: 'var(--text-primary)',
                        }}
                    >
                        <ChevronLeft size={17} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* STEPPER */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 0,
                }}
            >
                {STEPS.map((step, i) => {
                    const done = getDone(i)
                    const active = i === currentStep

                    return (
                        <React.Fragment key={step.label}>
                            {/* Step bubble + label */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 9,
                                    flexShrink: 0,
                                    padding: active ? '5px 10px 5px 5px' : '5px',
                                    borderRadius: 999,
                                    border: active
                                        ? '1px solid var(--border)'
                                        : '1px solid transparent',
                                    background: active ? 'var(--surface)' : 'transparent',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {/* Bubble */}
                                <motion.div
                                    animate={{
                                        scale: active ? 1.05 : 1,
                                        background: done
                                            ? '#43d17a'
                                            : active
                                                ? 'var(--primary)'
                                                : 'transparent',
                                        borderColor: done
                                            ? '#43d17a'
                                            : active
                                                ? 'var(--primary)'
                                                : 'var(--border)',
                                        boxShadow: active
                                            ? '0 0 0 3px rgba(36,43,53,0.08)'
                                            : '0 0 0 0px transparent',
                                    }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: '50%',
                                        border: '1.5px solid var(--border)',
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
                                                <Check size={14} strokeWidth={3} color="white" />
                                            </motion.div>
                                        ) : (
                                            <motion.span
                                                key="num"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: active
                                                        ? '#fff'
                                                        : 'var(--text-secondary)',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {i + 1}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Label — only visible when active or done */}
                                <AnimatePresence>
                                    {(active || done) && (
                                        <motion.span
                                            key="label"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{
                                                duration: 0.25,
                                                ease: [0.23, 1, 0.32, 1],
                                            }}
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                color: done ? '#43d17a' : 'var(--text-primary)',
                                            }}
                                        >
                                            {step.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: 1.5,
                                        borderRadius: 999,
                                        background: 'var(--border)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        marginInline: 2,
                                        minWidth: 12,
                                    }}
                                >
                                    <motion.div
                                        animate={{ width: done ? '100%' : '0%' }}
                                        transition={{
                                            duration: 0.55,
                                            ease: [0.23, 1, 0.32, 1],
                                        }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: 999,
                                            background:
                                                'linear-gradient(90deg, #43d17a, #62e494)',
                                        }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>

            {/* NEXT BUTTON */}
            <motion.button
                whileHover={{ scale: 1.08, x: 2 }}
                whileTap={{ scale: 0.94 }}
                onClick={goNext}
                disabled={isNextLocked}
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.14)',
                    cursor: isNextLocked ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    opacity: isNextLocked ? 0.4 : 1,

                }}
            >
                <ChevronRight size={17} />
            </motion.button>
        </div>
    )
}