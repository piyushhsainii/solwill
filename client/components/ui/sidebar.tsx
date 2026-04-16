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

const NAV_ITEMS = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Manage Funds',
        href: '/manage-funds',
        icon: Wallet,
    },
    {
        label: 'Manage Heirs',
        href: '/manage-heirs',
        icon: User2Icon,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
    },
    {
        label: 'Claim Will',
        href: '/claim-will',
        icon: Coins,
    },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { publicKey, connected } = useWillStore()
    const { logout } = useLogout()

    const shortAddr = publicKey
        ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
        : '0x00...0000'

    return (
        <aside
            style={{
                width: '240px',
                minWidth: '240px',
                height: '100vh',
                background: '#FFFFFF',
                borderRight: '1px solid #E4E4DF',
                display: 'flex',
                flexDirection: 'column',
                padding: '18px 14px',
                position: 'sticky',
                top: 0,
                boxShadow:
                    '0 2px 12px rgba(36,43,53,0.04)',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    marginBottom: '26px',
                }}
            >
                <div
                    style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '14px',
                        background: '#EEEEE9',
                        border: '1px solid #E4E4DF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src="/solwillicon.jpeg"
                        className="h-full w-full object-cover"
                        alt="SolWill"
                    />
                </div>

                <div>
                    <div
                        className="tracking-tight"
                        style={{
                            fontSize: '15px',
                            color: '#1A1A18',
                            fontWeight: 300,
                        }}
                    >
                        SolWill
                    </div>

                    <div
                        className="tracking-tight"
                        style={{
                            fontSize: '11px',
                            color: '#8A8A82',
                            marginTop: 1,
                            fontWeight: 300,
                        }}
                    >
                        Secure Legacy Vault
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flex: 1,
                }}
            >
                {NAV_ITEMS.map(
                    ({ label, href, icon: Icon }) => {
                        const active =
                            pathname === href

                        return (
                            <Link
                                key={href}
                                href={href}
                                style={{
                                    textDecoration:
                                        'none',
                                }}
                            >
                                <div
                                    className="tracking-tight"
                                    style={{
                                        display: 'flex',
                                        alignItems:
                                            'center',
                                        gap: '12px',
                                        padding:
                                            '11px 12px',
                                        borderRadius:
                                            '14px',
                                        background:
                                            active
                                                ? '#EEEEE9'
                                                : 'transparent',
                                        border: active
                                            ? '1px solid #E4E4DF'
                                            : '1px solid transparent',
                                        color: '#1A1A18',
                                        fontSize:
                                            '14px',
                                        fontWeight:
                                            300,
                                        cursor: 'pointer',
                                        transition:
                                            'all 0.18s ease',
                                    }}
                                    onMouseEnter={(
                                        e
                                    ) => {
                                        if (
                                            !active
                                        ) {
                                            e.currentTarget.style.background =
                                                '#F7F7F4'
                                            e.currentTarget.style.borderColor =
                                                '#E4E4DF'
                                        }
                                    }}
                                    onMouseLeave={(
                                        e
                                    ) => {
                                        if (
                                            !active
                                        ) {
                                            e.currentTarget.style.background =
                                                'transparent'
                                            e.currentTarget.style.borderColor =
                                                'transparent'
                                        }
                                    }}
                                >
                                    <Icon
                                        size={18}
                                        color="#000000"
                                        strokeWidth={
                                            1.8
                                        }
                                    />

                                    {label}
                                </div>
                            </Link>
                        )
                    }
                )}
            </nav>

            {/* Wallet Card */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '18px',
                    border: '1px solid #E4E4DF',
                    background: '#F7F7F4',
                    marginTop: '10px',
                }}
            >
                <div
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: '#242B35',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#FFFFFF',
                        fontWeight: 300,
                    }}
                >
                    {connected
                        ? publicKey
                            ?.slice(0, 2)
                            .toUpperCase()
                        : 'SW'}
                </div>

                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <div
                        className="tracking-tight"
                        style={{
                            fontSize: '13px',
                            color: '#1A1A18',
                            overflow: 'hidden',
                            textOverflow:
                                'ellipsis',
                            whiteSpace:
                                'nowrap',
                            fontWeight: 300,
                        }}
                    >
                        {connected
                            ? 'Connected'
                            : 'Guest User'}
                    </div>

                    <div
                        className="tracking-tight"
                        style={{
                            fontSize: '11px',
                            color: '#8A8A82',
                            overflow: 'hidden',
                            textOverflow:
                                'ellipsis',
                            whiteSpace:
                                'nowrap',
                            marginTop: 1,
                            fontWeight: 300,
                        }}
                    >
                        {shortAddr}
                    </div>
                </div>

                <button
                    onClick={() => { logout() }}
                    title="Disconnect"
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid #E4E4DF',
                        cursor: 'pointer',
                        padding: '7px',
                        borderRadius: '10px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                            'center',
                        color: '#555550',
                        transition:
                            'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            '#EEEEE9'
                        e.currentTarget.style.color =
                            '#1A1A18'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            '#FFFFFF'
                        e.currentTarget.style.color =
                            '#555550'
                    }}
                >
                    <LogOut size={14} />
                </button>
            </div>
        </aside>
    )
}