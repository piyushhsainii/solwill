export function Section({ title, description, children, disabled }: {
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