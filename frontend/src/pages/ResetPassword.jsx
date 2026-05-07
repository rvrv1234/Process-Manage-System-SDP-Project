import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/password/reset-password/${code}`, { newPassword: password });
      alert('Password Reset Successful! Redirecting to login...');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or Expired Token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header" style={{ textAlign: 'center' }}>
          <h2>Set New Password</h2>
          <p>Please enter your new password below.</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Reset Code</label>
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <p className="auth-link-container" style={{ textAlign: 'center' }}>
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}