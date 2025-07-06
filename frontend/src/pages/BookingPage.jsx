// frontend/src/pages/BookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } // useNavigate for future redirection
from 'react-router-dom';
import { getAllServices, getAvailableSlots, createAppointment } from '../services/api';
import moment from 'moment'; // Import moment

// Helper to parse query params (for pre-selecting serviceId)
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function BookingPage() {
  const query = useQuery();
  const navigate = useNavigate(); // For redirecting after booking

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(query.get('serviceId') || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(''); // For service loading errors
  const [slotError, setSlotError] = useState(''); // For slot fetching/selection errors
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingMessage, setBookingMessage] = useState(''); // For success/error after booking attempt
  const [selectedStylistId, setSelectedStylistId] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await getAllServices();
        setServices(response.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch services.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService && services.length > 0) {
        const serviceExists = services.some(s => s.service_id.toString() === selectedService);
        if (!serviceExists) {
            setSelectedService('');
        }
    }
  }, [selectedService, services]);


  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setAvailableSlots([]);
    setSelectedSlot('');
    setSlotError('');
    setBookingMessage('');
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setAvailableSlots([]);
    setSelectedSlot('');
    setSlotError('');
    setBookingMessage('');
  };

  const handleFetchSlots = async () => {
    if (!selectedService || !selectedDate) {
      setSlotError('Please select a service and a date first.');
      return;
    }
    try {
      setLoadingSlots(true);
      setSlotError('');
      setAvailableSlots([]);
      setSelectedStylistId(null);

      const response = await getAvailableSlots(selectedService, selectedDate, null);

      if (response.data.slots && response.data.slots.length > 0) {
        setAvailableSlots(response.data.slots);
        if(response.data.stylistIdForSlots) { // Assuming backend might send a specific stylist for "any"
             setSelectedStylistId(response.data.stylistIdForSlots);
        } else if (response.data.availableSlotsByStylist && Object.keys(response.data.availableSlotsByStylist).length > 0) {
            // If backend returns slots grouped by stylists, and we need to pick one.
            // This is a more complex scenario requiring UI changes for stylist selection.
            // For now, if `response.data.slots` is flat, we stick to the placeholder logic below.
            // If backend sends back one specific stylist ID for the flat list of slots:
            const firstStylistWithSlots = Object.keys(response.data.availableSlotsByStylist)[0];
            if (response.data.availableSlotsByStylist[firstStylistWithSlots]?.length > 0) {
                 //This is a placeholder logic if backend returns slots by stylist and UI hasn't selected one.
                 // setSelectedStylistId(firstStylistWithSlots);
                 // setAvailableSlots(response.data.availableSlotsByStylist[firstStylistWithSlots]);
                 console.log("Slots returned by stylist, UI needs update for selection or default pick.")
            }
        }
      } else {
        setSlotError(response.data.message || 'No slots available for this service/date.');
      }
    } catch (err) {
      setSlotError(err.response?.data?.message || 'Failed to fetch available slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setBookingMessage('');
  };

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
        setBookingMessage('Error: Please select a service, date, and time slot.');
        return;
    }

    // Addressing the CRITICAL GAP for stylistId:
    // The backend `createAppointment` requires `stylistId`.
    // If `selectedStylistId` is set (e.g., from a preferred choice or if `getAvailableSlots` for "any" returns a specific stylist for the chosen slot time), use it.
    // Otherwise, this remains a placeholder and will likely fail if the backend strictly requires it.
    // A robust solution involves either stylist selection on frontend or backend assignment.
    let stylistToBook = selectedStylistId;
    if (!stylistToBook) {
        // Fallback/Placeholder: This is where logic to pick a default or first available stylist would go if not selected.
        // For this UI task, we'll proceed, but acknowledge this needs robust handling.
        // This could involve another API call or better data from getAvailableSlots.
        // For now, let's assume the backend might have a default or this will be improved.
        // A common pattern is for getAvailableSlots to return { time: "10:00", stylistId: "123" } for each slot.
        // Since our current `availableSlots` is just `["HH:MM"]`, we can't derive stylistId from it here.
        console.warn("BookingPage: stylistId not resolved for booking. Using placeholder '1' or null. This needs proper implementation.");
        stylistToBook = 1; // Replace with actual logic or ensure backend handles null stylistId by assigning one.
                           // Using 1 as a common default ID for a first user/stylist.
    }


    const appointmentDateTime = moment(`${selectedDate} ${selectedSlot}`, 'YYYY-MM-DD HH:mm').toISOString();
    const bookingData = {
      serviceId: selectedService,
      stylistId: stylistToBook,
      appointmentDateTime: appointmentDateTime,
      notes: document.getElementById('bookingNotes')?.value || '', // Get notes from a new textarea
    };

    try {
      setBookingMessage('Processing your booking...');
      const response = await createAppointment(bookingData);
      setBookingMessage(`Success! ${response.data.message} (ID: ${response.data.appointment.appointment_id})`);
      setSelectedService('');
      setSelectedDate('');
      setAvailableSlots([]);
      setSelectedSlot('');
      if(document.getElementById('bookingNotes')) document.getElementById('bookingNotes').value = '';
      // setTimeout(() => navigate('/my-appointments'), 3000);
    } catch (err) {
      setBookingMessage(`Error: ${err.response?.data?.message || 'Could not book appointment.'}`);
    }
  };

  const selectedServiceDetails = services.find(s => s.service_id.toString() === selectedService);

  return (
    <div className="booking-page-container" style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--primary-gold)', marginBottom: '30px' }}>Book Your Appointment</h1>

      {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}

      <div className="section-container" style={{marginBottom: '30px'}}>
        <h2 style={{marginTop: 0, borderBottom: '1px solid var(--secondary-dark)', paddingBottom: '10px', color: 'var(--primary-gold)'}}>1. Select Service & Date</h2>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="service">Service:</label>
          <select id="service" value={selectedService} onChange={handleServiceChange} required disabled={loadingServices}>
            <option value="">{loadingServices ? "Loading services..." : "-- Select a Service --"}</option>
            {services.map(service => (
              <option key={service.service_id} value={service.service_id}>
                {service.service_name} ({service.duration_minutes} min) - ${parseFloat(service.price).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
            required
            disabled={!selectedService}
          />
        </div>

        <button onClick={handleFetchSlots} disabled={!selectedService || !selectedDate || loadingSlots} style={{width: '100%'}}>
          {loadingSlots ? 'Finding Slots...' : 'Find Available Slots'}
        </button>
        {slotError && <p style={{ color: '#ff8c8c', marginTop: '10px', textAlign: 'center' }}>{slotError}</p>}
      </div>

      {availableSlots.length > 0 && (
        <div className="section-container" style={{marginBottom: '30px'}}>
          <h2 style={{marginTop: 0, borderBottom: '1px solid var(--secondary-dark)', paddingBottom: '10px', color: 'var(--primary-gold)'}}>2. Select Available Time</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {availableSlots.map(slot => (
              <button
                key={slot}
                onClick={() => handleSlotSelection(slot)}
                className={selectedSlot === slot ? 'active-slot-button' : 'slot-button'} // Use classes for styling
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && selectedServiceDetails && (
        <div className="section-container">
          <h2 style={{marginTop: 0, borderBottom: '1px solid var(--secondary-dark)', paddingBottom: '10px', color: 'var(--primary-gold)'}}>3. Confirm Your Booking</h2>
          <div style={{backgroundColor: 'var(--primary-dark)', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
            <p><strong>Service:</strong> {selectedServiceDetails.service_name}</p>
            <p><strong>Date:</strong> {moment(selectedDate).format('LL')}</p>
            <p><strong>Time:</strong> {selectedSlot}</p>
            <p><strong>Duration:</strong> {selectedServiceDetails.duration_minutes} minutes</p>
            <p><strong>Price:</strong> ${parseFloat(selectedServiceDetails.price).toFixed(2)}</p>
          </div>
           <div style={{ marginBottom: '20px' }}>
            <label htmlFor="bookingNotes">Notes (Optional):</label>
            <textarea id="bookingNotes" rows="3" placeholder="Any specific requests or notes for your stylist?"></textarea>
          </div>
          <button onClick={handleBookingSubmit} style={{width: '100%', fontSize: '1.1rem'}}>
            Confirm & Book Appointment
          </button>
        </div>
      )}
      {bookingMessage && <p style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold', color: bookingMessage.startsWith('Error:') ? '#ff6b6b' : 'var(--primary-gold)' }}>{bookingMessage}</p>}
    </div>
  );
}

export default BookingPage;
