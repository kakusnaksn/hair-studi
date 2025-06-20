// frontend/src/App.jsx
// ... (imports: React, Router, Routes, Route, Link, Navigate)
// ... (imports: RegisterPage, LoginPage, ProfilePage, ServicesPage)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage'; // <-- Import BookingPage

// Basic Home component
function HomePage() {
  const token = localStorage.getItem('token');
  return (
    <div>
      <h1>Welcome to the Hair Studio</h1>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/services">Services</Link></li>
          {/* Add Booking link - accessible to all for now, can be protected */}
          <li><Link to="/book-appointment">Book Appointment</Link></li>
          {token ? (
            <>
              <li><Link to="/profile">Profile</Link></li>
              {/* <li><Link to="/my-appointments">My Appointments</Link></li> Later */}
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
      <p>Book your appointments with ease!</p>
      <p>Check out our <Link to="/services">list of services</Link> or <Link to="/book-appointment">book an appointment now</Link>.</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}


function App() {
  return (
    <Router>
      <div>
        {/* The HomePage component now effectively acts as the main layout with nav */}
        {/* For a more robust layout, Nav would be separate and rendered once */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/services" element={<ServicesPage />} />
          {/* BookingPage could be protected if login is strictly required before viewing slots */}
          <Route
            path="/book-appointment"
            element={
              <ProtectedRoute> {/* Let's protect it: user must be logged in to book */}
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          {/* Add other routes here */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
