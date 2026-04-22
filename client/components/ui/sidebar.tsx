'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Wallet,
    LogOut,
    User2Icon,
    Settings,
    Coins,
} from 'lucide-react'
import { useWillStore } from '@/app/store/useWillStore'
import { useLogout } from '@privy-io/react-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Funds', href: '/manage-funds', icon: Wallet },
    { label: 'Heirs', href: '/manage-heirs', icon: User2Icon },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Claim', href: '/claim-will', icon: Coins },
]

/* ─── Hook: detect mobile breakpoint ────────────────────────────── */
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
        setIsMobile(mq.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [breakpoint])
    return isMobile
}

/* ═══════════════════════════════════════════════════════════════════
   Desktop Sidebar
   ═══════════════════════════════════════════════════════════════════ */
function DesktopSidebar() {
    const pathname = usePathname()
    const { publicKey, connected } = useWillStore()
    const { logout } = useLogout()

    const shortAddr = publicKey
        ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
        : '0x00...0000'

    return (
        <aside style={{
            width: 240,
            minWidth: 240,
            height: '100vh',
            background: '#FFFFFF',
            borderRight: '1px solid #E4E4DF',
            display: 'flex',
            flexDirection: 'column',
            padding: '18px 14px',
            position: 'sticky',
            top: 0,
            boxShadow: '0 2px 12px rgba(36,43,53,0.04)',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px', marginBottom: 26,
            }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 14,
                    background: '#EEEEE9', border: '1px solid #E4E4DF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <img src="/solwillicon.jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="SolWill" />
                </div>
                <div>
                    <div style={{ fontSize: 15, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                        SolWill
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8A82', marginTop: 1, fontWeight: 300 }}>
                        Secure Legacy Vault
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href
                    return (
                        <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={!active ? { background: '#F7F7F4', borderColor: '#E4E4DF' } : {}}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '11px 12px', borderRadius: 14,
                                    background: active ? '#EEEEE9' : 'transparent',
                                    border: `1px solid ${active ? '#E4E4DF' : 'transparent'}`,
                                    color: '#1A1A18', fontSize: 14, fontWeight: 300,
                                    cursor: 'pointer', letterSpacing: '-0.01em',
                                    transition: 'all 0.18s ease',
                                }}
                            >
                                <Icon size={18} color={active ? '#1A1A18' : '#8A8A82'} strokeWidth={1.8} />
                                {label}
                                {active && (
                                    <motion.div
                                        layoutId="desktop-active-dot"
                                        style={{
                                            marginLeft: 'auto',
                                            width: 5, height: 5, borderRadius: '50%',
                                            background: '#242B35',
                                        }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    )
                })}
            </nav>

            {/* Wallet card */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 12, borderRadius: 18,
                border: '1px solid #E4E4DF', background: '#F7F7F4', marginTop: 10,
            }}>
                <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: '#242B35', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, color: '#FFFFFF', fontWeight: 300,
                }}>
                    {connected ? publicKey?.slice(0, 2).toUpperCase() : 'SW'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 13, color: '#1A1A18', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 300,
                    }}>
                        {connected ? 'Connected' : 'Guest User'}
                    </div>
                    <div style={{
                        fontSize: 11, color: '#8A8A82', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1, fontWeight: 300,
                    }}>
                        {shortAddr}
                    </div>
                </div>
                <motion.button
                    whileHover={{ background: '#EEEEE9', color: '#1A1A18' }}
                    onClick={() => logout()}
                    title="Disconnect"
                    style={{
                        background: '#FFFFFF', border: '1px solid #E4E4DF',
                        cursor: 'pointer', padding: 7, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#555550', transition: 'all 0.18s ease',
                    }}
                >
                    <LogOut size={14} />
                </motion.button>
            </div>
        </aside>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   Mobile Bottom Nav
   ═══════════════════════════════════════════════════════════════════ */
