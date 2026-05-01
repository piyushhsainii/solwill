'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function WillTriggeredBanner() {
    const router = useRouter()

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className='max-w-[500px] flex justify-center mx-auto '
            style={{
                background: '#FFF8F8',
                border: '1px solid #FECACA',
                borderRadius: '24px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: '0 2px 12px rgba(220,38,38,0.06)',
                fontWeight: 300,
                letterSpacing: '-0.02em',
            }}
        >
            {/* Top row: icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.div
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#FEE2E2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#EF4444" />
                        <path d="M12 7v5M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </motion.div>
                <div>
                    <div style={{
                        fontSize: '10px', textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: '#EF4444', fontWeight: 300,
                    }}>
                        Recovery Protocol Active
                    </div>
                    <div style={{
                        fontSize: '20px', color: '#B91C1C',
                        fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.2,
                        marginTop: 2,
                    }}>
                        Will Triggered
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#FECACA' }} />

            {/* Body */}
            <p style={{
                fontSize: '14px', lineHeight: 1.7,
                color: '#7F1D1D', margin: 0,
                fontWeight: 300, letterSpacing: '-0.01em',
            }}>
                The verification window has elapsed and the recovery protocol is now executing.
                Your designated beneficiaries have been notified. Navigate to the claims page
                to complete the estate transfer process.
            </p>

            {/* Metadata row */}
            <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}>
                {[
                    { label: 'Status', value: 'Executing' },
                    { label: 'Beneficiaries', value: 'Notified' },
                    { label: 'Recovery', value: 'In Progress' },
                ].map(({ label, value }) => (
                    <div key={label} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 300 }}>
                            {label}
                        </span>
                        <span style={{
                            fontSize: '12px', color: '#B91C1C',
                            fontWeight: 400, letterSpacing: '-0.01em',
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <motion.span
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                                style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#EF4444', display: 'inline-block',
                                }}
                            />
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <motion.button
                onClick={() => router.push('/claim-will')}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                }}
            >
                Proceed to Claim Estate
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.button>

            {/* Footer note */}
            <p style={{
                fontSize: '11px', color: '#EF4444', margin: 0,
                textAlign: 'center', fontWeight: 300, lineHeight: 1.6,
                opacity: 0.7,
            }}>
                This action is irreversible. Ensure all beneficiary details are verified before proceeding.
            </p>
        </motion.div>
    )
}