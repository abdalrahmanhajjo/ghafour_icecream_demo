import { Component } from 'react';

// Catches any render/runtime error in the tree and shows a readable message
// instead of a blank white screen — and surfaces the actual error for debugging.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#fff7fb',
          color: '#203b35',
        }}
      >
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#756f67', marginBottom: 16 }}>
            The app hit an error while loading. Details below:
          </p>
          <pre
            style={{
              textAlign: 'left',
              background: '#fff',
              border: '1px solid #ead8c6',
              borderRadius: 12,
              padding: 14,
              fontSize: 12.5,
              overflow: 'auto',
              color: '#c94775',
            }}
          >
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <button
            onClick={() => location.reload()}
            style={{
              marginTop: 16,
              border: 0,
              background: '#c94775',
              color: '#fff',
              borderRadius: 999,
              padding: '10px 18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
