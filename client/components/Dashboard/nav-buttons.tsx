import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function OnboardingNavButtons({
    phase,
    goNext,
    goBack,
}: {
    phase: 0 | 1 | 2 | 'dashboard'
    goNext: () => void
    goBack: () => void
}) {
    const isFirst = phase === 0
    const isLast = phase === 2

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
            }}
        >
            {/* BACK */}
            <motion.button
                whileHover={!isFirst ? { scale: 1.08, x: -2 } : {}}
                whileTap={!isFirst ? { scale: 0.95 } : {}}
                disabled={isFirst}
                onClick={goBack}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isFirst ? 0.35 : 1,
                    cursor: isFirst ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <ChevronLeft size={18} />
            </motion.button>

            {/* NEXT */}
            <motion.button
                whileHover={{ scale: 1.08, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={goNext}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                }}
            >
                <ChevronRight size={18} />
            </motion.button>
        </div>
    )
}