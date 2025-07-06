// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { loginUser } from '../services/api';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await loginUser(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate based on role
      const userRole = response.data.user.role;
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'stylist') {
        navigate('/stylist/dashboard');
      } else {
        navigate('/my-appointments'); // Default for customer
      }
      // window.location.reload(); // Consider if truly needed, or manage state globally
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Common styles for auth pages
  const authPageStyle = {
    maxWidth: '450px',
    margin: '50px auto', // Centered with some top margin
    padding: '30px', // Padding inside the container
    // backgroundColor: 'var(--secondary-dark)', // Using section-container class instead
    // borderRadius: '8px',
    // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  };

  const titleStyle = {
    textAlign: 'center',
    color: 'var(--primary-gold)',
    marginBottom: '30px',
  };

  const formGroupStyle = {
    marginBottom: '20px',
  };

  const linkStyle = {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
    color: 'var(--primary-gold)', // uses global 'a' style but can be explicit
  };

  const errorStyle = {
      color: '#ff8c8c', // A lighter red for dark backgrounds
      textAlign: 'center',
      marginBottom: '15px',
      fontWeight: 'bold'
  };


  return (
    <div style={authPageStyle} className="section-container"> {/* Use section-container for theme */}
      <h1 style={titleStyle}>Login</h1>
      {error && <p style={errorStyle}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <Link to="/request-password-reset" style={{display: 'block', textAlign: 'right', marginTop: '5px', marginBottom: '15px', fontSize: '0.9em'}}>
          Forgot Password?
        </Link>
        <button type="submit" disabled={loading} style={{ width: '100%', fontSize: '1.1rem' }}>
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      <Link to="/register" style={linkStyle}>
        Don't have an account? Register here
      </Link>
    </div>
  );
}

export default LoginPage;
