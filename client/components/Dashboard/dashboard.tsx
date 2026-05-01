import React, { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
    const setTxPending = useWillStore((s) => s.setTxPending)
    const txPending = useWillStore((s) => s.txPending)
    const performCheckin = useWillStore((s) => s.performCheckin)

    const [checkinAnim, setCheckinAnim] = useState(false)

    const handleCheckin = useCallback(async () => {
        setCheckinAnim(true)
        setTxPending(true)
        await mockTx('Check-in recorded on-chain', performCheckin)
        setTxPending(false)
        setTimeout(() => setCheckinAnim(false), 600)
    }, [setTxPending, performCheckin])

    const daysLeft = activeWill ? daysUntilExpiry(activeWill.lastCheckin, activeWill.interval) : 0
    const intervalDays = activeWill ? Math.floor(activeWill.interval / 86400) : 30
    const progressPct = intervalDays > 0 ? (daysLeft / intervalDays) * 100 : 0
    const isUrgent = daysLeft < 7
    const hasAssets = !!(vaultAccount && (vaultAccount.totalUsdValue > 0 || vaultAccount.sol > 0))

    const avatarColors = useMemo(
        () => ['var(--accent)', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        []
    )

    return (
        <>
            {/* Responsive grid styles injected via a style tag */}
            <style>{`
    .dashboard-grid {
        display: grid;
        gap: 16px;
        width: 100%;
        box-sizing: border-box;
    }

    /* Small screens (including ~893px with sidebar): stack everything */
    @media (max-width: 1199px) {
        .dashboard-grid {
            grid-template-columns: 1fr;
        }
        .dashboard-grid > * {
            grid-column: span 1 !important;
            min-width: 0;
            width: 100%;
        }
    }

    /* Desktop: full 12-column grid */
    @media (min-width: 1200px) {
        .dashboard-grid {
            grid-template-columns: repeat(12, 1fr);
        }
        .col-span-5  { grid-column: span 5; }
        .col-span-7  { grid-column: span 7; }
        .col-span-3  { grid-column: span 3; }
        .col-span-9  { grid-column: span 9; }
        .col-span-12 { grid-column: span 12; }
    }
`}</style>

            <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="dashboard-grid"
            >
                {/* ── 1. Protection Status ── */}
                <motion.div variants={fadeUp} className="col-span-5" style={{ minWidth: 0 }}>
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
                            overflow: 'visible',  // was 'hidden'
                            position: 'relative',
                            boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                            transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
                        }}
                    >
                        <ProtectionStatusCard
                            nextVerificationTimestamp={formatTimestamp(activeWill.lastCheckin + activeWill.interval)}
                            lastCheckin={activeWill.lastCheckin}
                            intervalSeconds={activeWill.interval}
                        />
                    </motion.div>
                </motion.div>

                {/* ── 2. Assets Architecture ── */}
                <motion.div variants={fadeUp} className="col-span-7" style={{ minWidth: 0 }}>
                    <AssetsComponent />
                </motion.div>

                {/* ── 3. Designated Beneficiaries ── */}
                <motion.div variants={fadeUp} className="col-span-12" style={{ minWidth: 0 }}>
                    <DesignatedHeirs activeHeirs={activeHeirs} avatarColors={avatarColors} />
                </motion.div>
            </motion.div>
        </>
    )
}

export default Dashboard