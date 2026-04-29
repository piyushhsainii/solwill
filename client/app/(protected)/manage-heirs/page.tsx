'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Users, Check, X } from 'lucide-react'
import { useWillStore } from '@/app/store/useWillStore'
import type { Heir } from '@/app/store/useWillStore'
import { useUpdateHeir } from '@/lib/hooks/useUpdateHeir'
import { useRemoveHeir } from '@/lib/hooks/useRemoveHeir'
import { useAddHeir } from '@/lib/hooks/useAddHeir'
import DesignatedHeirs from '@/components/Dashboard/designated_heirs'

// ── Confirm dialog ────────────────────────────────────────────────────────────
type DialogState =
    | { type: 'update'; heir: Heir; newAddress: string; newBps: number }
    | { type: 'remove'; heir: Heir }
    | null

function ConfirmDialog({
    dialog,
    onConfirm,
    onCancel,
    loading,
}: {
    dialog: DialogState
    onConfirm: () => void
    onCancel: () => void
    loading: boolean
}) {
    if (!dialog) return null

    const isUpdate = dialog.type === 'update'

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(26,26,24,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
            }}
            onClick={onCancel}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    border: '1px solid #E4E4DF',
                    borderRadius: 24,
                    padding: '28px 28px 24px',
                    maxWidth: 400,
                    width: '100%',
                    boxShadow: '0 8px 40px rgba(36,43,53,0.14)',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: isUpdate ? '#F7F7F4' : 'rgba(220,38,38,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                }}>
                    {isUpdate
                        ? <Check size={20} color="#242B35" />
                        : <Trash2 size={20} color="#dc2626" />}
                </div>

                <div style={{ fontSize: 18, color: '#1A1A18', fontWeight: 300, marginBottom: 8, letterSpacing: '-0.02em' }}>
                    {isUpdate ? 'Confirm update' : 'Remove heir?'}
                </div>

                <div style={{ fontSize: 13, color: '#555550', fontWeight: 300, lineHeight: 1.65, marginBottom: 24 }}>
                    {isUpdate ? (
                        <>
                            You&apos;re about to update heir{' '}
                            <span style={{ fontFamily: 'monospace', color: '#1A1A18' }}>
                                {truncateAddr(dialog.heir.walletAddress)}
                            </span>{' '}
                            → new address{' '}
                            <span style={{ fontFamily: 'monospace', color: '#1A1A18' }}>
                                {truncateAddr(dialog.newAddress)}
                            </span>{' '}
                            with <strong>{dialog.newBps} bps</strong>. This will require a wallet signature.
                        </>
                    ) : (
                        <>
                            You&apos;re about to permanently remove heir{' '}
                            <span style={{ fontFamily: 'monospace', color: '#1A1A18' }}>
                                {truncateAddr(dialog.heir.walletAddress)}
                            </span>{' '}
                            ({dialog.heir.shareBps} bps). This action requires a wallet signature and cannot be undone.
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 14,
                            border: '1px solid #E4E4DF', background: '#F7F7F4',
                            color: '#555550', fontSize: 14, fontWeight: 300,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 14,
                            border: 'none',
                            background: isUpdate ? '#242B35' : '#dc2626',
                            color: '#fff', fontSize: 14, fontWeight: 300,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        {loading
                            ? <span style={{ fontSize: 13 }}>Processing…</span>
                            : isUpdate ? 'Update heir' : 'Remove heir'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── Util (module-level so ConfirmDialog can use it too) ──────────────────────
function truncateAddr(v: string | undefined) {
    if (!v) return '—'
    return v.length > 10 ? `${v.slice(0, 4)}...${v.slice(-4)}` : v
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ManageHeirsPage() {
    const heirs = useWillStore((s) => s.heirs)

    const { executeUpdateHeir, loading: updateLoading } = useUpdateHeir()
    const { executeRemoveHeir, loading: removeLoading, removingId } = useRemoveHeir()
    const { addHeir, loading: addLoading } = useAddHeir()

    // ── Add draft ──────────────────────────────────────────────────────────────
    const [draftAddress, setDraftAddress] = useState('')
    const [draftBps, setDraftBps] = useState('')
    const [addError, setAddError] = useState('')

    // ── Per-heir local edit drafts ─────────────────────────────────────────────
    // Keyed by heir.id. Populated on first edit, cleared after tx success.
    const [edits, setEdits] = useState<Record<string, { walletAddress: string; shareBps: string }>>({})

    // ── Confirm dialog state ───────────────────────────────────────────────────
    const [dialog, setDialog] = useState<DialogState>(null)
    const [dialogLoading, setDialogLoading] = useState(false)

    const totalBps = useMemo(
        () => heirs.reduce((sum, h) => sum + (Number(h.shareBps) || 0), 0),
        [heirs],
    )

    // Get the working draft for a given heir (falls back to store values)
    const getDraft = (heir: Heir) =>
        edits[heir.id] ?? {
            walletAddress: heir.walletAddress ?? '',
            shareBps: String(heir.shareBps ?? 0),
        }

    const setDraftField = (
        id: string,
        field: 'walletAddress' | 'shareBps',
        value: string,
        heir: Heir,
    ) => {
        const current = getDraft(heir)
        setEdits((prev) => ({ ...prev, [id]: { ...current, [field]: value } }))
    }

    // ── truncate ──────────────────────────────────────────────────────────────
    const truncate = (v: string | undefined) => {
        if (!v) return '—'
        return v.length > 10 ? `${v.slice(0, 4)}...${v.slice(-4)}` : v
    }

    // ── handleAddressChange — updates local draft only, never fires tx ────────
    const handleAddressChange = (id: string, value: string) => {
        const heir = heirs.find((h) => h.id === id)
        if (!heir) return
        setDraftField(id, 'walletAddress', value, heir)
    }

    // ── handleBpsChange — updates local draft + validates inline ──────────────
    const handleBpsChange = (id: string, value: string) => {
        const heir = heirs.find((h) => h.id === id)
        if (!heir) return

        const newBps = Number(value) || 0
        const otherSum = heirs
            .filter((h) => h.id !== id)
            .reduce((sum, h) => sum + (Number(h.shareBps) || 0), 0)

        if (otherSum + newBps > 10000) {
            setAddError(`Total BPS would be ${otherSum + newBps} — cannot exceed 10,000.`)
        } else {
            setAddError('')
        }

        setDraftField(id, 'shareBps', value, heir)
    }

    // ── handleRemove — opens confirm dialog ───────────────────────────────────
    const handleRemove = (id: string) => {
        const heir = heirs.find((h) => h.id === id)
        if (!heir) return
        requestRemove(heir)
    }

    // ── Validate BPS for a given heir edit ─────────────────────────────────────
    const validateBps = (heirId: string, newBps: number): string | null => {
        if (newBps <= 0) return 'BPS must be greater than 0.'
        if (newBps > 10000) return 'BPS cannot exceed 10,000.'

        const otherSum = heirs
            .filter((h) => h.id !== heirId)
            .reduce((sum, h) => sum + (Number(h.shareBps) || 0), 0)

        if (otherSum + newBps > 10000)
            return `Total BPS would be ${otherSum + newBps} — cannot exceed 10,000.`

        return null
    }

    // ── handleAdd — no multiplication, pass raw bps directly ────────────────
    const handleAdd = async () => {
        const address = draftAddress.trim()
        const bps = Number(draftBps)           // user types 5000 for 50%

        if (!address) return setAddError('Enter a wallet address.')
        if (!bps || bps <= 0) return setAddError('Enter a valid BPS value.')
        if (heirs.length >= 5) return setAddError('Maximum 5 heirs allowed.')

        const bpsErr = validateBps('__new__', bps)
        if (bpsErr) return setAddError(bpsErr)

        const ok = await addHeir(address, bps)
        if (ok) {
            setDraftAddress('')
            setDraftBps('')
            setAddError('')
        }
    }

    // ── Request update — open dialog ───────────────────────────────────────────
    const requestUpdate = (heir: Heir) => {
        const draft = getDraft(heir)
        const newBps = Number(draft.shareBps) || 0
        const newAddr = draft.walletAddress.trim()

        // Nothing changed — no-op
        if (newAddr === (heir.walletAddress ?? '') && newBps === (heir.shareBps ?? 0)) return

        const bpsErr = validateBps(heir.id, newBps)
        if (bpsErr) {
            setAddError(bpsErr)
            return
        }

        setAddError('')
        setDialog({ type: 'update', heir, newAddress: newAddr, newBps })
    }

    // ── Request remove — open dialog ───────────────────────────────────────────
    const requestRemove = (heir: Heir) => {
        setDialog({ type: 'remove', heir })
    }

    // ── Confirm dialog action ─────────────────────────────────────────────────
    const handleConfirm = async () => {
        if (!dialog) return
        setDialogLoading(true)

        if (dialog.type === 'update') {
            const ok = await executeUpdateHeir(
                dialog.heir.id,
                dialog.heir.walletAddress,
                dialog.newAddress,
                dialog.newBps,
            )
            if (ok) {
                // Clear the local draft for this heir — store is now source of truth
                setEdits((prev) => {
                    const next = { ...prev }
                    delete next[dialog.heir.id]
                    return next
                })
            }
        }

        if (dialog.type === 'remove') {
            await executeRemoveHeir(
                dialog.heir.id,
                dialog.heir.walletAddress,
                dialog.heir.walletAddress, // newHeirAddress required by IDL
                Number(dialog.heir.shareBps) || 0,
            )
        }

        setDialogLoading(false)
        setDialog(null)
    }

    const anyLoading = addLoading || updateLoading || removeLoading || dialogLoading

    return (
        <>
            {/* ── Confirm dialog overlay ─────────────────────────────────────────── */}
            <AnimatePresence>
                {dialog && (
                    <ConfirmDialog
                        dialog={dialog}
                        onConfirm={handleConfirm}
                        onCancel={() => !dialogLoading && setDialog(null)}
                        loading={dialogLoading}
                    />
                )}
            </AnimatePresence>

            <div style={{
                maxWidth: 1100, margin: '0 auto', padding: 24,
                display: 'grid', gap: 22, background: '#EEEEE9', minHeight: '100vh',
            }}>

                {/* ── ADD CARD ──────────────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={card}>
                    <div style={eyebrow}>MANAGE HEIRS</div>
                    <div style={title}>Beneficiary Controls</div>
                    <p style={desc}>
                        Add heirs and assign basis points. Total allocation can never exceed 100 bps (100%).
                    </p>

                    {/* Allocation bar */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={meta}>Allocated</span>
                            <span style={meta}>{totalBps} / 10,000 bps</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: '#E4E4DF', overflow: 'hidden' }}>
                            <motion.div
                                animate={{ width: `${Math.min((totalBps / 10000) * 100, 100)}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{
                                    height: '100%', borderRadius: 999,
                                    background: totalBps >= 10000 ? '#dc2626' : '#242B35',
                                }}
                            />
                        </div>
                        <div style={{ ...meta, marginTop: 8 }}>
                            Remaining: {10000 - totalBps} bps
                        </div>
                    </div>

                    {/* Add row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px', gap: 12 }}>
                        <input
                            placeholder="Wallet address"
                            value={draftAddress}
                            onChange={(e) => setDraftAddress(e.target.value)}
                            style={inputStyle}
                            disabled={anyLoading}
                        />
                        <input
                            placeholder="BPS (e.g. 5000 = 50%)"
                            type="number"
                            min={1}
                            max={10000}
                            value={draftBps}
                            onChange={(e) => setDraftBps(e.target.value)}
                            style={inputStyle}
                            disabled={anyLoading}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={anyLoading}
                            style={{ ...primaryBtn, opacity: anyLoading ? 0.6 : 1 }}
                        >
                            <Plus size={15} />
                            {addLoading ? 'Adding…' : 'Add Heir'}
                        </button>
                    </div>

                    {addError && (
                        <div style={{ marginTop: 12, color: '#dc2626', fontSize: 12, fontWeight: 300 }}>
                            {addError}
                        </div>
                    )}
                </motion.div>

                {/* ── HEIR CARDS ────────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }} style={card}
                >
                    <div style={eyebrow}>CURRENT HEIRS</div>

                    {heirs.length === 0 ? (
                        <div style={{ padding: '44px 20px', borderRadius: 22, border: '1px dashed #E4E4DF', textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F7F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Users size={24} color="#555550" />
                            </div>
                            <div style={{ fontSize: 16, color: '#1A1A18', fontWeight: 300 }}>No heirs added yet</div>
                            <div style={{ fontSize: 13, color: '#8A8A82', marginTop: 6 }}>Add your first beneficiary above.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 18 }}>
                            <AnimatePresence>
                                {heirs.map((heir, i) => {
                                    const draft = getDraft(heir)
                                    const bps = Number(heir.shareBps) || 0
                                    const percent = bps / 100          // 10000 → 100.00%
                                    const deg = (bps / 10000) * 360
                                    const isRemoving = removingId === heir.id

                                    const draftBpsNum = Number(draft.shareBps) || 0
                                    const isDirty =
                                        draft.walletAddress !== (heir.walletAddress ?? '') ||
                                        draftBpsNum !== bps

                                    const liveBpsErr = isDirty ? validateBps(heir.id, draftBpsNum) : null


                                    return (
                                        <motion.div
                                            key={heir.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: isRemoving ? 0.4 : 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            transition={{ delay: i * 0.05 }}
                                            whileHover={{ y: isRemoving ? 0 : -4 }}
                                            style={{
                                                ...heirCard,
                                                outline: isDirty ? '2px solid #242B35' : 'none',
                                            }}
                                        >
                                            {/* Donut — reflects confirmed store bps */}
                                            <div style={{
                                                width: 110, height: 110, borderRadius: '50%',
                                                background: `conic-gradient(#242B35 ${deg}deg, #E4E4DF ${deg}deg)`,
                                                padding: 4,
                                            }}>
                                                <div style={{
                                                    width: '100%', height: '100%', borderRadius: '50%', background: '#fff',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <div style={{ fontSize: 16, color: '#1A1A18', fontWeight: 300 }}>
                                                        {percent.toFixed(2)}%
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#8A8A82' }}>{bps} bps</div>
                                                </div>
                                            </div>

                                            {/* Confirmed address — truncated display */}
                                            <div style={{ fontSize: 13, color: '#555550' }}>
                                                {truncate(heir.walletAddress)}
                                            </div>

                                            {/* Editable address — bound to draft */}
                                            <input
                                                value={draft.walletAddress}
                                                onChange={(e) => handleAddressChange(heir.id, e.target.value)}
                                                placeholder="Wallet address"
                                                style={inputStyle}
                                                disabled={isRemoving || updateLoading}
                                            />

                                            {/* Editable bps — bound to draft */}
                                            <div style={{ width: '100%' }}>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={10000}
                                                    value={draft.shareBps}
                                                    onChange={(e) => handleBpsChange(heir.id, e.target.value)}
                                                    style={{
                                                        ...inputStyle,
                                                        borderColor: liveBpsErr ? '#dc2626' : '#E4E4DF',
                                                    }}
                                                    disabled={isRemoving || updateLoading}
                                                />
                                                {liveBpsErr && (
                                                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 300 }}>
                                                        {liveBpsErr}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action row */}
                                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                                {/* Save — appears only when dirty and no BPS error */}
                                                <AnimatePresence>
                                                    {isDirty && !liveBpsErr && (
                                                        <motion.button
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            onClick={() => requestUpdate(heir)}
                                                            disabled={isRemoving || updateLoading}
                                                            style={{
                                                                flex: 1, height: 40, borderRadius: 12,
                                                                border: 'none', background: '#242B35',
                                                                color: '#fff', fontSize: 13, fontWeight: 300,
                                                                cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                            }}
                                                        >
                                                            <Check size={13} />
                                                            Save
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>

                                                {/* Discard — appears only when dirty */}
                                                <AnimatePresence>
                                                    {isDirty && (
                                                        <motion.button
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            onClick={() =>
                                                                setEdits((prev) => {
                                                                    const next = { ...prev }
                                                                    delete next[heir.id]
                                                                    return next
                                                                })
                                                            }
                                                            style={{
                                                                width: 40, height: 40, borderRadius: 12,
                                                                border: '1px solid #E4E4DF', background: '#F7F7F4',
                                                                cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <X size={13} color="#555550" />
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => handleRemove(heir.id)}
                                                    disabled={isRemoving || removeLoading}
                                                    style={{
                                                        ...deleteBtn,
                                                        flex: isDirty ? '0 0 40px' : 1,
                                                        width: isDirty ? 40 : '100%',
                                                        opacity: isRemoving ? 0.5 : 1,
                                                        cursor: isRemoving ? 'not-allowed' : 'pointer',
                                                    }}
                                                >
                                                    {isRemoving
                                                        ? <span style={{ fontSize: 12, color: '#8A8A82' }}>Removing…</span>
                                                        : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                                {/* <DesignatedHeirs activeHeirs={heirs} avatarColors={[""]} /> */}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid #E4E4DF',
    borderRadius: 28, padding: 26,
    boxShadow: '0 2px 12px rgba(36,43,53,0.06)',
}
const eyebrow: React.CSSProperties = {
    fontSize: 11, color: '#8A8A82',
    letterSpacing: '0.14em', fontWeight: 300, marginBottom: 10,
}
const title: React.CSSProperties = {
    fontSize: 30, color: '#1A1A18', fontWeight: 300, marginBottom: 10,
}
const desc: React.CSSProperties = {
    fontSize: 14, color: '#555550',
    lineHeight: 1.6, fontWeight: 300, marginBottom: 20,
}
const meta: React.CSSProperties = {
    fontSize: 12, color: '#8A8A82', fontWeight: 300,
}
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    borderRadius: 16, border: '1px solid #E4E4DF',
    background: '#FFFFFF', color: '#1A1A18',
    fontSize: 14, fontWeight: 300, outline: 'none',
    boxSizing: 'border-box',
}
const primaryBtn: React.CSSProperties = {
    border: '1px solid #242B35', background: '#242B35',
    color: '#fff', borderRadius: 16, cursor: 'pointer',
    fontSize: 14, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}
const heirCard: React.CSSProperties = {
    border: '1px solid #E4E4DF', borderRadius: 22,
    padding: 16, background: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    transition: 'outline 0.15s',
}
const deleteBtn: React.CSSProperties = {
    height: 40, borderRadius: 12,
    border: '1px solid #E4E4DF', background: '#F7F7F4',
    cursor: 'pointer', color: '#1A1A18',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
}