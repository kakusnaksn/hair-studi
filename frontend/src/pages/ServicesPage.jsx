// frontend/src/pages/ServicesPage.jsx
import React, { useEffect, useState } from 'react';
import { getAllServices } from '../services/api';
import ServiceCard from '../components/ServiceCard';

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getAllServices();
        setServices(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch services.');
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const pageTitleStyle = {
    textAlign: 'center',
    // fontSize: '2.5rem', // Uses h1 global style by default from index.css
    // color: 'var(--primary-gold)', // Uses h1 global style
    marginBottom: '40px', // More space below title
  };

  const servicesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive grid
    gap: '30px', // Gap between cards
    padding: '0 20px', // Padding for the grid container
    maxWidth: '1200px', // Max width for the grid
    margin: '0 auto', // Center the grid
  };

  const messageStyle = {
    textAlign: 'center',
    fontSize: '1.2rem',
    marginTop: '50px',
    // color will be inherited from body (var(--text-primary))
  };

  const errorMsgStyle = {
      ...messageStyle, // Inherit base message styles
      color: '#ff6b6b', // Specific error color, stands out on dark theme
  };


  if (loading) {
    return <p style={messageStyle}>Loading services...</p>;
  }

  if (error) {
    return <p style={errorMsgStyle}>Error: {error}</p>;
  }

  if (services.length === 0) {
    return <p style={messageStyle}>No services available at the moment.</p>;
  }

  return (
    <div className="services-page-container" style={{padding: '20px 0'}}> {/* Overall page padding */}
      <h1 style={pageTitleStyle}>Our Services</h1>
      <div style={servicesGridStyle}>
        {services.map(service => (
          <ServiceCard key={service.service_id} service={service} />
        ))}
      </div>
    </div>
  );
}

export default ServicesPage;