function MobileBottomNav() {
    const pathname = usePathname()
    const { publicKey, connected } = useWillStore()
    const { logout } = useLogout()
    const [showProfile, setShowProfile] = useState(false)

    const shortAddr = publicKey
        ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
        : '—'

    return (
        <>
            {/* Profile popover */}
            <AnimatePresence>
                {showProfile && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProfile(false)}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 49,
                                background: 'rgba(26,26,24,0.3)',
                                backdropFilter: 'blur(2px)',
                            }}
                        />
                        {/* Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            style={{
                                position: 'fixed',
                                bottom: 90,
                                left: 16, right: 16,
                                zIndex: 50,
                                background: '#FFFFFF',
                                border: '1px solid #E4E4DF',
                                borderRadius: 24,
                                padding: 20,
                                boxShadow: '0 16px 48px rgba(36,43,53,0.16)',
                            }}
                        >
                            {/* Avatar + address */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                                <div style={{
                                    width: 46, height: 46, borderRadius: '50%',
                                    background: '#242B35', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, color: '#fff', fontWeight: 300, flexShrink: 0,
                                }}>
                                    {connected ? publicKey?.slice(0, 2).toUpperCase() : 'SW'}
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                                        {connected ? 'Connected' : 'Guest User'}
                                    </div>
                                    <div style={{
                                        fontSize: 12, color: '#8A8A82',
                                        fontFamily: 'monospace', marginTop: 2,
                                    }}>
                                        {shortAddr}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: 1, background: '#F0F0EB', marginBottom: 16 }} />

                            {/* Logout */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { logout(); setShowProfile(false) }}
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    borderRadius: 14, border: '1px solid #fecaca',
                                    background: '#fef2f2', color: '#dc2626',
                                    fontSize: 14, fontWeight: 300, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8,
                                    fontFamily: 'inherit', letterSpacing: '-0.01em',
                                }}
                            >
                                <LogOut size={15} />
                                Disconnect wallet
                            </motion.button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom bar */}
            <nav style={{
                position: 'fixed',
                bottom: 16,
                left: 16, right: 16,
                zIndex: 48,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid #E4E4DF',
                borderRadius: 26,
                boxShadow: '0 8px 32px rgba(36,43,53,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 6px',
                gap: 2,
            }}>
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{ flex: 1, textDecoration: 'none' }}
                        >
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    padding: '8px 4px',
                                    borderRadius: 18,
                                    background: active ? '#EEEEE9' : 'transparent',
                                    border: `1px solid ${active ? '#E4E4DF' : 'transparent'}`,
                                    position: 'relative',
                                    transition: 'all 0.18s ease',
                                }}
                            >
                                <Icon
                                    size={20}
                                    color={active ? '#1A1A18' : '#8A8A82'}
                                    strokeWidth={active ? 2 : 1.6}
                                />
                                <span style={{
                                    fontSize: 10,
                                    color: active ? '#1A1A18' : '#8A8A82',
                                    fontWeight: active ? 500 : 300,
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1,
                                }}>
                                    {label}
                                </span>

                                {/* Active dot */}
                                {active && (
                                    <motion.div
                                        layoutId="mobile-active-indicator"
                                        style={{
                                            position: 'absolute',
                                            top: 5, right: 8,
                                            width: 4, height: 4,
                                            borderRadius: '50%',
                                            background: '#242B35',
                                        }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    )
                })}

                {/* Profile button */}
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShowProfile(v => !v)}
                    style={{
                        flexShrink: 0,
                        width: 44,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '8px 4px',
                        borderRadius: 18,
                        background: showProfile ? '#EEEEE9' : 'transparent',
                        border: `1px solid ${showProfile ? '#E4E4DF' : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                    }}
                >
                    <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#242B35', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: '#fff', fontWeight: 400,
                    }}>
                        {connected ? publicKey?.slice(0, 2).toUpperCase() : 'SW'}
                    </div>
                    <span style={{
                        fontSize: 10, color: showProfile ? '#1A1A18' : '#8A8A82',
                        fontWeight: showProfile ? 500 : 300, letterSpacing: '-0.01em', lineHeight: 1,
                    }}>
                        You
                    </span>
                </motion.button>
            </nav>

            {/* Bottom safe area spacer so page content isn't hidden behind nav */}
            <div style={{ height: 88 }} />
        </>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   Export — renders correct variant based on screen size
   ═══════════════════════════════════════════════════════════════════ */
export default function Sidebar() {
    const isMobile = useIsMobile()

    // Prevent hydration mismatch — render nothing on first pass,
    // then show correct variant once window is measured
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    return isMobile ? <MobileBottomNav /> : <DesktopSidebar />
}