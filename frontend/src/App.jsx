// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import StylistDashboardPage from './pages/StylistDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // <-- Import AdminDashboardPage

// Helper to get user from local storage
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Updated ProtectedRoute to handle roles
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const currentUser = getCurrentUser();

  if (!token || !currentUser) {
    // Not logged in
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Logged in but not authorized for this route
    alert("You are not authorized to view this page."); // Simple feedback
    return <Navigate to="/" />;
  }

  return children; // Authorized
}

// Navigation Component
function Navigation() {
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
      <ul style={{ listStyleType: 'none', margin: 0, padding: 0, display: 'flex', gap: '15px' }}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/services">Services</Link></li>

        {currentUser && currentUser.role === 'customer' && (
          <>
            <li><Link to="/book-appointment">Book Appointment</Link></li>
            <li><Link to="/my-appointments">My Appointments</Link></li>
          </>
        )}

        {currentUser && currentUser.role === 'stylist' && (
          <li><Link to="/stylist/dashboard">My Dashboard</Link></li>
        )}

        {currentUser && currentUser.role === 'admin' && (
           <li><Link to="/admin/dashboard">Admin Dashboard</Link></li> // Ensure this is present
        )}

        {currentUser ? (
          <>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button onClick={handleLogout} style={{
                background: 'none', border: 'none', padding: 0, margin:0,
                color: 'blue', textDecoration: 'underline', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'inherit'
              }}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <Navigation />
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/services" element={<ServicesPage />} />

          <Route
            path="/book-appointment"
            element={<ProtectedRoute allowedRoles={['customer']}><BookingPage /></ProtectedRoute>}
          />
          <Route
            path="/my-appointments"
            element={<ProtectedRoute allowedRoles={['customer']}><MyAppointmentsPage /></ProtectedRoute>}
          />
          <Route
            path="/stylist/dashboard"
            element={<ProtectedRoute allowedRoles={['stylist']}><StylistDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/dashboard" // <-- Add Admin Dashboard Route
            element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
        </Routes>
      </div>
    </Router>
  );
}

// Simplified HomePage
function HomePage() {
  return (
    <div>
      <h1>Welcome to the Hair Studio</h1>
      <p>Your one-stop solution for hair styling and care.</p>
      <p>Browse our <Link to="/services">list of services</Link> and book your next appointment with ease!</p>
    </div>
  );
}

export default App;
