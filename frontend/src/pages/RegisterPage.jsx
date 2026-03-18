import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  // 1. STATE MANAGEMENT
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    address: '', 
    company_name: '', // For Suppliers
    description: '',  // For Suppliers (New)
    role: 'customer'  // Default role
  });
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');

  // 2. HANDLERS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Send data to backend (which talks to Supabase)
      await axios.post('http://localhost:5000/api/auth/register', formData);
      
      // On success, show the "Check Email" view
      setIsRegistered(true); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration Failed');
    }
  };

  // 3. STYLES (Glassmorphism)
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '40px',
    width: '400px',
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
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={glassStyle}>
        
        {/* --- VIEW 1: SUCCESS MESSAGE (After Registering) --- */}
        {isRegistered ? (
          <div>
            <h2 style={{ color: '#4facfe', marginBottom: '20px' }}>📧 Check Your Email</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
              We have sent a verification link to <strong>{formData.email}</strong>.
            </p>
            <p style={{ opacity: 0.8, marginBottom: '30px' }}>
              You cannot log in until you click that link.
            </p>
            
            <p style={{ marginTop: '20px' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'underline' }}>
                    Go to Login Page
                </Link>
            </p>
          </div>
        ) : (
          /* --- VIEW 2: REGISTER FORM (Normal) --- */
          <>
            <h2 style={{ marginBottom: '25px', fontWeight: '300' }}>Join with Hasal Products!</h2>
            
            <form onSubmit={handleSubmit}>
              <input name="name" type="text" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
              <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required style={inputStyle} />
              <input name="phone" type="tel" placeholder="Phone Number" onChange={handleChange} required style={inputStyle} />
              <input name="address" type="text" placeholder="Address" onChange={handleChange} required style={inputStyle} />
              
              {/* --- CONDITIONAL FIELDS FOR SUPPLIER --- */}
              {formData.role === 'supplier' && (
                <>
                  <input 
                    name="company_name" 
                    type="text" 
                    placeholder="Company Name" 
                    onChange={handleChange} 
                    required 
                    style={inputStyle} 
                  />
                  <textarea 
                    name="description" 
                    placeholder="Describe your business (e.g., We sell organic cinnamon...)" 
                    onChange={handleChange} 
                    required 
                    style={{ ...inputStyle, height: '80px', resize: 'none', fontFamily: 'inherit' }} 
                  />
                </>
              )}

              <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={inputStyle} />

              <label style={{display:'block', textAlign:'left', fontSize:'12px', marginBottom:'5px', opacity:0.8}}>Select Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                style={{ ...inputStyle, background: '#1a1a2e', cursor: 'pointer' }} // Dark bg fix
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </select>

              {error && <p style={{ color: '#ff6b6b', marginBottom: '10px' }}>{error}</p>}

              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  // Change color slightly for Supplier to indicate a "Request" action
                  background: formData.role === 'supplier' 
                    ? 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)' // Red/Pink for Request
                    : 'linear-gradient(45deg, #11998e 0%, #38ef7d 100%)', // Green for Register
                  border: 'none', 
                  borderRadius: '5px', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
              >
                {formData.role === 'supplier' ? 'Send Request' : 'Register'}
              </button>
            </form>
            
            <p style={{ marginTop: '20px', fontSize: '14px' }}>
              Already have an account? <Link to="/" style={{ color: '#4facfe' }}>Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}