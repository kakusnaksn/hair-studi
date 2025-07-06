// frontend/src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ResetPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlToken = query.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('No reset token found. Please request a new reset link.');
    }
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) { // Consistent with backend validation
        setError('Password must be at least 6 characters long.');
        return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await resetPassword(token, newPassword);
      setMessage(response.data.message + ' You can now log in with your new password.');
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3s
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Reusing styles
  const authPageStyle = { maxWidth: '450px', margin: '50px auto', padding: '30px' };
  const titleStyle = { textAlign: 'center', color: 'var(--primary-gold)', marginBottom: '30px' };
  const formGroupStyle = { marginBottom: '20px' };
  const linkStyle = { display: 'block', textAlign: 'center', marginTop: '20px' };
  const messageStyle = { color: 'var(--primary-gold)', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' };
  const errorStyle = { color: '#ff8c8c', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' };

  if (!token && !error) { // If token is not in URL and no other error yet
      return (
          <div style={authPageStyle} className="section-container">
              <h1 style={titleStyle}>Invalid Link</h1>
              <p style={errorStyle}>The password reset link is missing a token. Please request a new one.</p>
              <Link to="/request-password-reset" style={linkStyle}>Request New Link</Link>
          </div>
      );
  }


  return (
    <div style={authPageStyle} className="section-container">
      <h1 style={titleStyle}>Set New Password</h1>
      {message && <p style={messageStyle}>{message}</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!message && ( // Hide form after success
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label htmlFor="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div style={formGroupStyle}>
            <label htmlFor="confirmPassword">Confirm New Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading || !token} style={{ width: '100%', fontSize: '1.1rem' }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
       <Link to="/login" style={linkStyle}>
        Back to Login
      </Link>
    </div>
  );
}

export default ResetPasswordPage;
