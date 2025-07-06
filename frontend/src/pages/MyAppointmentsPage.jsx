// frontend/src/pages/MyAppointmentsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getMyAppointments, updateAppointmentStatus } from '../services/api';
import { Link } from 'react-router-dom';
import moment from 'moment'; // For date calculations

const CANCELLATION_WINDOW_HOURS = 24; // Consistent with backend (can be from config later)

function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', content: '' }); // For success/error of actions

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionMessage({ type: '', content: '' });
    try {
      const response = await getMyAppointments();
      // Backend already formats these nicely, including nested service and stylist objects
      // and flat service_name, stylist_name
      setAppointments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelAppointment = async (appointmentId) => {
    setActionMessage({ type: '', content: '' });
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }

    try {
      // setLoading(true); // Consider a specific loading state for the card being actioned
      await updateAppointmentStatus(appointmentId, 'cancelled');
      setActionMessage({ type: 'success', content: 'Appointment cancelled successfully.' });
      // Refresh or update local state
      setAppointments(prevApps =>
        prevApps.map(app =>
          app.appointment_id === appointmentId ? { ...app, status: 'cancelled' } : app
        )
      );
    } catch (err) {
      setActionMessage({ type: 'error', content: err.response?.data?.message || 'Failed to cancel appointment.' });
      console.error("Error cancelling appointment:", err);
    } finally {
      // setLoading(false);
    }
  };

  const pageTitleStyle = {
    textAlign: 'center',
    color: 'var(--primary-gold)',
    marginBottom: '40px',
  };

  const messageStyle = (type) => ({
    textAlign: 'center',
    padding: '10px',
    margin: '20px 0', // Increased margin for better visibility
    borderRadius: '5px',
    fontWeight: 'bold',
    backgroundColor: type === 'success' ? 'var(--primary-gold)' : '#ff8c8c',
    color: type === 'success' ? 'var(--primary-dark)' : 'var(--text-primary)',
  });


  if (loading) {
    return <p style={{ textAlign: 'center', fontSize: '1.2rem', marginTop: '50px' }}>Loading your appointments...</p>;
  }

  if (error) {
    return <p style={{ color: '#ff8c8c', textAlign: 'center', fontSize: '1.2rem', marginTop: '50px' }}>Error: {error}</p>;
  }

  return (
    <div className="my-appointments-container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={pageTitleStyle}>My Appointments</h1>

      {actionMessage.content && (
        <p style={messageStyle(actionMessage.type)}>{actionMessage.content}</p>
      )}

      {appointments.length === 0 && !loading && (
        <div className="section-container" style={{textAlign: 'center', padding: '30px'}}>
            <p style={{fontSize: '1.1rem', color: 'var(--text-secondary)'}}>You have no appointments scheduled.</p>
            <Link to="/book-appointment" className="button-as-link" style={{marginTop: '20px', display: 'inline-block'}}>
                Book an Appointment
            </Link>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="appointments-list">
          {appointments.map(app => {
            const appointmentStartTime = moment(app.appointment_start_time);
            const isCancellable = app.status === 'booked' && appointmentStartTime.isAfter(moment().add(CANCELLATION_WINDOW_HOURS, 'hours'));

            let statusColor = 'var(--text-primary)';
            if (app.status === 'cancelled') statusColor = '#ff8c8c';
            else if (app.status === 'completed') statusColor = '#5cb85c';
            else if (app.status === 'no-show') statusColor = '#f0ad4e';
            else if (app.status === 'booked' && appointmentStartTime.isBefore(moment())) statusColor = 'var(--text-secondary)';
            else if (app.status === 'booked') statusColor = 'var(--primary-gold)';

            return (
              <div key={app.appointment_id} className="section-container" style={{ marginBottom: '20px', opacity: app.status === 'cancelled' || app.status === 'completed' || app.status === 'no-show' ? 0.65 : 1 }}>
                <h3 style={{ color: 'var(--primary-gold)', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.4rem' }}>
                  {app.service_name || app.service?.name || 'Service Details'}
                </h3>
                <p><strong>Stylist:</strong> {app.stylist_name || app.stylist?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {appointmentStartTime.format('LLLL')} ({appointmentStartTime.fromNow()})</p>
                <p><strong>Status:</strong>
                  <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: statusColor }}>
                    {app.status}
                  </span>
                </p>
                {app.notes && <p style={{marginTop: '10px', fontStyle: 'italic', color: 'var(--text-secondary)'}}><strong>Your Notes:</strong> {app.notes}</p>}

                {isCancellable && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleCancelAppointment(app.appointment_id)}
                      style={{ backgroundColor: '#c9302c', color: 'white' }} // Distinct cancel button style
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyAppointmentsPage;
