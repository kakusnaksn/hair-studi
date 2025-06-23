// frontend/src/pages/StylistDashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { getStylistMySchedule } from '../services/api';

const dayOfWeekMap = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday'
};

function StylistDashboardPage() {
  const [scheduleData, setScheduleData] = useState({ weekly_schedule: [], upcoming_appointments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchStylistData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getStylistMySchedule();
        setScheduleData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch stylist data.');
        console.error("Error fetching stylist data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStylistData();
  }, []);

  if (loading) {
    return <p>Loading your dashboard...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Stylist Dashboard</h2>
      {user && <p>Welcome, {user.firstName} {user.lastName}!</p>}

      <section>
        <h3>My Weekly Schedule</h3>
        {scheduleData.weekly_schedule && scheduleData.weekly_schedule.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {scheduleData.weekly_schedule.sort((a,b) => a.day_of_week - b.day_of_week).map(day => (
              <li key={day.schedule_id || day.day_of_week} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '5px' }}>
                <strong>{dayOfWeekMap[day.day_of_week] || `Day ${day.day_of_week}`}:</strong> {day.start_time} - {day.end_time}
                {day.is_available ? <span style={{color: 'green'}}> (Available)</span> : <span style={{color: 'red'}}> (Unavailable)</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>Your weekly schedule is not set up yet.</p>
        )}
      </section>

      <section style={{marginTop: '20px'}}>
        <h3>My Upcoming Appointments</h3>
        {scheduleData.upcoming_appointments && scheduleData.upcoming_appointments.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {scheduleData.upcoming_appointments.map(app => (
              <li key={app.appointment_id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                <p><strong>Date & Time:</strong> {new Date(app.appointment_start_time).toLocaleString()}</p>
                <p><strong>Service:</strong> {app.service?.name || 'N/A'} ({app.service?.duration || 'N/A'} min)</p>
                <p><strong>Customer:</strong> {app.customer?.name || 'N/A'} ({app.customer?.email || ''} / {app.customer?.phone || ''})</p>
                <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{app.status}</span></p>
                {app.notes && <p><strong>Notes:</strong> {app.notes}</p>}
                 {/* Add options to mark as complete/no-show later */}
              </li>
            ))}
          </ul>
        ) : (
          <p>You have no upcoming appointments.</p>
        )}
      </section>
    </div>
  );
}

export default StylistDashboardPage;
