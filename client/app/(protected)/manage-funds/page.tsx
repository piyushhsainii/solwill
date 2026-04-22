'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, Check, Wallet, PlusCircle, X } from 'lucide-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useDepositSOL, useDepositSPL } from '@/lib/hooks/useDeposit'
import { useWillStore } from '@/app/store/useWillStore'
import { SOL_LOGO, SPL_TOKENS, Token, TOKEN_LOGO_MAP, TOKENS } from '@/lib/utils/helper'
import AccordionCard from '@/components/ui/accordion-card'

const RPC_URL = 'https://api.devnet.solana.com'

/* ─── Validate & resolve a custom mint address ───────────────────── */
type MintInfo = { decimals: number; valid: true } | { valid: false; error: string }


async function resolveMint(address: string): Promise<MintInfo> {
    let pk: PublicKey
    try { pk = new PublicKey(address) } catch {
        return { valid: false, error: 'Invalid public key.' }
    }

    const conn = new Connection(RPC_URL, 'confirmed')

    // Try standard SPL Token first, then Token-2022
    for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
        try {
            const info = await getMint(conn, pk, 'confirmed', programId)
            return { valid: true, decimals: info.decimals }
        } catch { }
    }

    return { valid: false, error: 'Mint not found on-chain.' }
}


/* ─── Debounce hook ──────────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

/* ─── Live SOL price ─────────────────────────────────────────────── */
function useSolPrice() {
    const [price, setPrice] = useState<number | null>(null)
    const controllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        let cancelled = false
        const fetchPrice = async () => {
            controllerRef.current?.abort()
            controllerRef.current = new AbortController()
            try {
                const res = await fetch(
                    'https://lite-api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112',
                    { signal: controllerRef.current.signal }
                )
                const json = await res.json()
                const p = json?.data?.['So11111111111111111111111111111111111111112']?.price
                if (!cancelled && p != null) { setPrice(Number(p)); return }
            } catch (err: any) { if (err?.name === 'AbortError') return }
            try {
                const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
                const json = await res.json()
                if (!cancelled && json?.solana?.usd) setPrice(Number(json.solana.usd))
            } catch { }
        }
        fetchPrice()
        const interval = setInterval(fetchPrice, 30_000)
        return () => { cancelled = true; clearInterval(interval); controllerRef.current?.abort() }
    }, [])

    return price
}

/* ─── Percent quick-select pills ─────────────────────────────────── */
const PCT_PRESETS = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.50 },
    { label: '100%', value: 1.00 },
]

