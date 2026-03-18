import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, we simulate the email sending
    alert(`If an account exists for ${email}, a reset link has been sent!`);
  };

  // --- GLASS STYLE ---
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '40px',
    width: '350px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    textAlign: 'center',
    color: 'white'
  };

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    color: '#000',
    borderRadius: '5px',
    padding: '12px',
    marginBottom: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <div style={glassStyle}>
        <h2 style={{ marginBottom: '10px', fontWeight: '300' }}>Reset Password</h2>
        <p style={{ marginBottom: '25px', fontSize: '14px', opacity: 0.8 }}>Enter your email to receive a recovery link.</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Enter your email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={inputStyle}
          />

          <button 
            type="submit" 
            style={{
              padding: '12px',
              background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)', // Red/Pink Warning Gradient
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              fontWeight: 'bold',
              marginTop: '10px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Send Reset Link
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          <Link to="/" style={{ color: '#4facfe', textDecoration: 'none' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}