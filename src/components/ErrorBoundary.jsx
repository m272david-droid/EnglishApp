import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
            background: '#ECEAF6',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✦</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#18172B', marginBottom: 8 }}>
            משהו השתבש
          </h2>
          <p style={{ color: '#5A5874', fontSize: 14, marginBottom: 24, maxWidth: 260, lineHeight: 1.6 }}>
            אירעה שגיאה בלתי צפויה. רענן את הדף כדי להמשיך.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3B4DA8',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            רענן דף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
