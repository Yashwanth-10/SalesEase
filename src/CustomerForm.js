import React, { useState } from 'react';
import axios from 'axios';
import './CustomerForm.css';

const CustomerInfoForm = () => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [location, setLocation] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // Loading state

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading state to true
        setMessage(''); // Clear any previous messages

        // Validate email format
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // General email regex
        if (!emailPattern.test(email)) {
            setMessage('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        // Validate age
        const ageNumber = Number(age);
        if (isNaN(ageNumber) || ageNumber <= 0) {
            setMessage('Please enter a valid age.');
            setLoading(false);
            return;
        }

        const customerData = {
            name,
            age: ageNumber, // Convert to number
            businessType,
            location,
            email,
        };

        const token = localStorage.getItem('authToken');
        console.log('Token retrieved:', token); // Adjust if using a different method

        try {
            const response = await axios.post('http://localhost:5000/collect-customer-info', customerData, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the headers
                },
            });
            setMessage(response.data.message || 'Customer information submitted successfully!');
            // Clear form fields
            setName('');
            setAge('');
            setBusinessType('');
            setLocation('');
            setEmail('');

            // Clear message after 5 seconds
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            console.error('Error collecting customer info:', error);
            const errorMessage = error.response?.data?.message || 'Network error occurred. Please try again later.';
            setMessage(errorMessage);
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <div>
            <h2>Customer Information Form</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="age">Age:</label>
                    <input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="1" // Ensure valid age
                        required
                    />
                </div>
                <div>
                    <label htmlFor="businessType">Type of Business:</label>
                    <input
                        id="businessType"
                        type="text"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="location">Location:</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>
            {message && <p className={loading ? "loading-message" : "error-message"}>{message}</p>}
        </div>
    );
};

export default CustomerInfoForm;
