import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

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

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        
        {/* --- VIEW 1: SUCCESS MESSAGE (After Registering) --- */}
        {isRegistered ? (
          <div className="auth-success">
            <div className="auth-success-icon">📧</div>
            <h2>Check Your Email</h2>
            <p>
              We have sent a verification link to <strong>{formData.email}</strong>.
            </p>
            <p style={{ opacity: 0.8, fontSize: '0.875rem', marginTop: '1rem' }}>
              You cannot log in until you click that link.
            </p>
            
            <div className="auth-link-container">
                <Link to="/" className="auth-link">
                    Go to Login Page
                </Link>
            </div>
          </div>
        ) : (
          /* --- VIEW 2: REGISTER FORM (Normal) --- */
          <>
            <header className="auth-header">
              <h1>Join Hasal Products</h1>
              <p>Create an account to get started</p>
            </header>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label className="auth-label">Full Name</label>
                <input name="name" type="text" placeholder="John Doe" onChange={handleChange} required className="auth-input" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <input name="email" type="email" placeholder="john@example.com" onChange={handleChange} required className="auth-input" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Phone Number</label>
                <input name="phone" type="tel" placeholder="+94 77 123 4567" onChange={handleChange} required className="auth-input" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Address</label>
                <input name="address" type="text" placeholder="No 123, Galle Road, Colombo" onChange={handleChange} required className="auth-input" />
              </div>
              
              <div className="auth-form-group">
                <label className="auth-label">Select Role</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                  className="auth-select"
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                </select>
              </div>

              {/* --- CONDITIONAL FIELDS FOR SUPPLIER --- */}
              {formData.role === 'supplier' && (
                <>
                  <div className="auth-form-group">
                    <label className="auth-label">Company Name</label>
                    <input 
                      name="company_name" 
                      type="text" 
                      placeholder="Hasal Spices Pvt Ltd" 
                      onChange={handleChange} 
                      required 
                      className="auth-input" 
                    />
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-label">Business Description</label>
                    <textarea 
                      name="description" 
                      placeholder="Describe your business (e.g., We sell organic cinnamon...)" 
                      onChange={handleChange} 
                      required 
                      className="auth-textarea"
                      style={{ height: '80px', resize: 'none' }}
                    />
                  </div>
                </>
              )}

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input name="password" type="password" placeholder="••••••••" onChange={handleChange} required className="auth-input" />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button 
                type="submit" 
                className="auth-button"
                style={{
                  backgroundColor: formData.role === 'supplier' ? '#065f46' : '#059669'
                }}
              >
                {formData.role === 'supplier' ? 'Send Application' : 'Register Now'}
              </button>
            </form>
            
            <p className="auth-link-container">
              Already have an account? <Link to="/" className="auth-link">Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}