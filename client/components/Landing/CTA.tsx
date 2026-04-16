'use client'

import { motion } from 'framer-motion'
import styles from './CTA.module.css'

export default function CTA() {
  return (
    <motion.section
      className={styles.section}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className={`eyebrow ${styles.eyebrow}`}>Open source · MIT License</p>
      <h2 className={styles.h2}>
        The safest will<br />
        <em>is one that runs itself.</em>
      </h2>
      <p className={styles.sub}>
        SolWill is live on devnet. Read the code, audit the program, or fork it.
      </p>
      <div className={styles.actions}>
        <motion.a
          href="https://github.com"
          className="btn-primary"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.97 }}
        >
          View on GitHub
        </motion.a>
        <motion.a
          href="https://explorer.solana.com"
          className="btn-outline"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.97 }}
        >
          View on Solana Explorer
        </motion.a>
      </div>
    </motion.section>
  )
}
