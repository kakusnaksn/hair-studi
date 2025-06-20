// frontend/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login'); // Redirect to login if no user/token
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // TODO: Update global auth state if using Context or Redux
    setUser(null);
    navigate('/login');
  };

  if (!user) {
    return <p>Loading profile or redirecting...</p>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p><strong>First Name:</strong> {user.firstName}</p>
      <p><strong>Last Name:</strong> {user.lastName}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      {/* Add more profile details here as needed */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default ProfilePage;
