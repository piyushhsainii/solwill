'use client'

import { useState } from 'react'
import { useWillStore } from '@/app/store/useWillStore'
import { useUpdateInterval } from '@/lib/hooks/useUpdateInterval'
import { useDissolveWill } from '@/lib/hooks/useDissolveWill'
import { AlertTriangle, Clock, Trash2, ShieldOff, Info } from 'lucide-react'

const INTERVAL_PRESETS = [
    { label: '30 days', days: 30 },
    { label: '60 days', days: 60 },
    { label: '90 days', days: 90 },
    { label: '180 days', days: 180 },
    { label: '1 year', days: 365 },
]

/* ─── Triggered banner ───────────────────────────────────────────── */
function TriggeredBanner({ status }: { status: string }) {
    const isGrace = status === 'Grace Period'
    return (
        <div style={{
            background: isGrace ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${isGrace ? '#fde68a' : '#fecaca'}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 24,
        }}>
            <AlertTriangle size={18} color={isGrace ? '#d97706' : '#ef4444'} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
                <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: isGrace ? '#92400e' : '#991b1b',
                    margin: 0,
                }}>
                    {isGrace ? 'Will is in grace period' : 'Will has been triggered'}
                </p>
                <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: isGrace ? '#b45309' : '#b91c1c',
                    margin: '4px 0 0',
                    lineHeight: 1.5,
                }}>
                    {isGrace
                        ? 'Your will is in the grace period. Check in now to reset the clock — settings cannot be modified during this time.'
                        : 'Your will has been triggered and the inheritance process has started. Settings can no longer be modified or dissolved.'
                    }
                </p>
            </div>
        </div>
    )
}

/* ─── Section wrapper ────────────────────────────────────────────── */
function Section({ title, description, children, disabled }: {
    title: string
    description: string
    children: React.ReactNode
    disabled?: boolean
}) {
    return (
        <div style={{
            background: '#ffffff',
            border: '1px solid #e4e4df',
            borderRadius: 16,
            padding: 24,
            opacity: disabled ? 0.45 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
        }}>
            <div style={{ marginBottom: 20 }}>
                <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#8a8a82',
                    margin: '0 0 4px',
                }}>
                    {title}
                </p>
                <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: '#8a8a82',
                    margin: 0,
                    lineHeight: 1.5,
                }}>
                    {description}
                </p>
            </div>
            <div style={{ borderTop: '1px solid #f0efea', paddingTop: 20 }}>
                {children}
            </div>
        </div>
    )
}

