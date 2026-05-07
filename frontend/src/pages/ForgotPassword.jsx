import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/password/forgot-password', { email });
      setMessage(res.data.message || 'If an account exists, a reset code has been sent!');
      setTimeout(() => navigate('/reset-password'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header" style={{ textAlign: 'center' }}>
          <h2>Reset Password</h2>
          <p>Enter your email to receive a recovery link.</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="auth-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p style={{ color: 'var(--primary-emerald)', fontSize: '0.875rem' }}>{message}</p>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-link-container" style={{ textAlign: 'center' }}>
          Remember your password? <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}