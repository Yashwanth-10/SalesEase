import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './AcceptRequestPage.css'; // Import the CSS file
import axios from 'axios'; // Import axios for API calls

const AcceptRequestPage = () => {
    const location = useLocation();
    const [customerId, setCustomerId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('customerId');
        setCustomerId(id);
        console.log('Customer ID:', id);
    }, [location]);

    const handleAccept = async () => {
        if (!customerId) return;

        try {
            const response = await axios.post('/accept-email', { customerId });
            setSuccess(response.data.message);
            setError(null);
        } catch (err) {
            console.error('Error accepting the request:', err);
            setError('Failed to accept the request. Please try again later.');
            setSuccess(null);
        }
    };

    return (
        <div className="acceptance-container">
            <h1 className="acceptance-header">Acceptance Page</h1>
            <p className="acceptance-message">Thank you for your response! Please confirm your acceptance.</p>
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
            <button className="accept-button" onClick={handleAccept}>
                Accept
            </button>
        </div>
    );
};

export default AcceptRequestPage;