function DestroyConfirmModal({ onConfirm, onCancel, loading }: {
    onConfirm: () => void
    onCancel: () => void
    loading: boolean
}) {
    const [typed, setTyped] = useState('')
    const confirmed = typed === 'DESTROY'

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(36,43,53,0.4)',
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 32,
                width: '100%',
                maxWidth: 420,
                margin: '0 16px',
                boxShadow: '0 24px 64px rgba(36,43,53,0.18)',
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                }}>
                    <Trash2 size={20} color="#ef4444" />
                </div>

                <h3 style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#242b35',
                    margin: '0 0 8px',
                }}>
                    Dissolve will permanently?
                </h3>
                <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: '#8a8a82',
                    margin: '0 0 24px',
                    lineHeight: 1.6,
                }}>
                    This closes your will and vault accounts on-chain. Rent SOL is returned to your wallet, but all heirs and configuration are{' '}
                    <strong style={{ color: '#242b35' }}>permanently lost</strong>.
                </p>

                <div style={{ marginBottom: 20 }}>
                    <label style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#8a8a82',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: 8,
                    }}>
                        Type DESTROY to confirm
                    </label>
                    <input
                        value={typed}
                        onChange={e => setTyped(e.target.value)}
                        placeholder="DESTROY"
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 14,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            border: `1.5px solid ${confirmed ? '#ef4444' : '#e4e4df'}`,
                            borderRadius: 10,
                            outline: 'none',
                            background: '#fafaf8',
                            color: '#242b35',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s ease',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 14,
                            fontWeight: 600,
                            background: '#f0efea',
                            color: '#242b35',
                            border: '1px solid #e4e4df',
                            borderRadius: 10,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!confirmed || loading}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 14,
                            fontWeight: 600,
                            background: confirmed ? '#ef4444' : '#f0efea',
                            color: confirmed ? '#ffffff' : '#8a8a82',
                            border: 'none',
                            borderRadius: 10,
                            cursor: confirmed && !loading ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s ease, color 0.2s ease',
                        }}
                    >
                        {loading ? 'Dissolving…' : 'Dissolve'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Main settings component ────────────────────────────────────── */
export default function WillSettings() {
    const willAccount = useWillStore(s => s.willAccount)

    const { updateInterval, loading: updateLoading } = useUpdateInterval()
    const { dissolveWill, loading: dissolveLoading } = useDissolveWill()

    const [selectedDays, setSelectedDays] = useState<number | null>(null)
    const [customDays, setCustomDays] = useState('')
    const [showDestroyModal, setShowDestroyModal] = useState(false)

    const isTriggered = willAccount?.status === 'Triggered'
    const isGrace = willAccount?.status === 'Grace Period'
    const isLocked = isTriggered || isGrace
    const currentIntervalDays = willAccount ? Math.round(willAccount.interval / 86400) : null

    /* ── Effective days from preset or custom ────────────────────── */
    const effectiveDays = (() => {
        if (customDays !== '') {
            const n = parseInt(customDays)
            return isNaN(n) ? null : n
        }
        return selectedDays
    })()

    const daysError = (() => {
        if (effectiveDays === null) return null
        if (effectiveDays < 7) return 'Minimum interval is 7 days.'
        if (effectiveDays > 1825) return 'Maximum interval is 5 years (1825 days).'
        if (effectiveDays === currentIntervalDays) return 'This is already your current interval.'
        return null
    })()

    const canUpdate = !!effectiveDays && !daysError && !updateLoading

    /* ── Handlers ────────────────────────────────────────────────── */
    const handleUpdateInterval = async () => {
        if (!effectiveDays || daysError) return
        const success = await updateInterval(effectiveDays)
        if (success) {
            setSelectedDays(null)
            setCustomDays('')
        }
    }

    const handleDissolve = async () => {
        const success = await dissolveWill()
        if (success) setShowDestroyModal(false)
    }

    /* ── No will state ───────────────────────────────────────────── */
    if (!willAccount) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 320,
                gap: 12,
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#f0efea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Info size={20} color="#8a8a82" />
                </div>
                <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    color: '#8a8a82',
                    margin: 0,
                }}>
                    No will found. Create one first.
                </p>
            </div>
        )
    }

    return (
        <>
            {showDestroyModal && (
                <DestroyConfirmModal
                    onConfirm={handleDissolve}
                    onCancel={() => setShowDestroyModal(false)}
                    loading={dissolveLoading}
                />
            )}

            <div style={{
                maxWidth: 600,
                margin: '0 auto',
                padding: '40px 24px',
                fontFamily: '"DM Sans", sans-serif',
            }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <p style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#8a8a82',
                        margin: '0 0 8px',
                    }}>
                        Will Settings
                    </p>
                    <h1 style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#242b35',
                        margin: '0 0 10px',
                        letterSpacing: '-0.02em',
                    }}>
                        Manage your will
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#8a8a82' }}>
                            Interval:{' '}
                            <strong style={{ color: '#242b35' }}>{currentIntervalDays}d</strong>
                        </span>
                        <span style={{ color: '#e4e4df' }}>·</span>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            padding: '3px 10px',
                            borderRadius: 999,
                            background: isTriggered ? '#fef2f2' : isGrace ? '#fffbeb' : '#f0fdf4',
                            color: isTriggered ? '#ef4444' : isGrace ? '#d97706' : '#16a34a',
                            border: `1px solid ${isTriggered ? '#fecaca' : isGrace ? '#fde68a' : '#bbf7d0'}`,
                        }}>
                            {willAccount.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Locked banner */}
                {isLocked && <TriggeredBanner status={willAccount.status} />}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── Update interval ── */}
                    <Section
                        title="Check-in Interval"
                        description="How long you can go without checking in before your will activates."
                        disabled={isLocked}
                    >
                        {/* Preset pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {INTERVAL_PRESETS.map(({ label, days }) => {
                                const isActive = selectedDays === days && customDays === ''
                                const isCurrent = days === currentIntervalDays
                                return (
                                    <button
                                        key={days}
                                        onClick={() => {
                                            setSelectedDays(days)
                                            setCustomDays('')
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            fontFamily: '"DM Sans", sans-serif',
                                            fontSize: 13,
                                            fontWeight: isActive ? 600 : 500,
                                            borderRadius: 999,
                                            border: `1.5px solid ${isActive ? '#242b35' : '#e4e4df'}`,
                                            background: isActive ? '#242b35' : '#fafaf8',
                                            color: isActive ? '#ffffff' : '#8a8a82',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        {label}
                                        {isCurrent && (
                                            <span style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: '0.06em',
                                                color: isActive ? 'rgba(255,255,255,0.55)' : '#b0b0a8',
                                            }}>
                                                NOW
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Custom input */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#8a8a82',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: 8,
                            }}>
                                Custom
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    min={7}
                                    max={1825}
                                    value={customDays}
                                    onChange={e => {
                                        setCustomDays(e.target.value)
                                        setSelectedDays(null)
                                    }}
                                    placeholder={`e.g. ${currentIntervalDays ?? 90}`}
                                    style={{
                                        width: '100%',
                                        padding: '12px 56px 12px 14px',
                                        fontFamily: '"DM Sans", sans-serif',
                                        fontSize: 14,
                                        border: `1.5px solid ${daysError && customDays !== '' ? '#fca5a5' : '#e4e4df'}`,
                                        borderRadius: 10,
                                        outline: 'none',
                                        background: '#fafaf8',
                                        color: '#242b35',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.15s ease',
                                    }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    right: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: 12,
                                    color: '#8a8a82',
                                    fontWeight: 500,
                                    pointerEvents: 'none',
                                }}>
                                    days
                                </span>
                            </div>

                            {daysError && effectiveDays !== null && (
                                <p style={{
                                    fontSize: 12,
                                    color: '#ef4444',
                                    margin: '6px 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontFamily: '"DM Sans", sans-serif',
                                }}>
                                    <AlertTriangle size={12} />
                                    {daysError}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleUpdateInterval}
                            disabled={!canUpdate}
                            style={{
                                width: '100%',
                                padding: '13px 0',
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 14,
                                fontWeight: 600,
                                background: canUpdate ? '#242b35' : '#f0efea',
                                color: canUpdate ? '#ffffff' : '#8a8a82',
                                border: 'none',
                                borderRadius: 12,
                                cursor: canUpdate ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Clock size={15} />
                            {updateLoading
                                ? 'Updating…'
                                : canUpdate
                                    ? `Set to ${effectiveDays} days`
                                    : 'Update Interval'
                            }
                        </button>
                    </Section>

                    {/* ── Danger zone ── */}
                    <Section
                        title="Danger Zone"
                        description="Permanently dissolve and remove your will from the blockchain."
                        disabled={isLocked}
                    >
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 10,
                            padding: '14px 16px',
                            marginBottom: 16,
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                        }}>
                            <ShieldOff size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{
                                fontSize: 13,
                                color: '#b91c1c',
                                margin: 0,
                                lineHeight: 1.5,
                                fontFamily: '"DM Sans", sans-serif',
                            }}>
                                Dissolving is irreversible. Vault SOL is returned but all heirs and configuration are permanently lost.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowDestroyModal(true)}
                            style={{
                                width: '100%',
                                padding: '13px 0',
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 14,
                                fontWeight: 600,
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1.5px solid #fecaca',
                                borderRadius: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                            }}
                        >
                            <Trash2 size={15} />
                            Dissolve Will
                        </button>
                    </Section>
                </div>
            </div>
        </>
    )
}