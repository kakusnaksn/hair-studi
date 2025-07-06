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
import AdminDashboardPage from './pages/AdminDashboardPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage'; // <-- Import
import ResetPasswordPage from './pages/ResetPasswordPage';             // <-- Import

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
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    alert("You are not authorized to view this page.");
    return <Navigate to="/" />;
  }

  return children;
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
    <nav style={{ backgroundColor: 'var(--secondary-dark)', padding: '10px 0', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
      <ul style={{ listStyleType: 'none', margin: 0, padding: '0 20px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
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
           <li><Link to="/admin/dashboard">Admin Dashboard</Link></li>
        )}

        {currentUser ? (
          <>
            <li><Link to="/profile">Profile</Link></li>
            <li>
              <button onClick={handleLogout} className="nav-logout-button">
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
// Add CSS for nav-logout-button in index.css if it's not covered by global nav button styles

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
          <Route path="/request-password-reset" element={<RequestPasswordResetPage />} /> {/* <-- New Route */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />               {/* <-- New Route (token in query) */}

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
            path="/admin/dashboard"
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
