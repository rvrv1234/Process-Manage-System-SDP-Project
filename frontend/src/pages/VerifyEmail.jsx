import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
        setStatus('✅ Account Verified! Redirecting to login...');
        setTimeout(() => navigate('/'), 3000); // Redirect after 3 seconds
      } catch (err) {
        setStatus('❌ Verification Failed. The token might be invalid or expired.');
      }
    };

    if (token) verifyAccount();
  }, [token, navigate]);

  // Glass Style
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '40px',
    color: 'white',
    textAlign: 'center'
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={glassStyle}>
        <h2>Email Verification</h2>
        <p style={{ marginTop: '20px', fontSize: '18px' }}>{status}</p>
      </div>
    </div>
  );
}