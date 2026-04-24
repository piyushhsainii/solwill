import { AlertTriangle } from "lucide-react"

export function TriggeredBanner({ status }: { status: string }) {
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
