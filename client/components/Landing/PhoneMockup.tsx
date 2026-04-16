'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useState } from 'react'
import styles from './PhoneMockup.module.css'

const assets = [
  { name: 'SOL',           val: '12.5 SOL',  tag: null },
  { name: 'USDC',          val: '500 USDC',  tag: null },
  { name: 'Mad Lads #4821', val: null,        tag: 'NFT' },
]

const heirs = [
  { initials: 'AR', name: 'Arjun', pct: '60%' },
  { initials: 'PR', name: 'Priya', pct: '40%' },
]

export default function PhoneMockup() {
  const [checked, setChecked] = useState(false)
  const [days, setDays]       = useState(67)
  const controls              = useAnimationControls()

  async function handleCheckin() {
    if (checked) return
    setChecked(true)
    setDays(90)
    await controls.start({ scale: [1, 0.95, 1.04, 1], transition: { duration: 0.4 } })
  }

  // ring: 239 = full circumference of r=38. offset maps days to arc.
  const offset = 239 - (days / 90) * 239

  return (
    <motion.div
      className={styles.frame}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className={styles.notch} />

      <p className={styles.label}>Your will</p>
      <div className={styles.statusBar}>
        <motion.div
          className={styles.statusBadge}
          animate={checked ? { background: ['#E1F5EE', '#dcfce7', '#E1F5EE'] } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.statusDot} />
          Active
        </motion.div>
        <div className={styles.daysLeft}>{days} days left</div>
      </div>

      {/* Ring timer */}
      <div className={styles.ringWrap}>
        <svg viewBox="0 0 88 88" width={88} height={88}>
          <circle cx="44" cy="44" r="38" fill="none" stroke="#f0eeea" strokeWidth="5" />
          <motion.circle
            cx="44" cy="44" r="38"
            fill="none"
            stroke="#0f0f0e"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="239"
            initial={{ strokeDashoffset: 239 - (67 / 90) * 239 }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className={styles.ringCenter}>
          <motion.div
            className={styles.ringDays}
            key={days}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {days}d
          </motion.div>
          <div className={styles.ringLbl}>remaining</div>
        </div>
      </div>

      <motion.button
        className={styles.checkinBtn}
        animate={controls}
        whileTap={{ scale: 0.97 }}
        onClick={handleCheckin}
        style={{ background: checked ? '#0F6E56' : 'var(--ink)' }}
      >
        {checked ? '✓ Checked in' : 'Check in now'}
      </motion.button>
      <p className={styles.checkinHint}>One tap resets your 90-day clock</p>

      <div className={styles.divider} />

      <p className={`${styles.label} ${styles.labelSpaced}`}>Vault assets</p>
      {assets.map((a, i) => (
        <motion.div
          key={a.name}
          className={`${styles.assetRow} ${i === assets.length - 1 ? styles.assetRowLast : ''}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
        >
          <span className={styles.assetName}>{a.name}</span>
          {a.val  && <span className={styles.assetVal}>{a.val}</span>}
          {a.tag  && <span className={styles.assetTag}>{a.tag}</span>}
        </motion.div>
      ))}

      <div className={styles.divider} />

      <p className={`${styles.label} ${styles.labelSpaced}`}>Heirs</p>
      {heirs.map((h, i) => (
        <motion.div
          key={h.name}
          className={`${styles.heirRow} ${i === heirs.length - 1 ? styles.heirRowLast : ''}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.65 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
        >
          <div className={styles.heirAv}>{h.initials}</div>
          <div className={styles.heirName}>{h.name}</div>
          <div className={styles.heirPct}>{h.pct}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}
