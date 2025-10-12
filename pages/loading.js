// loading.js
// Place this file in your project root or components folder

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        {/* Spinner */}
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        
        {/* Loading Text */}
        <p style={{
          fontSize: '18px',
          color: '#333',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          Loading your content...
        </p>
      </div>

      {/* Keyframe animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}