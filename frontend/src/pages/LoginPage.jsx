import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const userData = res.data.user;
      
      // 🔍 DEBUG: Check the Console to see what the role actually is!
      console.log("LOGIN SUCCESS! User Data:", userData);
      console.log("User Role is:", userData.role);

      login(userData, res.data.token);
      alert('Login Successful!');

      // --- REDIRECT LOGIC ---
      if (userData.role === 'owner' || userData.role === 'admin') {
        navigate('/dashboard/owner');
      } 
      else if (userData.role === 'supplier') {
        navigate('/dashboard/supplier');
      } 
      else if (userData.role === 'customer') {
        navigate('/dashboard/customer');
      } 
      // 👇 ADD 'staff' here just in case your DB uses that word
      else if (userData.role === 'inventory_manager' || userData.role === 'production_manager' || userData.role === 'staff') {
        navigate('/dashboard/staff');
      }
      else if (userData.role === 'delivery_manager') {
        // You haven't asked for a delivery dashboard yet, but this prevents it from going to owner
         

        navigate('/dashboard/delivery');
      }
      else {
        // Fallback: If role is unknown, log it and stay put (or go to login)
        console.warn("Unknown Role:", userData.role);
        navigate('/dashboard/owner'); 
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login Failed');
    }
  };

  // ... (Keep the rest of your Glassmorphism styles and JSX same as before)
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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={glassStyle}>
        <h2 style={{ marginBottom: '20px', fontWeight: '300', letterSpacing: '1px' }}>Hasal Products</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', color: '#000' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', color: '#000' }} />
          <div style={{ textAlign: 'right', marginBottom: '5px' }}>
            <Link to="/forgot-password" style={{ color: '#fff', fontSize: '12px', opacity: 0.7, textDecoration: 'none' }}>Forgot Password?</Link>
          </div>
          {error && <p style={{ color: '#ff6b6b', fontSize: '14px', margin: 0 }}>{error}</p>}
          <button type="submit" style={{ padding: '12px', background: 'linear-gradient(45deg, #00d2ff 0%, #3a7bd5 100%)', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}>Log In</button>
        </form>
        <p style={{ marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
          Don't have an account? <Link to="/register" style={{ color: '#4facfe', textDecoration: 'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}