import React from 'react'

export default function PulsingDot({ color = '#4ade80' }: { color?: string }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
            <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: color,
                animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.6,
            }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'block' }} />
        </span>
    )
}