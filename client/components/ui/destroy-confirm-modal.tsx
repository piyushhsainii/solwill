import { Trash2 } from "lucide-react"
import { useState } from "react"

export function DestroyConfirmModal({ onConfirm, onCancel, loading }: {
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