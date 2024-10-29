import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './incomingEmail.css';


const IncomingEmails = () => {
    const [emails, setEmails] = useState([]);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const response = await axios.get('/incoming-emails');
                setEmails(response.data);
            } catch (error) {
                console.error('Error fetching emails:', error);
            }
        };

        fetchEmails();
    }, []);

    return (
        <div>
            <h1>Incoming Emails</h1>
            <ul>
                {emails.map((email, index) => (
                    <li key={index}>
                        <strong>From:</strong> {email.sender} <br />
                        <strong>Subject:</strong> {email.subject} <br />
                        <strong>Body:</strong> {email.body}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default IncomingEmails;
