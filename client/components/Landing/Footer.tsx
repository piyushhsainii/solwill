'use client'

import { motion } from 'framer-motion'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <motion.footer
      className={styles.footer}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className={styles.left}>
        <div className={styles.logo}>SolWill</div>
        <div className={styles.tagline}>Your crypto, protected forever.</div>
      </div>
      <div className={styles.right}>
        <div className={styles.built}>
          Built for the{' '}
          <span className={styles.badge}>Colosseum Frontier Hackathon</span>
        </div>
        <div className={styles.meta}>
          Deployed on Solana Devnet · MIT License · 2025
        </div>
      </div>
    </motion.footer>
  )
}
