'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Wallet } from 'lucide-react'
import Link from 'next/link'


export default function NoAssetsState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
                padding: '28px 20px',
                borderRadius: 22,
                border: '1px solid var(--border)',
                background:
                    'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                textAlign: 'center',
                minHeight: 240,
            }}
        >
            <motion.div
                initial={{ scale: 0.85, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 220,
                    damping: 18,
                    delay: 0.08,
                }}
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'rgba(36,43,53,0.06)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Wallet size={28} color="var(--text-primary)" strokeWidth={1.8} />
            </motion.div>

            <div>
                <h3
                    style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 500,
                        letterSpacing: '-0.03em',
                        color: 'var(--text-primary)',
                    }}
                >
                    No Assets Yet
                </h3>

                <p
                    style={{
                        margin: '8px 0 0',
                        fontSize: 13,
                        lineHeight: 1.65,
                        letterSpacing: '-0.02em',
                        color: 'var(--text-secondary)',
                        maxWidth: 320,
                    }}
                >
                    Your estate vault is empty right now. Deposit SOL or SPL tokens
                    to begin securing assets for your heirs.
                </p>
            </div>

            <Link href="/manage-funds" style={{ textDecoration: 'none' }}>
                <motion.button
                    whileHover={{
                        scale: 1.02,
                        y: -1,
                        boxShadow: '0 12px 28px rgba(36,43,53,0.12)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    style={{
                        marginTop: 4,
                        height: 42,
                        padding: '0 18px',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: '-0.02em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: 'inherit',
                    }}
                >
                    Add Assets
                    <ArrowRight size={15} strokeWidth={1.8} />
                </motion.button>
            </Link>
        </motion.div>
    )
}
