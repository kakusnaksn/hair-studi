// frontend/src/pages/RequestPasswordResetPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';

function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.data.message); // "If your email is registered..."
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Reusing styles from LoginPage for consistency
  const authPageStyle = { maxWidth: '450px', margin: '50px auto', padding: '30px' };
  const titleStyle = { textAlign: 'center', color: 'var(--primary-gold)', marginBottom: '30px' };
  const formGroupStyle = { marginBottom: '20px' };
  const linkStyle = { display: 'block', textAlign: 'center', marginTop: '20px' };
  const messageStyle = { color: 'var(--primary-gold)', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' };
  const errorStyle = { color: '#ff8c8c', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' };

  return (
    <div style={authPageStyle} className="section-container">
      <h1 style={titleStyle}>Reset Your Password</h1>
      {message && <p style={messageStyle}>{message}</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!message && ( // Hide form after successful message display
        <form onSubmit={handleSubmit}>
          <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px'}}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div style={formGroupStyle}>
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', fontSize: '1.1rem' }}>
            {loading ? 'Sending...' : 'Send Password Reset Link'}
          </button>
        </form>
      )}
      <Link to="/login" style={linkStyle}>
        Back to Login
      </Link>
    </div>
  );
}

export default RequestPasswordResetPage;
