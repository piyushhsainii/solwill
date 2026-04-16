'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import styles from './Navbar.module.css'

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#technical', label: 'Technical' },
  { href: '#judges', label: 'For judges' },
]

export default function Navbar() {
  return (
    <motion.nav
      className={styles.nav}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href="/" className={styles.logo}>
        <motion.div
          className={styles.logoMark}
          whileHover={{ scale: 1.08, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          <img src="/solwillicon.jpeg" style={{ height: "25px" }} alt="" />
        </motion.div>
        <span className={styles.logoText}>SolWill</span>
      </Link>

      <motion.ul
        className={styles.links}
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
      >
        {navLinks.map(({ href, label }) => (
          <motion.li
            key={href}
            variants={{
              hidden: { opacity: 0, y: -8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
            }}
          >
            <a href={href}>{label}</a>
          </motion.li>
        ))}
        <motion.li
          variants={{
            hidden: { opacity: 0, y: -8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
          }}
        >
          <motion.a
            href="https://github.com"
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ opacity: 0.82 }}
            whileTap={{ scale: 0.96 }}
          >
            View on GitHub
          </motion.a>
        </motion.li>
      </motion.ul>
    </motion.nav>
  )
}
