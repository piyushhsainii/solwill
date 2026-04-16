'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWillStore } from '../../store/useWillStore'
import { daysUntilExpiry, formatTimestamp, mockTx } from '@/lib/utils'
import ProtectionStatusCard from '@/components/ui/protectionStatusCard'
import CreateWillStep from "@/components/Dashboard/createWillStep"
import DepositFundsStep from '@/components/Dashboard/depositFundsStep'
import AddHeirsStep from '@/components/Dashboard/addHeirStep'
import AssetsComponent from '@/components/Dashboard/assetscard'
import VerificationWindow from '@/components/Dashboard/verification-window'
import DesignatedHeirs from '@/components/Dashboard/designated_heirs'
import { Heir } from '@/lib/utils/helper'
import { OnboardingProgress } from '@/components/Dashboard/onboarding-progress'
import { OnboardingNavButtons } from '@/components/Dashboard/nav-buttons'

/* ─── Animation Variants ─────────────────────────────────────────────── */
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
}


function PulsingDot({ color = '#4ade80' }: { color?: string }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
            <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: color,
                animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.6,
            }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'block' }} />
        </span>
    )
}

/* ─── Onboarding: Step Indicator ─────────────────────────────────────── */

/* ─── Main Dashboard Page ────────────────────────────────────────────── */
export default function DashboardPage() {
    const router = useRouter()

    const {
        connected,
        willAccount,
        vaultAccount,
        heirs: storeHeirs,
        setTxPending,
        txPending,
        performCheckin,
        createWill,
        addHeir,
        removeHeir,
        updateHeir
    } = useWillStore()



    const [simWill, setSimWill] = useState<any>(willAccount ?? null)
    const [simHeirs, setSimHeirs] = useState<Heir[]>(storeHeirs ?? [])
    const [loadingStep, setLoadingStep] = useState(false)
    const [checkinAnim, setCheckinAnim] = useState(false)
    const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward')

    const activeWill = simWill ?? willAccount
    const activeHeirs: Heir[] = simHeirs.length > 0 ? simHeirs : (storeHeirs ?? [])
    const totalHeirShare = activeHeirs.reduce((s: number, h: Heir) => s + h.shareBps, 0)

    // ── Determine current phase ─────────────────────────────────────────
    type Phase = 0 | 1 | 2 | 'dashboard'

    const getAutoPhase = (): Phase => {
        if (!activeWill) return 0
        if (activeHeirs.length === 0 || totalHeirShare !== 100) return 1
        if (!vaultAccount || vaultAccount.totalUsdValue <= 0) return 2
        return 'dashboard'
    }

    const [phase, setPhase] = useState<Phase>(getAutoPhase())

    const completedSteps = [
        !!activeWill,
        activeHeirs.length > 0 && totalHeirShare === 100,
        !!(vaultAccount && vaultAccount.totalUsdValue > 0),
    ]

    // ── Dashboard helpers ───────────────────────────────────────────────
    const daysLeft = activeWill ? daysUntilExpiry(activeWill.lastCheckin, activeWill.interval) : 0
    const intervalDays = activeWill ? Math.floor(activeWill.interval / 86400) : 30
    const progressPct = intervalDays > 0 ? (daysLeft / intervalDays) * 100 : 0
    const isUrgent = daysLeft < 7
    const hasAssets = !!(vaultAccount && vaultAccount.totalUsdValue > 0)
    const avatarColors = ['var(--accent)', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

    // ── Handlers ────────────────────────────────────────────────────────
    const handleCreateWill = async (days: number) => {
        setLoadingStep(true)

        await mockTx('Will contract deployed', () => {
            createWill(days)
        })

        setLoadingStep(false)
        goNext()
    }

    const handleAddHeir = (address: string, share: number) => {
        addHeir({
            walletAddress: address,
            shareBps: share,
        })
    }

    const handleUpdateHeir = (
        id: string,
        address: string,
        share: number
    ) => {
        updateHeir(id, {
            walletAddress: address,
            shareBps: share,
        })
    }

    const handleRemoveHeir = (id: string) => {
        removeHeir(id)
    }

    const handleHeirsComplete = async () => {
        setLoadingStep(true)

        await mockTx('Beneficiaries registered on-chain', () => { })

        setLoadingStep(false)
        goNext()
    }

    const handleCheckin = async () => {
        setCheckinAnim(true)
        setTxPending(true)
        await mockTx('Check-in recorded on-chain', performCheckin)
        setTxPending(false)
        setTimeout(() => setCheckinAnim(false), 600)
    }
    const goNext = () => {
        setStepDir('forward')

        setPhase((prev) => {
            if (prev === 0) return 1
            if (prev === 1) return 2
            if (prev === 2) return 'dashboard'
            return prev
        })
    }

    const goBack = () => {
        setStepDir('back')

        setPhase((prev) => {
            if (prev === 2) return 1
            if (prev === 1) return 0
            return prev
        })
    }
    console.log(`phase value`, phase)
    if (!connected) return null

    useEffect(() => {
        setPhase(getAutoPhase())
    }, [
        activeWill,
        activeHeirs.length,
        totalHeirShare,
        vaultAccount?.totalUsdValue,
    ])

    return (
        <>
            <style>{`
                @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
                @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
            `}</style>

            <div style={{
                width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '28px', boxSizing: 'border-box',
            }}>
                <div style={{ width: '100%', maxWidth: 1100 }}>

                    {/* ── Header ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
                    >
                        <div>
                            <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }} className='tracking-tight font-light'>
                                Welcome to Solwill!
                            </h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '3px 0 0', letterSpacing: '0.01em' }}>
                                {phase === 'dashboard'
                                    ? 'Monitoring your decentralised legacy protocol.'
                                    : 'Complete setup to activate your estate protection.'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <PulsingDot color={phase === 'dashboard' ? '#4ade80' : '#f59e0b'} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                {phase === 'dashboard' ? '1 Node Online' : 'Setup Required'}
                            </span>
                        </div>
                    </motion.div>

                    {/* ── Main Content ── */}
                    <AnimatePresence mode="wait">

                        {/* ═══ ONBOARDING WIZARD ═══ */}
                        {phase !== 'dashboard' && (
                            <motion.div
                                key="wizard"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
                                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                                style={{
                                    display: 'flex', justifyContent: 'center',
                                    minHeight: 'calc(100vh - 160px)', alignItems: 'center',
                                }}
                            >
                                <div style={{
                                    width: '100%', maxWidth: 760,
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 24, padding: '36px 40px',
                                    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
                                }}>
                                    <OnboardingProgress
                                        currentStep={phase}
                                        completedSteps={completedSteps}
                                    />
                                    {
                                        phase !== 'dashboard' &&
                                        <OnboardingNavButtons goBack={goBack} goNext={goNext} phase={phase} />
                                    }

                                    <AnimatePresence mode="wait">
                                        {phase === 0 && (
                                            <CreateWillStep
                                                key="step-0"
                                                onComplete={handleCreateWill}
                                                isLoading={loadingStep}
                                                dir={stepDir}
                                            />
                                        )}
                                        {phase === 1 && (
                                            <AddHeirsStep
                                                key="step-1"
                                                heirs={activeHeirs}
                                                onAdd={handleAddHeir}
                                                onUpdate={handleUpdateHeir}
                                                onRemove={handleRemoveHeir}
                                                onComplete={handleHeirsComplete}
                                                isLoading={loadingStep}
                                                dir={stepDir}
                                            />
                                        )}
                                        {phase === 2 && (
                                            <DepositFundsStep
                                                key="step-2"
                                                dir={stepDir}
                                                setPhase={setPhase}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ FULL DASHBOARD ═══ */}
                        {phase === 'dashboard' && (
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
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </>
    )
}