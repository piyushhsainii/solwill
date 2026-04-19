import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AssetsComponent from './assetscard'
import ProtectionStatusCard from '../ui/protectionStatusCard'
import VerificationWindow from './verification-window'
import DesignatedHeirs from './designated_heirs'
import { daysUntilExpiry, formatTimestamp, mockTx } from '@/lib/utils'
import { Heir, useWillStore, VaultAccount, WillAccount } from '@/app/store/useWillStore'
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
}


const Dashboard = ({
    activeWill,
    vaultAccount,
    activeHeirs
}: {
    activeWill: WillAccount,
    vaultAccount: VaultAccount,
    activeHeirs: Heir[]
}) => {

    const {
        connected,
        willAccount,
        heirs: storeHeirs,
        setTxPending,
        txPending,
        performCheckin,
        removeHeir,
        updateHeir
    } = useWillStore()

    const [checkinAnim, setCheckinAnim] = useState(false)

    const handleCheckin = async () => {
        setCheckinAnim(true)
        setTxPending(true)
        await mockTx('Check-in recorded on-chain', performCheckin)
        setTxPending(false)
        setTimeout(() => setCheckinAnim(false), 600)
    }

    // ── Dashboard helpers ───────────────────────────────────────────────
    const daysLeft = activeWill ? daysUntilExpiry(activeWill.lastCheckin, activeWill.interval) : 0
    const intervalDays = activeWill ? Math.floor(activeWill.interval / 86400) : 30
    const progressPct = intervalDays > 0 ? (daysLeft / intervalDays) * 100 : 0
    const isUrgent = daysLeft < 7
    const hasAssets = !!(vaultAccount && vaultAccount.totalUsdValue > 0)
    const avatarColors = ['var(--accent)', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

    return (
        <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '16px',
                }}
            >
                {/* ── 1. Protection Status — 5 cols ── */}
                <motion.div variants={fadeUp} style={{ gridColumn: 'span 5' }}>
                    <motion.div
                        whileHover={{ y: -2, boxShadow: '0 16px 48px rgba(36,43,53,0.10)', borderColor: '#242B35' }}
                        transition={{ duration: 0.2 }}
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #E4E4DF',
                            borderRadius: '20px',
                            padding: '24px',
                            height: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                            transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
                        }}
                    >
                        <ProtectionStatusCard
                            txPending={txPending}
                            checkinAnim={checkinAnim}
                            onCheckin={handleCheckin}
                            nextVerificationTimestamp={formatTimestamp(activeWill.lastCheckin + activeWill.interval)}
                        />
                    </motion.div>
                </motion.div>

                {/* ── 2. Assets Architecture — 7 cols ── */}
                <AssetsComponent hasAssets={hasAssets} vaultAccount={vaultAccount} />

                {/* ── 3. Verification Window — 3 cols ── */}
                <VerificationWindow
                    progressPct={progressPct}
                    daysLeft={daysLeft}
                    intervalDays={intervalDays}
                    isUrgent={isUrgent}
                />

                {/* ── 4. Designated Beneficiaries — 9 cols ── */}
                <DesignatedHeirs activeHeirs={activeHeirs} avatarColors={avatarColors} />
            </motion.div>
        </motion.div>
    )
}

export default Dashboard