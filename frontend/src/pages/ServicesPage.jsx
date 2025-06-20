// frontend/src/pages/ServicesPage.jsx
import React, { useEffect, useState } from 'react';
import { getAllServices } from '../services/api'; // Named import
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

  if (loading) {
    return <p>Loading services...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (services.length === 0) {
    return <p>No services available at the moment.</p>;
  }

  return (
    <div>
      <h2>Our Services</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {services.map(service => (
          <ServiceCard key={service.service_id} service={service} />
        ))}
      </div>
    </div>
  );
}

export default ServicesPage;
