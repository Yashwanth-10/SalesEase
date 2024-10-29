import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ConfirmationPage = () => {
    const { customerId } = useParams(); // Get the customerId from the URL
    const navigate = useNavigate(); // For navigation after confirmation
    const [customerData, setCustomerData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Loading state

    // Fetch customer data based on customerId
    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Authorization token is missing.'); // Check for token
                }

                console.log('Token:', token); // Ensure token is available
                const response = await axios.get(`http://localhost:5000/customers/${customerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setCustomerData(response.data);
            } catch (error) {
                console.error('Error fetching customer data:', error.response ? error.response.data : error.message);
                setError('Error fetching customer data. Please check the console for more details.');
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        fetchCustomerData();
    }, [customerId]);

    // Handle interest confirmation
    const handleInterest = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authorization token is missing.');
            }
        
            const response = await axios.patch(`http://localhost:5000/customers/${customerId}/interest`, 
                { interested: true }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            console.log('Interest updated:', response.data); // Log successful response
            alert('Your interest has been recorded!');
            navigate('/'); // Redirect after confirmation
        } catch (error) {
            console.error('Error updating interest:', error.response ? error.response.data : error.message);
            setError('Could not update your interest status.'); // Set error message
        }        
    };

    // Show error message
    if (error) {
        return <div>{error}</div>;
    }

    // Show loading state
    if (loading) {
        return <div>Loading...</div>; // You can replace this with a spinner if you have one
    }

    // Show customer data
    return (
        <div>
            <h2>Thank you!</h2>
            <p>We're glad you're interested in working with us, {customerData.name}!</p>
            <button onClick={handleInterest}>Yes, I'm Interested!</button> {/* Interest confirmation button */}
        </div>
    );
};

export default ConfirmationPage;
