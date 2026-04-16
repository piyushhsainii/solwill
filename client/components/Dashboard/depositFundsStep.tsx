import { motion, AnimatePresence } from 'framer-motion'
import { Wallet } from 'lucide-react'
import Link from 'next/link'


export default function DepositFundsStep({ dir, setPhase }: { dir: 'forward' | 'back'; setPhase?: (phase: 0 | 1 | 2 | 'dashboard') => void }) {
    const child = {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    }
    const tokens = [
        { symbol: '◎', name: 'Solana (SOL)', desc: 'Native token' },
        { symbol: '$', name: 'USD Coin (USDC)', desc: 'Stablecoin' },
    ]

    const fadeUp = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
    }
    const slideRight = {
        hidden: { opacity: 0, x: 52 },
        show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
        exit: { opacity: 0, x: -52, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
    }
    const slideLeft = {
        hidden: { opacity: 0, x: -52 },
        show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
        exit: { opacity: 0, x: 52, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
    }
    const variants = dir === 'forward' ? slideRight : slideLeft

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ textAlign: 'center' }}
        >
            <motion.div variants={fadeUp} initial="hidden" animate="show">
                <motion.div variants={child}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 22,
                            background: 'var(--primary)',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 14px 34px rgba(0,0,0,0.12)',
                        }}
                    >
                        <Wallet size={30} color="white" />
                    </div>

                    <h2
                        style={{
                            margin: '0 0 8px',
                            fontSize: 22,
                            fontWeight: 500,
                            letterSpacing: '-0.035em',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Fund Your Vault
                    </h2>

                    <p
                        style={{
                            margin: '0 0 24px',
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: 'var(--text-secondary)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Deposit assets that will later be distributed automatically.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                    {tokens.map((token, i) => (
                        <motion.div
                            key={token.name}
                            variants={child}
                            whileHover={{ y: -2 }}
                            style={{
                                padding: '14px 16px',
                                borderRadius: 16,
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                                textAlign: 'left',
                            }}
                        >
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    background: 'rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16,
                                }}
                            >
                                {token.symbol}
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--text-primary)',
                                        fontWeight: 500,
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {token.name}
                                </div>

                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-secondary)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {token.desc}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div>

                    <Link href="/manage-funds">
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                borderRadius: 14,
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'white',
                                fontSize: 14,
                                fontWeight: 400,
                                letterSpacing: '-0.025em',
                                cursor: 'pointer',
                            }}
                        >
                            Deposit Funds
                        </motion.button>
                    </Link>
                    <motion.button
                        onClick={() => setPhase?.('dashboard')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            borderRadius: 14,
                            border: 'none',
                            color: 'black',
                            fontSize: 14,
                            fontWeight: 400,
                            letterSpacing: '-0.025em',
                            cursor: 'pointer',
                        }}
                    >
                        Skip for now
                    </motion.button>
                </div>

            </motion.div>
        </motion.div>
    )
}