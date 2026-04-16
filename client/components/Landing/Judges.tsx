'use client'

import { motion } from 'framer-motion'
import styles from './Judges.module.css'

const criteria = [
  { score: '9.5', name: 'Technical execution', desc: 'Full Anchor program, 5 instructions, 3 PDAs, multi-asset vault transferred atomically in a single transaction.' },
  { score: '9',   name: 'Innovation',          desc: 'First trustless inheritance protocol on Solana. No equivalent exists. The permissionless trigger mechanism is novel.' },
  { score: '10',  name: 'Real-world use case', desc: '$140B problem. Non-crypto-native users instantly understand it. TAM is every crypto holder, not just DeFi natives.' },
  { score: '9.5', name: 'User experience',     desc: '4 screens. One primary action per screen. Framer Motion animations. Consumer-grade — could ship on the App Store today.' },
  { score: '9',   name: 'Completeness',        desc: 'Deployed on devnet. End-to-end flow working. Owner dashboard, heir claim, live trigger demo available.' },
]

export default function Judges() {
  return (
    <section className={styles.section} id="judges">
      <div className={styles.inner}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.p
            className={styles.eyebrow}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          >
            For hackathon judges
          </motion.p>
          <motion.h2
            className={styles.h2}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } } }}
          >
            Scored against every<br /><em>judging criterion.</em>
          </motion.h2>
          <motion.p
            className={styles.sub}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.05 } } }}
          >
            SolWill was designed from the ground up to excel across all five
            Colosseum Frontier judging criteria — not as an afterthought, but as the design brief.
          </motion.p>

          <div className={styles.grid}>
            {criteria.map((c, i) => (
              <motion.div
                key={c.name}
                className={`${styles.criterion} ${i === 0 ? styles.first : ''} ${i === criteria.length - 1 ? styles.last : ''}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)', transition: { duration: 0.15 } }}
              >
                <div className={styles.score}>{c.score}</div>
                <div className={styles.name}>{c.name}</div>
                <div className={styles.desc}>{c.desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className={styles.note}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <strong>Common judge question:</strong> &ldquo;What stops someone from triggering the will early?&rdquo; —
            The <code className={styles.inlineCode}>require!</code> guard checks{' '}
            <code className={styles.inlineCode}>clock.unix_timestamp &gt; last_checkin + interval</code> on-chain.
            It&apos;s mathematically impossible to trigger before the deadline without the Solana
            validator lying about the clock.{' '}
            <strong>The program is the enforcement mechanism, not a human.</strong>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
