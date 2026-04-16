import Spinner from "./spinner";

export default function FullScreenSpinner({ label }: { label: string }) {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#eeeee9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            fontFamily: '"DM Sans", sans-serif',
        }}>
            <Spinner />
            <p style={{ fontSize: 14, color: '#8a8a82', margin: 0 }}>{label}</p>
        </div>
    )
}