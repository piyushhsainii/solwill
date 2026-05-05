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
import { getAccessToken, useLogout, usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Funds', href: '/manage-funds', icon: Wallet },
    { label: 'Heirs', href: '/manage-heirs', icon: User2Icon },
    { label: 'Claim', href: '/claim-will', icon: Coins },
    { label: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { publicKey, connected, setConnected } = useWillStore()
    const { logout } = usePrivy()
    const shortAddr = publicKey
        ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
        : '0x00...0000'



    return (
        <>
            {/* ── DESKTOP SIDEBAR ── */}
            <aside
                className="hidden md:flex"
                style={{
                    width: '240px',
                    minWidth: '240px',
                    height: '100vh',
                    background: '#FFFFFF',
                    borderRight: '1px solid #E4E4DF',
                    flexDirection: 'column',
                    padding: '18px 14px',
                    position: 'sticky',
                    top: 0,
                    boxShadow: '0 2px 12px rgba(36,43,53,0.04)',
                }}
            >
                {/* Logo */}
                <Link href={'/'} >
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '8px 10px', marginBottom: '26px',
                    }}>
                        <motion.div
                            whileHover={{ scale: 1.2, rotate: -6 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}

                            style={{
                                width: '42px', height: '42px', borderRadius: '14px',
                                background: '#EEEEE9', border: '1px solid #E4E4DF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                            }}>
                            <img src="/solwillicon.jpeg" className="h-full w-full object-cover" alt="SolWill" />
                        </motion.div>
                        <div>
                            <div className="tracking-tight" style={{ fontSize: '15px', color: '#1A1A18', fontWeight: 300 }}>SolWill</div>
                            <div className="tracking-tight" style={{ fontSize: '13px', color: '#8A8A82', marginTop: 1, fontWeight: 300 }}>Secure Legacy Vault</div>
                        </div>
                    </div>
                </Link>

                {/* Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                        const active = pathname === href
                        return (
                            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                                <div
                                    className="tracking-tight"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '11px 12px', borderRadius: '14px',
                                        background: active ? '#EEEEE9' : 'transparent',
                                        border: active ? '1px solid #E4E4DF' : '1px solid transparent',
                                        color: '#1A1A18', fontSize: '16px', fontWeight: 500,
                                        cursor: 'pointer', transition: 'all 0.18s ease',
                                    }}
                                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = '#F7F7F4'; e.currentTarget.style.borderColor = '#E4E4DF' } }}
                                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
                                >
                                    <Icon size={18} color="#000000" strokeWidth={1.8} />
                                    {label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Wallet Card */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', borderRadius: '18px',
                    border: '1px solid #E4E4DF', background: '#F7F7F4', marginTop: '10px',
                }}>
                    <div className='rounded-full border-2 border-black'>
                        <img src="/solwill-user-pfp.png" alt="" className='rounded-full h-10 w-10' />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tracking-tight" style={{ fontSize: '13px', color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 300 }}>
                            {connected ? 'Connected' : 'Guest User'}
                        </div>
                        <div className="tracking-tight" style={{ fontSize: '11px', color: '#8A8A82', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1, fontWeight: 300 }}>
                            {shortAddr}
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await logout(),
                                window.location.href = '/connect'
                            setConnected(false)
                        }}
                        title="Disconnect"
                        style={{
                            background: '#FFFFFF', border: '1px solid #E4E4DF', cursor: 'pointer',
                            padding: '7px', borderRadius: '10px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#555550', transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#EEEEE9'; e.currentTarget.style.color = '#1A1A18' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#555550' }}
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </aside>

            {/* ── MOBILE TOP BAR ── */}
            <div
                className="flex md:hidden mb-56"
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    height: '56px',
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #E4E4DF',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: '#EEEEE9', border: '1px solid #E4E4DF',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img src="/solwillicon.jpeg" className="h-full w-full object-cover" alt="SolWill" />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 300, color: '#1A1A18', letterSpacing: '-0.01em' }}>SolWill</span>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '6px 10px 6px 7px',
                    borderRadius: '9999px',
                    border: '1px solid #E4E4DF',
                    background: '#F7F7F4',
                }}>
                    <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: '#242B35',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', color: '#FFFFFF', fontWeight: 400,
                    }}>
                        {connected ? publicKey?.slice(0, 2).toUpperCase() : 'SW'}
                    </div>
                    <span style={{ fontSize: '12px', color: '#1A1A18', fontWeight: 300 }}>{shortAddr}</span>
                </div>
            </div>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav
                className="flex md:hidden "
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                    height: '72px',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderTop: '1px solid #E4E4DF',
                    alignItems: 'center',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                flex: 1,
                                textDecoration: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: '8px 0',
                                color: active ? '#1A1A18' : '#AAAAA0',
                                transition: 'color 0.18s ease',
                            }}
                        >
                            <div style={{
                                width: '36px', height: '28px',
                                borderRadius: '9999px',
                                background: active ? '#EEEEE9' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.18s ease',
                            }}>
                                <Icon size={18} strokeWidth={active ? 2 : 1.6} color={active ? '#1A1A18' : '#AAAAA0'} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: active ? 500 : 300, letterSpacing: '0.01em' }}>
                                {label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}