function PercentPills({
    balance,
    onSelect,
    activeAmt,
}: {
    balance: number
    onSelect: (amt: string) => void
    activeAmt: string
}) {
    const activePct = balance > 0 && activeAmt
        ? Number(activeAmt) / balance
        : null

    return (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {PCT_PRESETS.map(({ label, value }) => {
                const isActive = activePct !== null && Math.abs(activePct - value) < 0.001
                return (
                    <button
                        key={label}
                        onClick={() => onSelect(
                            value === 1
                                ? String(balance)
                                : (balance * value).toFixed(6).replace(/\.?0+$/, '')
                        )}
                        style={{
                            flex: 1,
                            padding: '7px 0',
                            borderRadius: 10,
                            border: `1px solid ${isActive ? '#242B35' : '#E4E4DF'}`,
                            background: isActive ? '#242B35' : '#F7F7F4',
                            color: isActive ? '#fff' : '#555550',
                            fontSize: 12,
                            fontWeight: 300,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            letterSpacing: '-0.01em',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

/* ─── Vault balance badge ────────────────────────────────────────── */
function BalanceBadge({ amount, symbol, usdValue }: { amount: number; symbol: string; usdValue?: number }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: 10,
            background: '#F7F7F4',
            border: '1px solid #E4E4DF',
            marginBottom: 10,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wallet size={12} color="#8A8A82" />
                <span style={{ fontSize: 12, color: '#8A8A82', fontWeight: 300 }}>Vault balance</span>
            </div>
            <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 13, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                    {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {symbol}
                </span>
                {usdValue != null && usdValue > 0 && (
                    <span style={{ fontSize: 11, color: '#8A8A82', marginLeft: 6 }}>
                        ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                )}
            </div>
        </div>
    )
}

/* ─── Section label ──────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p style={{
            margin: '0 0 10px',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8A8A82',
        }}>
            {children}
        </p>
    )
}

/* ─── Amount input ───────────────────────────────────────────────── */
function AmountInput({
    value,
    onChange,
    placeholder,
    suffix,
    usdValue,
    tokenLogo,
    max,
}: {
    value: string
    onChange: (v: string) => void
    placeholder: string
    suffix?: string
    usdValue?: string | null
    tokenLogo?: string
    max?: number
}) {
    const [focused, setFocused] = useState(false)
    const overMax = max != null && Number(value) > max && Number(value) > 0

    return (
        <div>
            <motion.div
                animate={{
                    borderColor: overMax ? '#dc2626' : focused ? '#242B35' : '#E4E4DF',
                    boxShadow: overMax
                        ? '0 0 0 3px rgba(220,38,38,0.07)'
                        : focused
                            ? '0 0 0 3px rgba(36,43,53,0.07)'
                            : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.18 }}
                style={{
                    borderRadius: 14,
                    border: '1px solid #E4E4DF',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    padding: '0 14px',
                }}
            >
                {tokenLogo && (
                    <img src={tokenLogo} alt="" style={{
                        width: 20, height: 20, borderRadius: '50%',
                        marginRight: 10, flexShrink: 0, objectFit: 'cover',
                    }} />
                )}
                <input
                    type="number"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        flex: 1,
                        padding: '13px 0',
                        border: 'none',
                        background: 'transparent',
                        color: overMax ? '#dc2626' : '#1A1A18',
                        fontSize: 14,
                        outline: 'none',
                        letterSpacing: '-0.02em',
                        fontWeight: 300,
                        fontFamily: 'inherit',
                        minWidth: 0,
                    }}
                />
                {suffix && (
                    <span style={{
                        fontSize: 12, color: '#8A8A82',
                        letterSpacing: '-0.01em', flexShrink: 0, marginLeft: 8,
                    }}>
                        {suffix}
                    </span>
                )}
            </motion.div>

            <AnimatePresence>
                {overMax && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        style={{ marginTop: 5, paddingLeft: 4, fontSize: 12, color: '#dc2626' }}
                    >
                        Exceeds vault balance of {max} {suffix}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {usdValue && !overMax && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            marginTop: 6, paddingLeft: 4,
                            fontSize: 12, color: '#8A8A82', letterSpacing: '-0.01em',
                        }}
                    >
                        ≈ {usdValue}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── Token selector ─────────────────────────────────────────────── */
function TokenSelector({
    tokens,
    selected,
    onSelect,
}: {
    tokens: Token[]
    selected: Token
    onSelect: (t: Token) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <motion.button
                whileHover={{ borderColor: '#242B35' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%', padding: '11px 14px', borderRadius: 14,
                    border: '1px solid #E4E4DF', background: '#fff',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s',
                }}
            >
                <img src={selected.logo} alt={selected.symbol} style={{
                    width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
                }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                        {selected.symbol}
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8A82', letterSpacing: '-0.01em' }}>{selected.name}</div>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={15} color="#8A8A82" />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 6px)',
                            left: 0, right: 0, background: '#fff',
                            border: '1px solid #E4E4DF', borderRadius: 16,
                            boxShadow: '0 8px 32px rgba(36,43,53,0.1)',
                            zIndex: 20, overflow: 'hidden',
                        }}
                    >
                        {tokens.map((token, i) => (
                            <motion.button
                                key={token.symbol}
                                whileHover={{ background: '#F7F7F4' }}
                                onClick={() => { onSelect(token); setOpen(false) }}
                                style={{
                                    width: '100%', padding: '11px 14px', border: 'none',
                                    borderBottom: i < tokens.length - 1 ? '1px solid #F0F0EB' : 'none',
                                    background: 'transparent', display: 'flex', alignItems: 'center',
                                    gap: 10, cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <img src={token.logo} alt={token.symbol} style={{
                                    width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
                                }} />
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontSize: 13, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                                        {token.symbol}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8A8A82' }}>{token.name}</div>
                                </div>
                                {selected.symbol === token.symbol && (
                                    <Check size={14} color="#242B35" strokeWidth={2.5} />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── Vault token selector (only tokens present in vault) ────────── */
function VaultTokenSelector({
    tokens,
    selected,
    onSelect,
}: {
    tokens: Array<Token & { vaultBalance: number }>
    selected: Token & { vaultBalance: number }
    onSelect: (t: Token & { vaultBalance: number }) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <motion.button
                whileHover={{ borderColor: '#242B35' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%', padding: '11px 14px', borderRadius: 14,
                    border: '1px solid #E4E4DF', background: '#fff',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s',
                }}
            >
                <img src={selected.logo} alt={selected.symbol} style={{
                    width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
                }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                        {selected.symbol}
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8A82' }}>
                        {selected.vaultBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} in vault
                    </div>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={15} color="#8A8A82" />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 6px)',
                            left: 0, right: 0, background: '#fff',
                            border: '1px solid #E4E4DF', borderRadius: 16,
                            boxShadow: '0 8px 32px rgba(36,43,53,0.1)',
                            zIndex: 20, overflow: 'hidden',
                        }}
                    >
                        {tokens.map((token, i) => (
                            <motion.button
                                key={token.symbol}
                                whileHover={{ background: '#F7F7F4' }}
                                onClick={() => { onSelect(token); setOpen(false) }}
                                style={{
                                    width: '100%', padding: '11px 14px', border: 'none',
                                    borderBottom: i < tokens.length - 1 ? '1px solid #F0F0EB' : 'none',
                                    background: 'transparent', display: 'flex', alignItems: 'center',
                                    gap: 10, cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <img src={token.logo} alt={token.symbol} style={{
                                    width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
                                }} />
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontSize: 13, color: '#1A1A18', fontWeight: 300, letterSpacing: '-0.02em' }}>
                                        {token.symbol}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8A8A82' }}>
                                        {token.vaultBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} available
                                    </div>
                                </div>
                                {selected.symbol === token.symbol && (
                                    <Check size={14} color="#242B35" strokeWidth={2.5} />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── Primary button ─────────────────────────────────────────────── */
function PrimaryButton({
    children, onClick, disabled, loading,
}: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    loading?: boolean
}) {
    return (
        <motion.button
            whileHover={!disabled ? { y: -1, boxShadow: '0 10px 28px rgba(36,43,53,0.18)' } : {}}
            whileTap={!disabled ? { scale: 0.985 } : {}}
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                background: disabled || loading ? '#E4E4DF' : '#242B35',
                color: disabled || loading ? '#8A8A82' : '#fff',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 300, letterSpacing: '-0.02em',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'background 0.2s, color 0.2s',
            }}
        >
            {children}
        </motion.button>
    )
}

/* ─── Divider ────────────────────────────────────────────────────── */
function Divider() {
    return <div style={{ height: 1, background: '#F0F0EB', margin: '20px 0' }} />
}


async function getTokenProgramForMint(
    connection: Connection,
    mint: PublicKey
): Promise<PublicKey> {
    const accountInfo = await connection.getAccountInfo(mint)
    if (!accountInfo) throw new Error('Mint not found')

    if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        return TOKEN_2022_PROGRAM_ID
    }
    return TOKEN_PROGRAM_ID
}

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */
export default function ManageFundsPage() {
    const solPrice = useSolPrice()
    const { depositSOL, loading: depositSolLoading } = useDepositSOL()
    const { depositSPL, loading: depositSplLoading } = useDepositSPL()

    // ── Read vault balances from store ────────────────────────────
    const vaultAccount = useWillStore(s => s.vaultAccount)
    const vaultSol = vaultAccount?.sol ?? 0
    const vaultAssets = vaultAccount?.assets ?? []

    // Build vault SPL tokens — only those with balance > 0, excluding SOL
    const vaultSplTokens: Array<Token & { vaultBalance: number }> = vaultAssets
        .filter(a => a.symbol !== 'SOL' && a.amount > 0)
        .map(a => {
            const known = TOKENS.find(t => t.symbol === a.symbol)
            return {
                symbol: a.symbol,
                name: known?.name ?? a.symbol,
                mint: a.mint ?? known?.mint ?? '',
                decimals: known?.decimals ?? 6,
                logo: TOKEN_LOGO_MAP[a.symbol] ?? known?.logo ?? SOL_LOGO,
                vaultBalance: a.amount,
            }
        })

    // ── Accordion state ───────────────────────────────────────────
    const [depositOpen, setDepositOpen] = useState(true)
    const [withdrawOpen, setWithdrawOpen] = useState(false)

    // ── Deposit state ─────────────────────────────────────────────
    const [depositTab, setDepositTab] = useState<'sol' | 'spl'>('sol')
    const [depositSolAmt, setDepositSolAmt] = useState('')
    const [depositSplToken, setDepositSplToken] = useState<Token>(SPL_TOKENS[0])
    const [depositSplAmt, setDepositSplAmt] = useState('')

    // ── Custom mint state ─────────────────────────────────────────
    const [useCustomMint, setUseCustomMint] = useState(false)
    const [customMintAddr, setCustomMintAddr] = useState('')
    const [customMintInfo, setCustomMintInfo] = useState<MintInfo | null>(null)
    const [customMintLoading, setCustomMintLoading] = useState(false)
    const debouncedCustomMint = useDebounce(customMintAddr, 600)

    // Resolve custom mint on-chain whenever the debounced address changes
    useEffect(() => {
        if (!useCustomMint || !debouncedCustomMint.trim()) {
            setCustomMintInfo(null)
            return
        }
        let cancelled = false
        setCustomMintLoading(true)
        resolveMint(debouncedCustomMint.trim()).then(info => {
            if (!cancelled) { setCustomMintInfo(info); setCustomMintLoading(false) }
        })
        return () => { cancelled = true }
    }, [debouncedCustomMint, useCustomMint])

    // Reset custom mint state when toggling off
    const handleToggleCustomMint = () => {
        setUseCustomMint(v => {
            if (v) { setCustomMintAddr(''); setCustomMintInfo(null) }
            return !v
        })
        setDepositSplAmt('')
    }

    // The effective token to deposit — custom if valid, else selected preset
    const effectiveSplToken: Token | null = useCustomMint
        ? customMintInfo?.valid
            ? {
                symbol: 'CUSTOM',
                name: 'Custom Token',
                mint: customMintAddr.trim(),
                decimals: customMintInfo.decimals,
                logo: '',
            }
            : null
        : depositSplToken

    // ── Withdraw state ────────────────────────────────────────────
    const [withdrawSolAmt, setWithdrawSolAmt] = useState('')
    const [withdrawSplToken, setWithdrawSplToken] = useState<Token & { vaultBalance: number } | null>(
        vaultSplTokens[0] ?? null
    )
    const [withdrawSplAmt, setWithdrawSplAmt] = useState('')

    // Keep withdrawSplToken in sync if vault data loads after mount
    useEffect(() => {
        if (!withdrawSplToken && vaultSplTokens.length > 0) {
            setWithdrawSplToken(vaultSplTokens[0])
        }
    }, [vaultSplTokens.length])

    // When user switches SPL withdraw token, clear the amount
    const handleWithdrawSplTokenChange = (t: Token & { vaultBalance: number }) => {
        setWithdrawSplToken(t)
        setWithdrawSplAmt('')
    }

    // ── Debounced USD calc ────────────────────────────────────────
    const debouncedDepositSol = useDebounce(depositSolAmt, 300)
    const debouncedWithdrawSol = useDebounce(withdrawSolAmt, 300)

    const formatUsd = useCallback((solAmt: string): string | null => {
        if (!solPrice || !solAmt || isNaN(Number(solAmt)) || Number(solAmt) <= 0) return null
        const usd = Number(solAmt) * solPrice
        return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }, [solPrice])

    const depositUsd = formatUsd(debouncedDepositSol)
    const withdrawUsd = formatUsd(debouncedWithdrawSol)

    // ── SOL withdraw validation ───────────────────────────────────
    const withdrawSolInvalid = Number(withdrawSolAmt) > vaultSol && Number(withdrawSolAmt) > 0
    const withdrawSplInvalid = withdrawSplToken
        ? Number(withdrawSplAmt) > withdrawSplToken.vaultBalance && Number(withdrawSplAmt) > 0
        : false

    const stagger = {
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
    }
    const fadeUp = {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.23, 1, 0.32, 1] } },
    }

    return (
        <>
            <style>{`
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <div style={{
                maxWidth: 640, margin: '0 auto', padding: '28px 20px',
                background: '#EEEEE9', minHeight: '100vh', boxSizing: 'border-box',
            }}>
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >

                    {/* ═══ DEPOSIT ═══ */}
                    <motion.div variants={fadeUp}>
                        <AccordionCard
                            open={depositOpen}
                            onToggle={() => setDepositOpen(v => !v)}
                            icon={<ArrowDownToLine size={18} color="#242B35" strokeWidth={1.8} />}
                            iconBg="rgba(36,43,53,0.06)"
                            iconColor="#242B35"
                            title="Deposit funds"
                            subtitle="Add assets to your estate vault"
                        >
                            {/* Tab switcher */}
                            <div style={{
                                display: 'flex', gap: 4, padding: 4,
                                borderRadius: 13, background: '#F4F4F0',
                                border: '1px solid #E4E4DF', marginBottom: 18,
                            }}>
                                {(['sol', 'spl'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setDepositTab(tab)}
                                        style={{
                                            flex: 1, padding: '9px 12px', border: 'none', borderRadius: 9,
                                            background: depositTab === tab ? '#fff' : 'transparent',
                                            color: depositTab === tab ? '#1A1A18' : '#8A8A82',
                                            fontSize: 13, fontWeight: 300, cursor: 'pointer',
                                            letterSpacing: '-0.02em', fontFamily: 'inherit',
                                            boxShadow: depositTab === tab ? '0 1px 4px rgba(36,43,53,0.08)' : 'none',
                                            transition: 'all 0.18s ease',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        }}
                                    >
                                        {tab === 'sol' ? (
                                            <>
                                                <img src={SOL_LOGO} alt="SOL" style={{
                                                    width: 16, height: 16, borderRadius: '50%', objectFit: 'cover',
                                                }} />
                                                SOL
                                            </>
                                        ) : 'SPL Token'}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {depositTab === 'sol' ? (
                                    <motion.div
                                        key="deposit-sol"
                                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                                    >
                                        <div>
                                            <SectionLabel>Amount</SectionLabel>
                                            <AmountInput
                                                value={depositSolAmt}
                                                onChange={setDepositSolAmt}
                                                placeholder="0.00"
                                                suffix="SOL"
                                                tokenLogo={SOL_LOGO}
                                                usdValue={depositUsd}
                                            />
                                        </div>
                                        <PrimaryButton
                                            disabled={!depositSolAmt || Number(depositSolAmt) <= 0 || depositSolLoading}
                                            loading={depositSolLoading}
                                            onClick={() => depositSOL(Number(depositSolAmt))}
                                        >
                                            <ArrowDownToLine size={15} strokeWidth={2} />
                                            {depositSolLoading ? 'Depositing…' : 'Deposit SOL'}
                                        </PrimaryButton>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="deposit-spl"
                                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                                    >
                                        {/* Token selector — hidden when custom mint is active */}
                                        <AnimatePresence initial={false}>
                                            {!useCustomMint && (
                                                <motion.div
                                                    key="preset-selector"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <SectionLabel>Token</SectionLabel>
                                                    <TokenSelector
                                                        tokens={SPL_TOKENS}
                                                        selected={depositSplToken}
                                                        onSelect={t => { setDepositSplToken(t); setDepositSplAmt('') }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Toggle custom mint */}
                                        <button
                                            onClick={handleToggleCustomMint}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 7,
                                                padding: '9px 13px', borderRadius: 12,
                                                border: `1px dashed ${useCustomMint ? '#242B35' : '#C8C8C2'}`,
                                                background: useCustomMint ? '#F7F7F4' : 'transparent',
                                                color: useCustomMint ? '#1A1A18' : '#8A8A82',
                                                fontSize: 12, fontWeight: 300, cursor: 'pointer',
                                                fontFamily: 'inherit', letterSpacing: '-0.01em',
                                                transition: 'all 0.15s ease', width: '100%',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {useCustomMint
                                                ? <><X size={13} /> Use preset token</>
                                                : <><PlusCircle size={13} /> Use custom mint address</>
                                            }
                                        </button>

                                        {/* Custom mint input */}
                                        <AnimatePresence initial={false}>
                                            {useCustomMint && (
                                                <motion.div
                                                    key="custom-mint"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ paddingTop: 2 }}>
                                                        <SectionLabel>Mint Address</SectionLabel>
                                                        <motion.div
                                                            animate={{
                                                                borderColor: customMintInfo
                                                                    ? customMintInfo.valid ? '#16a34a' : '#dc2626'
                                                                    : '#E4E4DF',
                                                                boxShadow: customMintInfo
                                                                    ? customMintInfo.valid
                                                                        ? '0 0 0 3px rgba(22,163,74,0.08)'
                                                                        : '0 0 0 3px rgba(220,38,38,0.07)'
                                                                    : '0 0 0 0px transparent',
                                                            }}
                                                            transition={{ duration: 0.18 }}
                                                            style={{
                                                                borderRadius: 14, border: '1px solid #E4E4DF',
                                                                background: '#fff', display: 'flex',
                                                                alignItems: 'center', padding: '0 14px',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <input
                                                                value={customMintAddr}
                                                                onChange={e => {
                                                                    setCustomMintAddr(e.target.value)
                                                                    setCustomMintInfo(null)
                                                                    setDepositSplAmt('')
                                                                }}
                                                                placeholder="e.g. EPjFWdd5Auf…"
                                                                spellCheck={false}
                                                                style={{
                                                                    flex: 1, padding: '13px 0', border: 'none',
                                                                    background: 'transparent', color: '#1A1A18',
                                                                    fontSize: 13, outline: 'none',
                                                                    fontFamily: 'monospace',
                                                                    letterSpacing: '-0.01em', fontWeight: 400,
                                                                    minWidth: 0,
                                                                }}
                                                            />
                                                            {/* Status indicator */}
                                                            <div style={{ flexShrink: 0, marginLeft: 8, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {customMintLoading && (
                                                                    <motion.div
                                                                        animate={{ rotate: 360 }}
                                                                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                                                        style={{
                                                                            width: 14, height: 14, borderRadius: '50%',
                                                                            border: '2px solid #E4E4DF',
                                                                            borderTopColor: '#8A8A82',
                                                                        }}
                                                                    />
                                                                )}
                                                                {!customMintLoading && customMintInfo?.valid && (
                                                                    <Check size={14} color="#16a34a" strokeWidth={2.5} />
                                                                )}
                                                                {!customMintLoading && customMintInfo && !customMintInfo.valid && (
                                                                    <X size={14} color="#dc2626" />
                                                                )}
                                                            </div>
                                                        </motion.div>

                                                        {/* Status message */}
                                                        <AnimatePresence>
                                                            {customMintInfo && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -4, height: 0 }}
                                                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                                    exit={{ opacity: 0, y: -4, height: 0 }}
                                                                    style={{
                                                                        marginTop: 6, paddingLeft: 4, fontSize: 12,
                                                                        color: customMintInfo.valid ? '#16a34a' : '#dc2626',
                                                                    }}
                                                                >
                                                                    {customMintInfo.valid
                                                                        ? `✓ Valid mint · ${customMintInfo.decimals} decimals`
                                                                        : `✗ ${customMintInfo.error}`
                                                                    }
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Amount — only shown once token is resolved */}
                                        <AnimatePresence initial={false}>
                                            {effectiveSplToken && (
                                                <motion.div
                                                    key="spl-amount"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <SectionLabel>Amount</SectionLabel>
                                                    <AmountInput
                                                        value={depositSplAmt}
                                                        onChange={setDepositSplAmt}
                                                        placeholder="0.00"
                                                        suffix={effectiveSplToken.symbol}
                                                        tokenLogo={effectiveSplToken.logo || undefined}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <PrimaryButton
                                            disabled={
                                                !effectiveSplToken ||
                                                !depositSplAmt ||
                                                Number(depositSplAmt) <= 0 ||
                                                depositSplLoading ||
                                                (useCustomMint && (!customMintInfo || !customMintInfo.valid))
                                            }
                                            loading={depositSplLoading}
                                            onClick={() => {
                                                if (!effectiveSplToken) return
                                                const rawAmt = Math.floor(
                                                    Number(depositSplAmt) * Math.pow(10, effectiveSplToken.decimals)
                                                )
                                                depositSPL(new PublicKey(effectiveSplToken.mint), rawAmt)
                                            }}
                                        >
                                            <ArrowDownToLine size={15} strokeWidth={2} />
                                            {depositSplLoading
                                                ? 'Depositing…'
                                                : effectiveSplToken
                                                    ? `Deposit ${effectiveSplToken.symbol === 'CUSTOM' ? 'Token' : effectiveSplToken.symbol}`
                                                    : 'Deposit SPL Token'
                                            }
                                        </PrimaryButton>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </AccordionCard>
                    </motion.div>

                    {/* ═══ WITHDRAW ═══ */}
                    <motion.div variants={fadeUp}>
                        <AccordionCard
                            open={withdrawOpen}
                            onToggle={() => setWithdrawOpen(v => !v)}
                            icon={<ArrowUpFromLine size={18} color="#dc2626" strokeWidth={1.8} />}
                            iconBg="rgba(239,68,68,0.07)"
                            iconColor="#dc2626"
                            title="Withdraw funds"
                            subtitle={vaultAccount
                                ? `$${(vaultAccount.totalUsdValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in vault`
                                : 'Remove assets from your vault'
                            }
                        >
                            {/* ── Withdraw SOL ── */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <img src={SOL_LOGO} alt="SOL" style={{
                                        width: 16, height: 16, borderRadius: '50%', objectFit: 'cover',
                                    }} />
                                    <SectionLabel>Withdraw SOL</SectionLabel>
                                </div>

                                {/* Balance badge */}
                                <BalanceBadge
                                    amount={vaultSol}
                                    symbol="SOL"
                                    usdValue={solPrice ? vaultSol * solPrice : undefined}
                                />

                                {vaultSol > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <PercentPills
                                            balance={vaultSol}
                                            onSelect={setWithdrawSolAmt}
                                            activeAmt={withdrawSolAmt}
                                        />
                                        <AmountInput
                                            value={withdrawSolAmt}
                                            onChange={setWithdrawSolAmt}
                                            placeholder="0.00"
                                            suffix="SOL"
                                            tokenLogo={SOL_LOGO}
                                            usdValue={withdrawUsd}
                                            max={vaultSol}
                                        />
                                        <PrimaryButton
                                            disabled={
                                                !withdrawSolAmt ||
                                                Number(withdrawSolAmt) <= 0 ||
                                                withdrawSolInvalid
                                            }
                                        >
                                            <ArrowUpFromLine size={15} strokeWidth={2} />
                                            Withdraw SOL
                                        </PrimaryButton>
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '14px 16px', borderRadius: 12,
                                        background: '#F7F7F4', border: '1px solid #E4E4DF',
                                        fontSize: 13, color: '#8A8A82', fontWeight: 300,
                                        textAlign: 'center',
                                    }}>
                                        No SOL in vault
                                    </div>
                                )}
                            </div>

                            {/* Only show SPL section if there are SPL tokens in vault */}
                            {vaultSplTokens.length > 0 && (
                                <>
                                    <Divider />

                                    {/* ── Withdraw SPL ── */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            {withdrawSplToken && (
                                                <img src={withdrawSplToken.logo} alt={withdrawSplToken.symbol} style={{
                                                    width: 16, height: 16, borderRadius: '50%', objectFit: 'cover',
                                                }} />
                                            )}
                                            <SectionLabel>Withdraw SPL Token</SectionLabel>
                                        </div>

                                        {withdrawSplToken && (
                                            <BalanceBadge
                                                amount={withdrawSplToken.vaultBalance}
                                                symbol={withdrawSplToken.symbol}
                                                usdValue={
                                                    vaultAssets.find(a => a.symbol === withdrawSplToken.symbol)?.usdValue
                                                }
                                            />
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {/* Token selector — only vault tokens */}
                                            {withdrawSplToken && (
                                                <VaultTokenSelector
                                                    tokens={vaultSplTokens}
                                                    selected={withdrawSplToken}
                                                    onSelect={handleWithdrawSplTokenChange}
                                                />
                                            )}

                                            {withdrawSplToken && (
                                                <>
                                                    <PercentPills
                                                        balance={withdrawSplToken.vaultBalance}
                                                        onSelect={setWithdrawSplAmt}
                                                        activeAmt={withdrawSplAmt}
                                                    />
                                                    <AmountInput
                                                        value={withdrawSplAmt}
                                                        onChange={setWithdrawSplAmt}
                                                        placeholder="0.00"
                                                        suffix={withdrawSplToken.symbol}
                                                        tokenLogo={withdrawSplToken.logo}
                                                        max={withdrawSplToken.vaultBalance}
                                                    />
                                                    <PrimaryButton
                                                        disabled={
                                                            !withdrawSplAmt ||
                                                            Number(withdrawSplAmt) <= 0 ||
                                                            withdrawSplInvalid
                                                        }
                                                    >
                                                        <ArrowUpFromLine size={15} strokeWidth={2} />
                                                        Withdraw {withdrawSplToken.symbol}
                                                    </PrimaryButton>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Empty vault fallback */}
                            {vaultSol === 0 && vaultSplTokens.length === 0 && (
                                <div style={{
                                    marginTop: 4,
                                    padding: '20px 16px',
                                    borderRadius: 14,
                                    border: '1px dashed #E4E4DF',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 13, color: '#8A8A82', fontWeight: 300 }}>
                                        Your vault is empty. Deposit funds first.
                                    </div>
                                </div>
                            )}
                        </AccordionCard>
                    </motion.div>

                    {/* ═══ Live SOL price chip ═══ */}
                    <motion.div variants={fadeUp}>
                        <AnimatePresence>
                            {solPrice != null ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        padding: '8px 16px', borderRadius: 999, background: '#fff',
                                        border: '1px solid #E4E4DF', width: 'fit-content', margin: '4px auto 0',
                                        boxShadow: '0 1px 6px rgba(36,43,53,0.06)',
                                    }}
                                >
                                    <img src={SOL_LOGO} alt="SOL" style={{
                                        width: 14, height: 14, borderRadius: '50%', objectFit: 'cover',
                                    }} />
                                    <span style={{ fontSize: 12, color: '#555550', letterSpacing: '-0.01em' }}>
                                        1 SOL = ${solPrice.toLocaleString('en-US', {
                                            minimumFractionDigits: 2, maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#43d17a', flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, color: '#8A8A82' }}>live</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        padding: '8px 16px', borderRadius: 999, background: '#fff',
                                        border: '1px solid #E4E4DF', width: 'fit-content', margin: '4px auto 0',
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: '#8A8A82' }}>Fetching SOL price…</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </motion.div>
            </div>
        </>
    )
}