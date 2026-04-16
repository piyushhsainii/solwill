'use client'

import { motion } from 'framer-motion'
import styles from './Features.module.css'

const features = [
  {
    bg: 'var(--purple-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <rect x="3" y="6" width="16" height="12" rx="2.5" stroke="#534AB7" strokeWidth="1.25" />
        <path d="M15 6V5a4 4 0 0 0-8 0v1" stroke="#534AB7" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
    title: 'Multi-asset vault',
    desc: 'Lock SOL, any SPL token, and NFTs (including compressed NFTs) into a single program-controlled vault. All transferred atomically to heirs.',
  },
  {
    bg: 'var(--teal-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <path d="M11 3v4M11 15v4M3 11h4m7 0h4" stroke="#0F6E56" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="11" cy="11" r="3" stroke="#0F6E56" strokeWidth="1.25" />
      </svg>
    ),
    title: 'Flexible heir splits',
    desc: 'Assign exact percentage splits in basis points. Up to 10 heirs per will. Share calculation and distribution is done entirely in-program.',
  },
  {
    bg: 'var(--amber-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="7" stroke="#854F0B" strokeWidth="1.25" />
        <path d="M11 7v4l2.5 2.5" stroke="#854F0B" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Configurable intervals',
    desc: 'Choose 30, 90, or 180-day check-in windows. Check-in from any wallet client — just sign the instruction from your owner key.',
  },
  {
    bg: 'var(--coral-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="5" r="2" stroke="#993C1D" strokeWidth="1.25" />
        <circle cx="4" cy="17" r="2" stroke="#993C1D" strokeWidth="1.25" />
        <circle cx="18" cy="17" r="2" stroke="#993C1D" strokeWidth="1.25" />
        <path d="M11 7v4M9.27 10.27L6 15M12.73 10.27L16 15" stroke="#993C1D" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
    title: 'Permissionless trigger',
    desc: 'After expiry, anyone can call the trigger instruction. The program validates the deadline against the on-chain clock — no trusted party needed.',
  },
  {
    bg: 'var(--purple-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <path d="M19 11a8 8 0 1 1-8-8" stroke="#534AB7" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M19 3l-6 6M13 3h6v6" stroke="#534AB7" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Helius webhook alerts',
    desc: 'Helius monitors on-chain events and pushes real-time notifications when a will is triggered or an heir claims their share.',
  },
  {
    bg: 'var(--teal-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <path d="M11 3L4 7v5c0 4 3.5 7 7 8 3.5-1 7-4 7-8V7l-7-4z" stroke="#0F6E56" strokeWidth="1.25" strokeLinejoin="round" />
        <path d="M8 11l2 2 4-4" stroke="#0F6E56" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Cancellable anytime',
    desc: 'Owner can cancel the will and withdraw all vault assets at any time while the will is Active. Full custody, always.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function Features() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.p variants={fadeUp} className="eyebrow">Features</motion.p>
          <motion.h2 variants={fadeUp} className="section-h2">
            Built for the real world,<br />
            <em>enforced on-chain.</em>
          </motion.h2>

          <div className={styles.grid}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className={styles.card}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <motion.div
                  className={styles.icon}
                  style={{ background: f.bg }}
                  whileHover={{ scale: 1.12, rotate: 3, transition: { duration: 0.2 } }}
                >
                  {f.icon}
                </motion.div>
                <div className={styles.title}>{f.title}</div>
                <div className={styles.desc}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
