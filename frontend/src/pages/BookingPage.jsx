// frontend/src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { getAllServices, getAvailableSlots } from '../services/api'; // Adjust imports as needed
// import { useNavigate } from 'react-router-dom'; // For later navigation

function BookingPage() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  // const [selectedStylist, setSelectedStylist] = useState(''); // Optional: for future stylist selection
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [slotError, setSlotError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  // const navigate = useNavigate(); // For later redirection after booking

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await getAllServices();
        setServices(response.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch services.');
        console.error("Error fetching services:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setAvailableSlots([]); // Reset slots when date changes
    setSelectedSlot('');
    setSlotError('');
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setAvailableSlots([]); // Reset slots when service changes
    setSelectedSlot('');
    setSlotError('');
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
      // For now, not passing stylistId (null)
      const response = await getAvailableSlots(selectedService, selectedDate, null);
      if (response.data.slots && response.data.slots.length > 0) {
        setAvailableSlots(response.data.slots);
      } else {
        setSlotError(response.data.message || 'No slots available for this service/date.');
      }
    } catch (err) {
      setSlotError(err.response?.data?.message || 'Failed to fetch available slots.');
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    // Here you could proceed to a confirmation step or enable a "Book Now" button
    console.log(`Service ID: ${selectedService}, Date: ${selectedDate}, Slot: ${slot}`);
  };

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
        alert("Please select a service, date, and time slot.");
        return;
    }
    // This is where you would call createAppointment (from next step)
    alert(`Booking attempt: Service ${selectedService}, Date ${selectedDate}, Time ${selectedSlot}. Next step: Implement actual booking POST request.`);
    // Example:
    // try {
    //   const bookingData = { serviceId: selectedService, date: selectedDate, time: selectedSlot, /* stylistId if applicable */ };
    //   const response = await createAppointment(bookingData);
    //   alert('Booking successful! ' + response.data.message);
    //   navigate('/my-appointments'); // Or some confirmation page
    // } catch (err) {
    //   alert('Booking failed: ' + (err.response?.data?.message || 'Server error'));
    // }
  };


  if (loadingServices) return <p>Loading services...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Book an Appointment</h2>

      <div>
        <label htmlFor="service">Select Service:</label>
        <select id="service" value={selectedService} onChange={handleServiceChange} required>
          <option value="">-- Select a Service --</option>
          {services.map(service => (
            <option key={service.service_id} value={service.service_id}>
              {service.service_name} ({service.duration_minutes} min) - ${parseFloat(service.price).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date">Select Date:</label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
          required
        />
      </div>

      {/* Optional: Stylist selection can be added here later */}
      {/* <div>
        <label htmlFor="stylist">Select Stylist (Optional):</label>
        <select id="stylist" value={selectedStylist} onChange={(e) => setSelectedStylist(e.target.value)}>
          <option value="">Any Available</option>
          {stylists.map(stylist => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
        </select>
      </div> */}

      <button onClick={handleFetchSlots} disabled={!selectedService || !selectedDate || loadingSlots}>
        {loadingSlots ? 'Fetching Slots...' : 'Find Available Slots'}
      </button>

      {slotError && <p style={{ color: 'red' }}>{slotError}</p>}

      {availableSlots.length > 0 && (
        <div>
          <h3>Available Slots for {selectedDate}:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {availableSlots.map(slot => (
              <button
                key={slot}
                onClick={() => handleSlotSelection(slot)}
                style={{ margin: '5px', padding: '10px', backgroundColor: selectedSlot === slot ? 'lightblue' : 'white' }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && (
        <div>
          <h4>Confirm Booking:</h4>
          <p>Service: {services.find(s => s.service_id.toString() === selectedService)?.service_name}</p>
          <p>Date: {selectedDate}</p>
          <p>Time: {selectedSlot}</p>
          <button onClick={handleBookingSubmit}>Confirm & Book Appointment</button>
        </div>
      )}
    </div>
  );
}

export default BookingPage;
