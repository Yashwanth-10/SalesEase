import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForms, setUserForms] = useState([]);
    const [loadingForms, setLoadingForms] = useState(false); // Loading state for user forms

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true); // Start loading state
            setError(''); // Reset error state
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('No token found. Please log in again.');
                    return;
                }

                console.log('Token:', token);
                const response = await axios.get('http://localhost:5000/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
                setError(error.response?.data?.message || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUserClick = async (userId) => {
        setLoadingForms(true); // Start loading forms
        setError(''); // Reset error state
        try {
            const token = localStorage.getItem('authToken'); // Ensure you are using the correct token
            const response = await axios.get(`http://localhost:5000/admin/users/${userId}/customers`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUserForms(response.data);
            setSelectedUser(userId);
        } catch (error) {
            console.error('Error fetching user forms:', error);
            setError(error.response?.data?.message || 'Failed to fetch user forms');
        } finally {
            setLoadingForms(false); // Stop loading forms
        }
    };

    const handleInterestSubmit = async (customerId) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.patch(`http://localhost:5000/customers/${customerId}/interest`, {
                interested: true, // Set as true when the user expresses interest
            }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            // Refresh the user forms after submission
            handleUserClick(selectedUser); // Reload the forms for the selected user

            alert('Thank you for your interest!'); // Show a success message
        } catch (error) {
            console.error('Error submitting interest:', error);
            alert('Failed to submit interest. Please try again.'); // Show an error message
        }
    };

    if (loading) {
        return <div>Loading users...</div>; // You could replace this with a spinner
    }

    if (error) {
        return (
            <div className="error-message">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button> {/* Retry button */}
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <h3>Total Sales People: {users.length}</h3>
            {users.length === 0 ? (
                <p>No users found.</p> // Message when no users
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Forms Collected</th> {/* Show count of forms collected */}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr 
                                key={user._id} 
                                onClick={() => handleUserClick(user._id)}
                                style={{ backgroundColor: selectedUser === user._id ? '#f0f0f0' : 'transparent' }} // Highlight selected user
                                role="button"
                                tabIndex={0} // For accessibility
                                onKeyPress={(e) => e.key === 'Enter' && handleUserClick(user._id)} // Handle Enter key for accessibility
                            >
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.customerCount}</td> {/* Display the number of forms collected */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {selectedUser && (
                <div>
                    <h3>Forms Collected by This Sales Person</h3>
                    {loadingForms ? (
                        <div>Loading user forms...</div>
                    ) : userForms.length === 0 ? (
                        <p>No forms collected by this user.</p> // Message if no forms
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Business Type</th>
                                    <th>Location</th>
                                    <th>Email</th>
                                    <th>Interested</th> {/* New column for interest status */}
                                    <th>Action</th> {/* Column for the action button */}
                                </tr>
                            </thead>
                            <tbody>
                                {userForms.map((form) => (
                                    <tr key={form._id}>
                                        <td>{form.name || 'N/A'}</td>
                                        <td>{form.age || 'N/A'}</td>
                                        <td>{form.businessType || 'N/A'}</td>
                                        <td>{form.location || 'N/A'}</td>
                                        <td>{form.email || 'N/A'}</td>
                                        <td>{form.interested ? 'Yes' : 'No'}</td> {/* Display interest status */}
                                        <td>
                                            {!form.interested && (
                                                <button onClick={() => handleInterestSubmit(form._id)}>Submit Interest</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
