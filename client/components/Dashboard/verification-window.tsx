import { AlertTriangle, } from 'lucide-react'
import React from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/utils/helper'


const VerificationWindow = ({
    progressPct,
    isUrgent,
    intervalDays,
    daysLeft
}: {
    progressPct: number;
    isUrgent: boolean;
    intervalDays: number;
    daysLeft: number;
}) => {
    return (
        <motion.div variants={fadeUp} style={{ gridColumn: 'span 3' }}>
            <motion.div
                whileHover={{ y: -2, boxShadow: '0 16px 48px rgba(36,43,53,0.10)', borderColor: isUrgent ? '#ef4444' : '#242B35' }}
                transition={{ duration: 0.2 }}
                style={{
                    background: isUrgent ? '#FFF8F8' : '#FFFFFF',
                    border: `1px solid ${isUrgent ? '#fca5a5' : '#E4E4DF'}`,
                    borderRadius: '20px',
                    padding: '24px',
                    height: '100%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                    transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
                }}
            >
                {isUrgent && (
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.03,
                        background: '#ef4444', pointerEvents: 'none',
                    }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <motion.div
                        key={daysLeft}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            fontSize: '56px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em',
                            color: isUrgent ? '#ef4444' : '#1A1A18',
                        }}
                    >
                        {daysLeft}
                    </motion.div>
                    {isUrgent && (
                        <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 1.8 }}
                        >
                            <AlertTriangle size={18} color="#ef4444" />
                        </motion.div>
                    )}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A18', marginBottom: 2 }}>Days Remaining</div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8A82' }}>
                    Verification Window
                </span>
                <p style={{ fontSize: '12px', color: '#8A8A82', lineHeight: 1.65, margin: '12px 0 16px' }}>
                    Recovery protocol triggers if verification lapses.
                </p>
                <div style={{ height: '5px', borderRadius: '999px', overflow: 'hidden', background: '#EEEEE9' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                            height: '100%', borderRadius: '999px',
                            background: isUrgent
                                ? 'linear-gradient(90deg,#ef4444,#f97316)'
                                : 'linear-gradient(90deg,#242B35,#4A5568)',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ fontSize: '10px', color: '#8A8A82' }}>0d</span>
                    <span style={{ fontSize: '10px', color: '#8A8A82' }}>{intervalDays}d</span>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default VerificationWindow