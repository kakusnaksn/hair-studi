// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { registerUser } from '../services/api';

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await registerUser(formData);
      setMessage(response.data.message + ' You can now log in.');
      setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' }); // Reset form
      // setTimeout(() => navigate('/login'), 3000); // Optional: redirect to login
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Common styles for auth pages (can be refactored into a shared style object or CSS if preferred)
  const authPageStyle = {
    maxWidth: '500px', // Slightly wider for more fields
    margin: '50px auto',
    padding: '30px',
    // backgroundColor: 'var(--secondary-dark)',
    // borderRadius: '8px',
    // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  };

  const titleStyle = {
    textAlign: 'center',
    color: 'var(--primary-gold)',
    marginBottom: '30px',
  };

  const formGroupStyle = {
    marginBottom: '15px', // Slightly less margin for more fields
  };

  const linkStyle = {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
  };

  const errorStyle = {
      color: '#ff8c8c',
      textAlign: 'center',
      marginBottom: '15px',
      fontWeight: 'bold'
  };

  const successStyle = {
      color: 'var(--primary-gold)', // Or a light green
      textAlign: 'center',
      marginBottom: '15px',
      fontWeight: 'bold'
  };

  return (
    <div style={authPageStyle} className="section-container"> {/* Use section-container for theme */}
      <h1 style={titleStyle}>Create Your Account</h1>
      {error && <p style={errorStyle}>{error}</p>}
      {message && <p style={successStyle}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="firstName">First Name:</label>
          <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="lastName">Last Name:</label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', fontSize: '1.1rem' }}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      <Link to="/login" style={linkStyle}>
        Already have an account? Login here
      </Link>
    </div>
  );
}

export default RegisterPage;
