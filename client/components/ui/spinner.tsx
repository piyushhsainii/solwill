export default function Spinner() {
    return (
        <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2.5px solid #e4e4df',
            borderTopColor: '#242b35',
            animation: 'spin 0.7s linear infinite',
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}