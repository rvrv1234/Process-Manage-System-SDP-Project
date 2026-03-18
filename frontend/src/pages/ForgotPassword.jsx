import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/auth/reset-password/${token}`, { newPassword: password });
      alert('Password Reset Successful! Redirecting to login...');
      navigate('/login');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Invalid Token'));
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <h2>Set New Password</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '20px auto' }}>
        <input 
          type="password" 
          placeholder="Enter new password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Update Password
        </button>
      </form>
    </div>
  );
}