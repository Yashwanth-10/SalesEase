import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage'; // Adjust the path as needed
import SignupPage from './SignupPage'; // Adjust the path as needed
import CustomerForm from './CustomerForm'; // Import CustomerForm
import AdminDashboard from './AdminDashboard';
import IncomingEmails from './incomingEmail'; // Import incomingEmails
import AcceptRequestPage from './AcceptRequestPage'; // Import AcceptRequestPage
import ConfirmationPage from './ConfirmationPage'; // Import ConfirmationPage

import './App.css';

const App = () => {
    return (
        <Router>
            <div>
                <h1>SALES EASE</h1>
                <Routes>
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/customerform" element={<CustomerForm />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/incoming-emails" element={<IncomingEmails />} />
                    <Route path="/accept" element={<AcceptRequestPage />} />
                    <Route path="/confirm-interest/:customerId" element={<ConfirmationPage />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
