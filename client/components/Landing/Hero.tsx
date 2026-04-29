'use client'

import { motion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'
import styles from './Hero.module.css'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const stats = [
  { val: '$140B+', lbl: 'crypto lost to inaccessible wallets' },
  { val: '<0.01¢', lbl: 'per check-in on Solana' },
  { val: '100%', lbl: 'trustless · enforced on-chain' },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      <motion.div
        className={styles.heroLeft}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className={styles.badge}>
          <span className={styles.badgeDot} />
          Built on Solana · Frontier Hackathon 2025
        </motion.div>

        <motion.h1 variants={fadeUp} className={styles.h1}>
          Your crypto,<br />
          <em>protected forever.</em>
        </motion.h1>

        <motion.p variants={fadeUp} className={styles.sub}>
          The first trustless crypto inheritance protocol on Solana. Set up a
          will in 3 minutes. No lawyers, no custodians, no trust required.
        </motion.p>

        <motion.div variants={fadeUp} className={styles.actions}>
          <Link href="/dashboard" className="btn-primary">
            Get Started
          </Link>
          <a

            href="https://github.com/piyushhsainii/solwill"
            className={styles.btnSecondary}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.stats}>
          {stats.map(({ val, lbl }) => (
            <div key={val}>
              <div className={styles.statVal}>{val}</div>
              <div className={styles.statLbl}>{lbl}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.heroRight}
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <PhoneMockup />
      </motion.div>
    </section>
  )
}
