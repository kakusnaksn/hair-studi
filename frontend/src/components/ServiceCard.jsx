// frontend/src/components/ServiceCard.jsx
import React from 'react';

function ServiceCard({ service }) {
  if (!service) {
    return null;
  }

  return (
    <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px', borderRadius: '5px' }}>
      <h3>{service.service_name}</h3>
      <p>{service.description || 'No description available.'}</p>
      <p><strong>Duration:</strong> {service.duration_minutes} minutes</p>
      <p><strong>Price:</strong> ${parseFloat(service.price).toFixed(2)}</p>
      {/* Add a "Book Now" button later, which could navigate to the booking page with service_id */}
    </div>
  );
}

export default ServiceCard;
