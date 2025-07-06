// frontend/src/components/ServiceCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Assuming 'Book Now' links to a booking page

// It's good practice to define styles that might be reused or are complex in CSS,
// but for self-contained component redesign, inline/object styles are fine for this subtask.

function ServiceCard({ service }) {
  if (!service) {
    return null;
  }

  const cardStyle = {
    backgroundColor: 'var(--secondary-dark)',
    color: 'var(--text-primary)',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Enhanced shadow for depth
    margin: '15px', // This margin might be better handled by the grid gap on ServicesPage
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    // transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out', // Moved to CSS class
    // minWidth: '280px', // Or control via grid/flex parent
    // maxWidth: '350px',
  };

  // Hover effect will be handled by .service-card-hover class in index.css

  const serviceNameStyle = {
    fontFamily: 'var(--font-headings)',
    color: 'var(--primary-gold)',
    fontSize: '1.5rem', // Adjusted size
    marginBottom: '10px',
  };

  const detailTextStyle = {
    fontSize: '0.95rem',
    marginBottom: '8px',
    color: 'var(--text-secondary)', // Lighter text for details
    minHeight: '4.5em', // Approximate height for 3 lines of text to help align cards
    overflow: 'hidden', // Prevent long descriptions from breaking layout
    textOverflow: 'ellipsis', // Add ellipsis for overflow
    display: '-webkit-box',
    WebkitLineClamp: 3, // Limit to 3 lines
    WebkitBoxOrient: 'vertical',
  };

  const priceDurationContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    borderTop: '1px solid #444', // Separator
    paddingTop: '15px',
  };

  const priceStyle = {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--primary-gold)',
  };

  // bookButtonStyle is not strictly needed here if className handles all styling
  const bookLinkContainerStyle = {
    marginTop: '20px',
    textAlign: 'center', // Center the link/button
  };


  return (
    <div style={cardStyle}
         className="service-card-hover"
    >
      <div> {/* Content wrapper for spacing */}
        <h3 style={serviceNameStyle}>{service.service_name}</h3>
        <p style={detailTextStyle} title={service.description || ''}>{service.description || 'No description available.'}</p>
      </div>

      <div style={priceDurationContainerStyle}>
        <span style={{...detailTextStyle, minHeight: 'auto', WebkitLineClamp: 'initial' }}>Duration: {service.duration_minutes} min</span> {/* Override line clamp for duration */}
        <span style={priceStyle}>${parseFloat(service.price).toFixed(2)}</span>
      </div>

      <div style={bookLinkContainerStyle}>
        <Link
          to={`/book-appointment?serviceId=${service.service_id}`}
          className="button-as-link"
        >
          Book This Service
        </Link>
      </div>
    </div>
  );
}

export default ServiceCard;
