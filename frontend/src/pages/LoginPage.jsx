import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Hasal Products</h1>
          <p>Login to manage your business</p>
        </header>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="auth-label">Password</label>
              <Link to="/forgot-password" size="sm" className="auth-forgot-link">
                Forgot Password?
              </Link>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="auth-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-link-container">
          Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
        </p>
      </div>
    </div>
  );
}