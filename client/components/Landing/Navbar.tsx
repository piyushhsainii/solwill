'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#technical', label: 'Technical' },
  { href: '#judges', label: 'For judges' },
]

export default function Navbar() {
  return (
    <motion.div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 24px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#111111',
          borderRadius: '9999px',
          padding: '8px 8px 8px 20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"

          style={{

            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            marginRight: '8px',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.5, rotate: -9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              width: 35,
              height: 35,
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img src="/solwillicon.jpeg" className='invert' style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          </motion.div>
          <span className='tracking-tight' style={{ color: '#ffffff', fontWeight: 200, fontSize: '15px', letterSpacing: '-0.01em' }}>
            SolWill
          </span>
        </Link>

        {/* Nav links */}
        <motion.ul
          style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
        >
          {navLinks.map(({ href, label }) => (
            <motion.li
              key={href}
              className='tracking-tighter'
              variants={{
                hidden: { opacity: 0, y: -8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
            >
              <motion.a
                href={href}
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  display: 'block',
                  transition: 'color 0.2s',
                }}
                whileHover={{ color: '#ffffff' }}
              >
                {label}
              </motion.a>
            </motion.li>
          ))}

          {/* CTA Button */}
          <motion.li
            variants={{
              hidden: { opacity: 0, y: -8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
            }}
            style={{ marginLeft: '4px' }}
          >
            <motion.a
              href="https://github.com/piyushhsainii/solwill"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#111111',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: '9999px',
              }}
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.96 }}
            >
              {/* GitHub icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              View on GitHub
            </motion.a>
          </motion.li>
        </motion.ul>
      </nav>
    </motion.div>
  )
}