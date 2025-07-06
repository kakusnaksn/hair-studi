// frontend/src/pages/StylistDashboardPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { getStylistMySchedule, updateAppointmentStatus } from '../services/api'; // Import updateAppointmentStatus
import AppointmentHoverDetail from '../components/AppointmentHoverDetail';

const localizer = momentLocalizer(moment);
const allViews = Object.keys(Views).map(k => Views[k]);

function StylistDashboardPage() {
  const [events, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState(Views.DAY);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null); // Store the whole event object
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const calendarRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchEvents = useCallback(async (view, date) => {
    setLoading(true);
    setError('');
    let rangeStart, rangeEnd;
    if (view === Views.DAY) { rangeStart = moment(date).startOf('day'); rangeEnd = moment(date).endOf('day'); }
    else if (view === Views.WEEK) { rangeStart = moment(date).startOf('week'); rangeEnd = moment(date).endOf('week'); }
    else { rangeStart = moment(date).startOf('month').subtract(7, 'days'); rangeEnd = moment(date).endOf('month').add(7, 'days');}
    try {
      const response = await getStylistMySchedule(rangeStart.format('YYYY-MM-DD'), rangeEnd.format('YYYY-MM-DD'));
      setEvents(response.data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedule data.');
      setEvents([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(currentView, currentDate); }, [currentView, currentDate, fetchEvents]);

  const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), []);
  const handleViewChange = useCallback((newView) => setCurrentView(newView), []);

  const eventStyleGetter = (event /*, start, end, isSelected */) => {
    let style = {
      backgroundColor: 'var(--primary-gold)', borderRadius: '5px', opacity: 0.9,
      color: 'var(--primary-dark)', border: '1px solid var(--primary-dark)',
      display: 'block', fontWeight: 'bold', fontSize: '0.8em', padding: '2px 4px',
    };
    const status = event.resource?.status;
    if (status === 'completed') { style.backgroundColor = '#5cb85c'; style.opacity = 0.7; }
    else if (status === 'cancelled') { style.backgroundColor = '#d9534f'; style.opacity = 0.5; }
    else if (status === 'no-show') { style.backgroundColor = '#f0ad4e'; style.opacity = 0.7; }
    return { style };
  };

  const CustomToolbar = ({ label, view, views, onNavigate, onView }) => {
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => onNavigate('PREV')}>Back</button>
          <button type="button" onClick={() => onNavigate('TODAY')}>Today</button>
          <button type="button" onClick={() => onNavigate('NEXT')}>Next</button>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
        <span className="rbc-btn-group">
          {views.includes(Views.DAY) && <button type="button" className={view === Views.DAY ? 'rbc-active' : ''} onClick={() => onView(Views.DAY)}>Day</button>}
          {views.includes(Views.WEEK) && <button type="button" className={view === Views.WEEK ? 'rbc-active' : ''} onClick={() => onView(Views.WEEK)}>Week</button>}
          {views.includes(Views.MONTH) && <button type="button" className={view === Views.MONTH ? 'rbc-active' : ''} onClick={() => onView(Views.MONTH)}>Month</button>}
        </span>
      </div>
    );
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const response = await updateAppointmentStatus(appointmentId, newStatus);
      // Update the local events state to reflect the change
      setEvents(prevEvents => prevEvents.map(event =>
        event.id === appointmentId
          // The backend returns the full updated appointment, so its resource.status will be the new status
          ? { ...event, resource: { ...event.resource, status: response.data.status } }
          : event
      ));
      setHoveredEvent(null); // Close popover after action
      alert(`Appointment status updated to ${newStatus}.`); // Simple feedback
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`Failed to update status: ${err.response?.data?.message || 'Server error'}`);
    }
  };

  const EventWrapper = ({ event, children }) => {
    const handleMouseEnter = (e) => {
      let x = e.clientX + 15;
      let y = e.clientY + 15;
      if (calendarRef.current) {
        const calendarRect = calendarRef.current.getBoundingClientRect();
        if (x + 350 > calendarRect.right) x = e.clientX - 350 - 15;
        if (y + 300 > calendarRect.bottom) y = e.clientY - 300 - 15;
        if (x < calendarRect.left) x = calendarRect.left + 5;
        if (y < calendarRect.top) y = calendarRect.top + 5;
      } else {
        if (x + 350 > window.innerWidth) x = e.clientX - 350 - 15;
        if (y + 300 > window.innerHeight) y = e.clientY - 300 - 15;
        if (x < 0) x = 15;
        if (y < 0) y = 15;
      }
      setPopoverPosition({ x, y });
      setHoveredEvent(event);
    };
    const handleMouseLeave = () => {
      setHoveredEvent(null);
    };
    return React.cloneElement(React.Children.only(children), {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    });
  };

  return (
    <div className="stylist-dashboard section-container" ref={calendarRef}>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}
      <div className="calendar-container" style={{ height: 'calc(85vh - 50px)', position: 'relative' }}>
        {loading && <p style={{textAlign: 'center', paddingTop: '20px'}}>Loading appointments...</p>}
        {!loading && (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start" endAccessor="end" titleAccessor="title"
            style={{ height: '100%' }}
            views={allViews.filter(v => v !== Views.AGENDA)}
            view={currentView} date={currentDate}
            onNavigate={handleNavigate} onView={handleViewChange}
            eventPropGetter={eventStyleGetter}
            components={{ toolbar: CustomToolbar, eventWrapper: EventWrapper }}
          />
        )}
        {hoveredEvent && (
          <AppointmentHoverDetail
            event={hoveredEvent}
            position={popoverPosition}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
}

export default StylistDashboardPage;
