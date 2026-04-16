import { Plus, TrendingUp } from 'lucide-react'
import React from 'react'
import NoAssetsState from './noAssetState'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { VaultAccount } from '@/app/store/useWillStore'
import { fadeUp } from '@/lib/utils/helper'

const AssetsComponent = ({
    hasAssets,
    vaultAccount
}: {
    hasAssets: boolean;
    vaultAccount: VaultAccount | null
}) => {


    return (
        <motion.div variants={fadeUp} style={{ gridColumn: 'span 7' }}>
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
                    borderRadius: '24px',
                    padding: '24px',
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
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '18px',
                    }}
                >
                    <span
                        className="tracking-tight"
                        style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            color: '#8A8A82',
                            fontWeight: 300,
                            letterSpacing: '0.12em',
                        }}
                    >
                        Locked Assets Architecture
                    </span>

                    <Link href="/manage-funds">
                        <motion.button
                            whileHover={{
                                scale: 1.03,
                                background: '#242B35',
                                color: '#FFFFFF',
                                borderColor: '#242B35',
                            }}
                            whileTap={{ scale: 0.97 }}
                            className="tracking-tight"
                            style={{
                                background: '#EEEEE9',
                                color: '#555550',
                                border: '1px solid #E4E4DF',
                                borderRadius: '12px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '7px 14px',
                                fontFamily: 'inherit',
                                fontWeight: 300,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Manage
                        </motion.button>
                    </Link>
                </div>

                {hasAssets ? (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                flex: 1,
                            }}
                        >
                            {[
                                {
                                    bg: 'linear-gradient(135deg,#9945FF,#7c3aed)',
                                    symbol: '◎',
                                    name: 'Solana',
                                    sub: `${vaultAccount?.sol} SOL`,
                                    value: '$162,520.45',
                                    change: '+2.4%',
                                    up: true,
                                },
                                {
                                    bg: 'linear-gradient(135deg,#2775CA,#1d4ed8)',
                                    symbol: '$',
                                    name: 'USD Coin',
                                    sub: `${vaultAccount?.usdc} USDC`,
                                    value: '$25,000.00',
                                    change: 'Stable',
                                    up: null,
                                },
                            ].map((asset, i) => (
                                <motion.div
                                    key={asset.name}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.15 + i * 0.08,
                                        duration: 0.35,
                                    }}
                                    whileHover={{
                                        background: '#F7F7F4',
                                        borderColor: '#242B35',
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        border: '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                background: asset.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '14px',
                                                fontWeight: 300,
                                                flexShrink: 0,
                                                boxShadow:
                                                    '0 6px 16px rgba(36,43,53,0.12)',
                                            }}
                                        >
                                            {asset.symbol}
                                        </div>

                                        <div>
                                            <div
                                                className="tracking-tight"
                                                style={{
                                                    fontSize: '14px',
                                                    color: '#1A1A18',
                                                    fontWeight: 300,
                                                }}
                                            >
                                                {asset.name}
                                            </div>
                                            <div
                                                className="tracking-tight"
                                                style={{
                                                    fontSize: '11px',
                                                    color: '#8A8A82',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {asset.sub}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div
                                            className="tracking-tight"
                                            style={{
                                                fontSize: '14px',
                                                color: '#1A1A18',
                                                fontWeight: 300,
                                            }}
                                        >
                                            {asset.value}
                                        </div>

                                        <div
                                            style={{
                                                fontSize: '11px',
                                                color:
                                                    asset.up === true
                                                        ? '#16a34a'
                                                        : asset.up === false
                                                            ? '#dc2626'
                                                            : '#8A8A82',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                justifyContent: 'flex-end',
                                                marginTop: 2,
                                                fontWeight: 300,
                                            }}
                                        >
                                            {asset.up === true && (
                                                <TrendingUp size={10} />
                                            )}
                                            {asset.change}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div
                            style={{
                                borderTop: '1px solid #E4E4DF',
                                marginTop: '14px',
                                paddingTop: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div
                                    className="tracking-tight"
                                    style={{
                                        fontSize: '11px',
                                        color: '#8A8A82',
                                        marginBottom: 4,
                                        fontWeight: 300,
                                    }}
                                >
                                    Total Managed Estate Value
                                </div>

                                <div
                                    className="tracking-tight"
                                    style={{
                                        fontSize: '24px',
                                        color: '#1A1A18',
                                        fontWeight: 300,
                                    }}
                                >
                                    $
                                    {vaultAccount?.totalUsdValue.toLocaleString()}
                                </div>
                            </div>

                            <Link href="/manage-funds">
                                <motion.button
                                    whileHover={{
                                        scale: 1.08,
                                        background: '#242B35',
                                        borderColor: '#242B35',
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '999px',
                                        background: '#EEEEE9',
                                        border: '1px solid #E4E4DF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
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
        </motion.div>
    )
}

export default AssetsComponent