// frontend/src/components/AppointmentHoverDetail.jsx
import React from 'react';

function AppointmentHoverDetail({ event, position, onUpdateStatus }) { // event prop now, not just details
  if (!event || !event.resource) return null; // Use event.resource for details

  const details = event.resource;
  const appointmentId = event.id; // Assuming event.id is the appointment_id

  const style = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    backgroundColor: 'var(--primary-dark)',
    border: `1px solid var(--primary-gold)`,
    borderRadius: '8px',
    padding: '15px',
    zIndex: 1000,
    minWidth: '280px', // Adjusted minWidth
    maxWidth: '400px', // Adjusted maxWidth
    boxShadow: '0px 5px 15px rgba(0,0,0,0.5)',
    color: 'var(--text-primary)',
    fontSize: '0.9em',
  };

  // Determine if the appointment start time is in the past or current
  const appointmentStartTime = new Date(event.start);
  const now = new Date();
  // Allow updates if the appointment has started or is in the past.
  // For "no-show", typically it's marked if current time is past appointment start.
  // For "completed", it's marked after the service is done (i.e., past appointment end).
  // Let's use a simpler logic for now: enable if current time is past appointment start time.
  const isPastAppointmentStart = now >= appointmentStartTime;

  // Status can be updated if it's currently 'booked' and the appointment time has started/passed.
  const canUpdateStatus = details.status === 'booked' && isPastAppointmentStart;


  return (
    <div style={style}>
      <h4>{details.service?.name || 'Service Details'}</h4>
      <p><strong>Customer:</strong> {details.customer?.fullName || 'N/A'}</p>
      {details.customer?.phone && <p><strong>Phone:</strong> {details.customer.phone}</p>}
      {details.customer?.email && <p><strong>Email:</strong> {details.customer.email}</p>}
      <hr style={{borderColor: 'var(--secondary-dark)'}}/>
      <p><strong>Service Description:</strong> {details.service?.description || 'No description.'}</p>
      <p><strong>Duration:</strong> {details.service?.duration || 'N/A'} minutes</p>
      <p><strong>Price:</strong> ${parseFloat(details.service?.price || 0).toFixed(2)}</p>
      <p><strong>Status:</strong> <span style={{textTransform: 'capitalize', fontWeight: 'bold'}}>{details.status || 'N/A'}</span></p>
      {details.notes && (
        <>
          <hr style={{borderColor: 'var(--secondary-dark)'}}/>
          <p><strong>Customer Notes:</strong></p>
          <p style={{whiteSpace: 'pre-wrap'}}>{details.notes}</p>
        </>
      )}

      {/* Action Buttons */}
      {/* Show actions if status is 'booked'. Other statuses are considered final from stylist's POV here. */}
      {(details.status === 'booked') && (
        <>
          <hr style={{borderColor: 'var(--secondary-dark)', marginTop: '10px', marginBottom: '10px'}}/>
          <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '10px'}}>
            <button
              onClick={() => onUpdateStatus(appointmentId, 'completed')}
              disabled={!canUpdateStatus} // Enable only if appointment time has passed/started
              title={!isPastAppointmentStart ? "Can only mark as completed after appointment time has started" : ""}
            >
              Mark Completed
            </button>
            <button
              onClick={() => onUpdateStatus(appointmentId, 'no-show')}
              disabled={!canUpdateStatus} // Enable only if appointment time has passed/started
              style={{backgroundColor: '#f0ad4e'}} // Example: Orange for no-show
              title={!isPastAppointmentStart ? "Can only mark as no-show after appointment time has started" : ""}
            >
              Mark No-Show
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AppointmentHoverDetail;
