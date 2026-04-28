import { useState } from 'react';
import api from '../services/api';
import './Login.css';

function Login({ onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [patron, setPatron] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.register(phoneNumber, name, patron);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg"></div>
      <div className="login-card animate-in">
        <div className="login-header">
          <div className="logo-circle">
            <span className="logo-text">FG</span>
          </div>
          <h1>FGBFI Attendance</h1>
          <p className="subtitle">Young Executives Chapter</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Mensah"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="patron">Your Patron</label>
            <input
              id="patron"
              type="text"
              value={patron}
              onChange={(e) => setPatron(e.target.value)}
              placeholder="Enter your patron's name"
            />
            <small style={{ color: 'var(--slate)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Optional - You can add this later
            </small>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+233 XX XXX XXXX"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>New members? Use QR code registration</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
