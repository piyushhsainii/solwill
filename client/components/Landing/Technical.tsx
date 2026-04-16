'use client'

import { motion } from 'framer-motion'
import styles from './Technical.module.css'

const stackItems = [
  { color: '#7F77DD', name: 'Anchor (Rust)',  desc: 'Smart contract framework · 5 instructions' },
  { color: '#0F6E56', name: 'Next.js',        desc: 'Frontend · TypeScript · App Router' },
  { color: '#993C1D', name: 'Helius',         desc: 'Enhanced RPC · webhooks · tx parsing' },
  { color: '#888780', name: 'Metaplex',       desc: 'NFT transfer · cNFT support' },
  { color: '#534AB7', name: 'SPL Token',      desc: 'Token account management · multi-asset' },
  { color: '#854F0B', name: 'Wallet Adapter', desc: 'Phantom, Backpack, Solflare support' },
]

const pdas = [
  {
    name: 'WillAccount',
    color: '#EEEDFE',
    stroke: '#534AB7',
    fields: ['owner: Pubkey', 'interval: i64', 'last_checkin: i64', 'status: WillStatus', 'heir_count: u8'],
  },
  {
    name: 'VaultAccount',
    color: '#E1F5EE',
    stroke: '#0F6E56',
    fields: ['will: Pubkey', 'sol_amount: u64', 'token_accounts: Vec<Pubkey>', 'nft_mints: Vec<Pubkey>'],
  },
  {
    name: 'HeirAccount',
    color: '#FAEEDA',
    stroke: '#854F0B',
    fields: ['will: Pubkey', 'wallet: Pubkey', 'share_bps: u16', 'claimed: bool'],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function Technical() {
  return (
    <section className={styles.section} id="technical">
      <div className={styles.inner}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.p variants={fadeUp} className="eyebrow">Technical architecture</motion.p>
          <motion.h2 variants={fadeUp} className="section-h2">
            Three PDAs.<br />
            <em>One trustless protocol.</em>
          </motion.h2>

          <div className={styles.grid}>
            {/* Left: PDA accounts + stack */}
            <motion.div variants={fadeUp}>
              <div className={styles.blockLabel}>Program accounts (PDAs)</div>

              {pdas.map((pda, i) => (
                <motion.div
                  key={pda.name}
                  className={styles.pdaCard}
                  style={{ borderColor: pda.stroke + '40' }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ borderColor: pda.stroke, transition: { duration: 0.15 } }}
                >
                  <div className={styles.pdaHeader}>
                    <div className={styles.pdaDot} style={{ background: pda.stroke }} />
                    <div className={styles.pdaName}>{pda.name}</div>
                  </div>
                  <div className={styles.pdaFields}>
                    {pda.fields.map(f => (
                      <div key={f} className={styles.pdaField}>
                        <span className={styles.pdaFieldKey}>{f.split(':')[0]}</span>
                        {f.includes(':') && (
                          <span className={styles.pdaFieldType}>{f.split(':')[1]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              <div className={styles.blockLabel} style={{ marginTop: 24 }}>Tech stack</div>
              <div className={styles.stackList}>
                {stackItems.map((s, i) => (
                  <motion.div
                    key={s.name}
                    className={styles.stackItem}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                  >
                    <div className={styles.stackDot} style={{ background: s.color }} />
                    <div className={styles.stackName}>{s.name}</div>
                    <div className={styles.stackDesc}>{s.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: instruction flow visual */}
            <motion.div variants={fadeUp}>
              <div className={styles.blockLabel}>Program instructions</div>
              <div className={styles.instrFlow}>
                {[
                  { name: 'initialize',  desc: 'Create WillAccount PDA',           color: '#EEEDFE', dot: '#534AB7', tag: 'owner only' },
                  { name: 'deposit',     desc: 'Lock assets to VaultAccount',       color: '#E1F5EE', dot: '#0F6E56', tag: 'owner only' },
                  { name: 'checkin',     desc: 'Reset last_checkin timestamp',      color: '#E1F5EE', dot: '#0F6E56', tag: 'owner only' },
                  { name: 'trigger',     desc: 'Fire after deadline — permissionless', color: '#FAEEDA', dot: '#854F0B', tag: 'anyone' },
                  { name: 'claim',       desc: 'Heir claims proportional share',    color: '#FAECE7', dot: '#993C1D', tag: 'heir only' },
                ].map((instr, i) => (
                  <motion.div
                    key={instr.name}
                    className={styles.instrItem}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  >
                    <div className={styles.instrLeft}>
                      <div className={styles.instrDot} style={{ background: instr.dot }} />
                      <div>
                        <div className={styles.instrName}>
                          <code className={styles.instrCode}>{instr.name}</code>
                        </div>
                        <div className={styles.instrDesc}>{instr.desc}</div>
                      </div>
                    </div>
                    <div className={styles.instrTag} style={{ background: instr.color, color: instr.dot }}>
                      {instr.tag}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className={styles.judgeNote}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className={styles.judgeNoteTitle}>Why this matters to judges</div>
                <div className={styles.judgeNoteBody}>
                  The <code className={styles.inlineCode}>trigger</code> instruction has no
                  privileged caller — no admin key, no multisig. The on-chain clock is the
                  only authority. Any wallet on earth can fire it once the deadline passes.{' '}
                  <strong>The program is the enforcement mechanism, not a human.</strong>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
