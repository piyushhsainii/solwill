import { Plus, TrendingUp } from 'lucide-react'
import React from 'react'
import NoAssetsState from './noAssetState'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { VaultAccount } from '@/app/store/useWillStore'
import { fadeUp } from '@/lib/utils/helper'

const AssetsComponent = ({
    hasAssets,
    vaultAccount,
    mobile = false,
}: {
    hasAssets: boolean
    vaultAccount: VaultAccount | null
    mobile?: boolean
}) => {
    const inner = (
        <motion.div
            whileHover={{
                y: -2,
                boxShadow: '0 18px 42px rgba(36,43,53,0.08)',
                borderColor: '#242B35',
            }}
            transition={{ duration: 0.22 }}
            style={{
                background: '#FFFFFF',
                border: '1px solid #E4E4DF',
                borderRadius: 24,
                padding: 24,
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
                transition: 'all 0.25s ease',
                fontWeight: 300,
                letterSpacing: '-0.02em',
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 18,
            }}>
                <span style={{
                    fontSize: 10, textTransform: 'uppercase', color: '#8A8A82',
                    fontWeight: 300, letterSpacing: '0.12em',
                }}>
                    Locked Assets Architecture
                </span>
                <Link href="/manage-funds">
                    <motion.button
                        whileHover={{ scale: 1.03, background: '#242B35', color: '#FFFFFF', borderColor: '#242B35' }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background: '#EEEEE9', color: '#555550',
                            border: '1px solid #E4E4DF', borderRadius: 12,
                            fontSize: 11, cursor: 'pointer', padding: '7px 14px',
                            fontFamily: 'inherit', fontWeight: 300, transition: 'all 0.2s ease',
                        }}
                    >
                        Manage
                    </motion.button>
                </Link>
            </div>

            {hasAssets ? (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        {[
                            {
                                bg: 'linear-gradient(135deg,#9945FF,#7c3aed)',
                                symbol: '/sol-logo.png',
                                name: 'Solana',
                                sub: `${vaultAccount?.sol} SOL`,
                                value: `${vaultAccount?.sol}`,
                                change: '+2.4%',
                                up: true,
                            },
                            {
                                bg: 'linear-gradient(135deg,#2775CA,#1d4ed8)',
                                symbol: 'usdc-logo.png',
                                name: 'USD Coin',
                                sub: `${vaultAccount?.usdc} USDC`,
                                value: `${vaultAccount?.usdc}`,
                                change: 'Stable',
                                up: null,
                            },
                        ].map((asset, i) => (
                            <motion.div
                                key={asset.name}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                                whileHover={{ background: '#F7F7F4', borderColor: '#242B35' }}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 12, borderRadius: 16,
                                    border: '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: asset.bg, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: '0 6px 16px rgba(36,43,53,0.12)',
                                    }}>
                                        <img src={asset.symbol} style={{ width: 24, height: 24 }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, color: '#1A1A18', fontWeight: 300 }}>
                                            {asset.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#8A8A82', marginTop: 2 }}>
                                            {asset.sub}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 14, color: '#1A1A18', fontWeight: 300 }}>
                                        {asset.value}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: asset.up === true ? '#16a34a' : asset.up === false ? '#dc2626' : '#8A8A82',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        justifyContent: 'flex-end', marginTop: 2, fontWeight: 300,
                                    }}>
                                        {asset.up === true && <TrendingUp size={10} />}
                                        {asset.change}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        borderTop: '1px solid #E4E4DF', marginTop: 14, paddingTop: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div>
                            <div style={{ fontSize: 11, color: '#8A8A82', marginBottom: 4, fontWeight: 300 }}>
                                Total Managed Estate Value
                            </div>
                            <div style={{ fontSize: 24, color: '#1A1A18', fontWeight: 300 }}>
                                ${vaultAccount?.totalUsdValue.toLocaleString()}
                            </div>
                        </div>
                        <Link href="/manage-funds">
                            <motion.button
                                whileHover={{ scale: 1.08, background: '#242B35', borderColor: '#242B35' }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: 38, height: 38, borderRadius: 999,
                                    background: '#EEEEE9', border: '1px solid #E4E4DF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}
                            >
                                <Plus size={15} color="#555550" />
                            </motion.button>
                        </Link>
                    </div>
                </>
            ) : (
                <NoAssetsState />
            )}
        </motion.div>
    )

    // On mobile/tablet the parent controls layout — no gridColumn wrapper needed
    if (mobile) {
        return <motion.div variants={fadeUp}>{inner}</motion.div>
    }

    return (
        <motion.div variants={fadeUp} style={{ gridColumn: 'span 7' }}>
            {inner}
        </motion.div>
    )
}

export default AssetsComponent