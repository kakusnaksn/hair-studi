// frontend/src/pages/MyAppointmentsPage.jsx
import React, { useEffect, useState } from 'react';
import { getMyAppointments } from '../services/api'; // Named import
import { Link } from 'react-router-dom';

function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getMyAppointments();
        // Assuming the backend returns an array of appointments
        // Each appointment should have: appointment_id, service_name, stylist_name, appointment_start_time, status
        // This might require joins on the backend or multiple fetches, handled by the backend endpoint.
        setAppointments(response.data);
      } catch (err) {
        if (err.response && err.response.status === 501) { // 501 Not Implemented
            setError("The 'My Appointments' feature is coming soon! The backend endpoint is not yet implemented.");
        } else {
            setError(err.response?.data?.message || 'Failed to fetch appointments.');
        }
        console.error("Error fetching appointments:", err);
        setAppointments([]); // Clear appointments on error
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return <p>Loading your appointments...</p>;
  }

  // Custom error message for 501 specifically
  if (error && error.includes("Not Implemented")) {
    return (
        <div>
            <h2>My Appointments</h2>
            <p style={{ color: 'orange' }}>{error}</p>
            <p>Please check back later!</p>
        </div>
    );
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2>My Appointments</h2>
      {appointments.length === 0 && !loading && (
        <p>You have no upcoming appointments. <Link to="/book-appointment">Book one now!</Link></p>
      )}
      {appointments.length > 0 && (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {appointments.map(app => (
            <li key={app.appointment_id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
              <p><strong>Service:</strong> {app.service_name || app.service_id}</p>
              <p><strong>Stylist:</strong> {app.stylist_name || `Stylist ID: ${app.stylist_id}`}</p>
              <p><strong>Date & Time:</strong> {new Date(app.appointment_start_time).toLocaleString()}</p>
              <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{app.status}</span></p>
              {/* Add cancel/reschedule options later */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyAppointmentsPage;
