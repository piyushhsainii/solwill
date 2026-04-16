'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import styles from './HowItWorks.module.css'

const steps = [
  {
    num: '01',
    iconBg: 'var(--purple-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {/* Wallet body */}
        <rect x="2" y="7" width="20" height="14" rx="3" stroke="#534AB7" strokeWidth="1.4" />
        {/* Divider line */}
        <path d="M2 11h20" stroke="#534AB7" strokeWidth="1.4" />
        {/* Coin slot */}
        <rect x="15" y="13.5" width="4" height="3" rx="1" fill="#534AB7" opacity="0.45" />
        {/* Strap/top */}
        <path d="M7 7V6a3 3 0 0 1 6 0v1" stroke="#534AB7" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Connect your wallet',
    desc: 'Connect any Solana wallet. SolWill reads your assets automatically. No sign-up, no email, no password.',
  },
  {
    num: '02',
    iconBg: 'var(--teal-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {/* Person silhouette */}
        <circle cx="9" cy="7" r="3" stroke="#0F6E56" strokeWidth="1.4" />
        <path d="M3 19c0-3.314 2.686-6 6-6h1.5" stroke="#0F6E56" strokeWidth="1.4" strokeLinecap="round" />
        {/* Plus badge circle */}
        <circle cx="18" cy="16" r="4" stroke="#0F6E56" strokeWidth="1.4" />
        <path d="M18 14v4M16 16h4" stroke="#0F6E56" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Name your heirs',
    desc: 'Add heir wallet addresses and set percentage splits. All stored in a PDA on-chain. Only the program can enforce it.',
  },
  {
    num: '03',
    iconBg: 'var(--amber-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {/* Clock face */}
        <circle cx="12" cy="12" r="9" stroke="#854F0B" strokeWidth="1.4" />
        {/* Hour + minute hands */}
        <path d="M12 7.5V12l3 3" stroke="#854F0B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* 12-tick */}
        <path d="M12 4v1.5" stroke="#854F0B" strokeWidth="1.4" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="1" fill="#854F0B" />
      </svg>
    ),
    title: 'Check in regularly',
    desc: 'One tap every 30–180 days resets the clock. Miss the window and the smart contract automatically triggers.',
  },
  {
    num: '04',
    iconBg: 'var(--coral-50)',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {/* Shield */}
        <path
          d="M12 3L4 6.5V12c0 4.418 3.582 8 8 8s8-3.582 8-8V6.5L12 3z"
          stroke="#993C1D"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Checkmark */}
        <path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="#993C1D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Heirs claim instantly',
    desc: 'Any heir visits the app, connects their registered wallet, and claims their exact share — SOL, tokens, and NFTs — in one transaction.',
  },
]

const flowNodes = [
  {
    iconBg: 'var(--surface)',
    label: 'Draft',
    desc: 'Will created, vault empty',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <path
          d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5z"
          stroke="#9a9994"
          strokeWidth="1.3"
          strokeDasharray="3 2"
          strokeLinejoin="round"
        />
        <path d="M14 3v5h5" stroke="#9a9994" strokeWidth="1.3" strokeDasharray="3 2" strokeLinecap="round" />
        <path d="M9 13h6M9 17h4" stroke="#9a9994" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 1.5" />
      </svg>
    ),
  },
  {
    iconBg: 'var(--teal-50)',
    label: 'Active',
    desc: 'Vault funded, clock running',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#0F6E56" strokeWidth="1.3" />
        <circle cx="12" cy="12" r="3.5" fill="#0F6E56" />
        <path d="M12 5v1.5M12 17.5V19M5 12h1.5M17.5 12H19" stroke="#0F6E56" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    iconBg: 'var(--teal-50)',
    label: 'Active · checked in',
    desc: 'Clock reset by owner tx',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#0F6E56" strokeWidth="1.3" />
        <path d="M12 8v4l2.5 2.5" stroke="#0F6E56" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 5l-2 2 2 2" stroke="#0F6E56" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    iconBg: 'var(--amber-50)',
    label: 'Triggered',
    desc: 'Deadline missed · anyone can fire',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L2 21h20L12 3z" stroke="#854F0B" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M12 9v5" stroke="#854F0B" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="17.5" r="0.9" fill="#854F0B" />
      </svg>
    ),
  },
  {
    iconBg: 'var(--teal-50)',
    label: 'Settled',
    desc: 'All shares claimed by heirs',
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#0F6E56" strokeWidth="1.3" />
        <path d="M8 12l3 3 5-5" stroke="#0F6E56" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <>
      <section id="how-it-works" className={styles.howSection}>
        {/* Dotted grid background */}
        <div className={styles.dotGrid} aria-hidden="true" />

        <div className={styles.how}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.p variants={fadeUp} className="eyebrow">How it works</motion.p>
            <motion.h2 variants={fadeUp} className="section-h2">
              Four steps.<br /><em>Zero trust required.</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="section-body">
              Every rule is encoded in an Anchor smart contract deployed on Solana.
              No admin. No multisig backdoor. No override.
            </motion.p>

            <div className={styles.steps}>
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  className={`${styles.step} ${activeStep === i ? styles.stepActive : ''}`}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  onHoverStart={() => setActiveStep(i)}
                  onHoverEnd={() => setActiveStep(null)}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <div className={styles.stepNum}>{step.num}</div>
                  <motion.div
                    className={styles.stepIcon}
                    style={{ background: step.iconBg }}
                    animate={{ scale: activeStep === i ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step.icon}
                  </motion.div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                  {i < steps.length - 1 && (
                    <div className={styles.stepArrow}>
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6h8M6 2l4 4-4 4"
                          stroke="#9a9994"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* State flow */}
      <section>
        <div className={styles.flow}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.p variants={fadeUp} className="eyebrow">On-chain state machine</motion.p>
            <motion.h2 variants={fadeUp} className="section-h2">
              Every transition enforced<br /><em>by the program.</em>
            </motion.h2>

            <div className={styles.flowRow}>
              {flowNodes.map((node, i) => (
                <>
                  <motion.div
                    key={node.label}
                    className={styles.flowNode}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ backgroundColor: 'var(--surface)' }}
                  >
                    <div className={styles.flowNodeIcon} style={{ background: node.iconBg }}>
                      {node.icon}
                    </div>
                    <div className={styles.flowNodeLabel}>{node.label}</div>
                    <div className={styles.flowNodeDesc}>{node.desc}</div>
                  </motion.div>
                  {i < flowNodes.length - 1 && (
                    <motion.div
                      key={`arrow-${i}`}
                      className={styles.flowArrow}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.4 }}
                    >
                      →
                    </motion.div>
                  )}
                </>
              ))}
            </div>

            <motion.p variants={fadeUp} className={styles.flowNote}>
              The <code className={styles.inlineCode}>trigger</code> instruction is
              permissionless — anyone can call it after the deadline, verified entirely
              by on-chain clock. No oracle, no admin, no human in the loop.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </>
  )
}