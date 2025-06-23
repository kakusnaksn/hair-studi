// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { createStylistByAdmin } from '../services/api';

function AdminDashboardPage() {
  const [stylistFormData, setStylistFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleChange = (e) => {
    setStylistFormData({ ...stylistFormData, [e.target.name]: e.target.value });
  };

  const handleSubmitStylist = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await createStylistByAdmin(stylistFormData);
      setMessage(response.data.message || 'Stylist account created successfully!');
      setStylistFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' }); // Reset form
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create stylist account.');
      console.error("Error creating stylist:", err);
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {user && <p>Welcome, {user.firstName} {user.lastName} (Admin)!</p>}

      <section style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Create New Stylist Account</h3>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmitStylist}>
          <div>
            <label>First Name:</label>
            <input type="text" name="firstName" value={stylistFormData.firstName} onChange={handleChange} required />
          </div>
          <div>
            <label>Last Name:</label>
            <input type="text" name="lastName" value={stylistFormData.lastName} onChange={handleChange} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={stylistFormData.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Phone Number:</label>
            <input type="tel" name="phoneNumber" value={stylistFormData.phoneNumber} onChange={handleChange} required />
          </div>
          <div>
            <label>Initial Password:</label>
            <input type="password" name="password" value={stylistFormData.password} onChange={handleChange} required />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Create Stylist</button>
        </form>
      </section>

      {/* Other admin functionalities can be added here later, e.g., manage services, view all bookings */}
    </div>
  );
}

export default AdminDashboardPage;
