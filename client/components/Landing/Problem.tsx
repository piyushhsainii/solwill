'use client'

import { motion } from 'framer-motion'
import styles from './Problem.module.css'

const stats = [
  { num: '$140B+', lbl: 'estimated crypto permanently lost due to inaccessible wallets after death or incapacity' },
  { num: '0',      lbl: 'existing trustless inheritance protocols on Solana before SolWill' },
  { num: '3 min',  lbl: 'to set up a fully on-chain will protecting all your SOL, tokens, and NFTs' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function Problem() {
  return (
    <section className={styles.section} id="problem">
      <div className={styles.inner}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.p variants={fadeUp} className="eyebrow">The problem</motion.p>
          <motion.h2 variants={fadeUp} className="section-h2">
            Crypto wealth disappears<br />
            <em>when wallets do.</em>
          </motion.h2>
          <motion.p variants={fadeUp} className="section-body">
            When someone dies or loses access to their wallet, there&apos;s no system to
            pass it on. No bank to call. No recovery process. The assets are simply
            gone — forever. SolWill changes that.
          </motion.p>

          <div className={styles.cards}>
            {stats.map((s, i) => (
              <motion.div
                key={s.num}
                className={styles.card}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className={styles.cardNum}>{s.num}</div>
                <div className={styles.cardLbl}>{s.lbl}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
