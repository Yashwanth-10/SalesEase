import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './SignupPage.css';

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        if (!agree) {
            setError('You must agree to the terms and conditions.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('http://localhost:5000/signup', {
                name,
                email,
                password,
            });

            if (response.status === 201) {
                setSuccess('Signup successful! You can now log in.');
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setAgree(false);

                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (err) {
            console.error('Error during signup:', err);
            const backendError = err.response?.data?.message || 'Signup failed. Please try again.';
            setError(backendError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <p style={{ color: 'red' }} aria-live="assertive">{error}</p>}
            {success && <p style={{ color: 'green' }} aria-live="assertive">{success}</p>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group password-container">
                    <label>Password:</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <span
                        className="password-toggle-icon"
                        onClick={() => setShowPassword((prev) => !prev)}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                </div>
                <div className="input-group password-container">
                    <label>Confirm Password:</label>
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <span
                        className="password-toggle-icon"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                    </span>
                </div>
                <div>
                    <input
                        type="checkbox"
                        checked={agree}
                        onChange={() => setAgree(!agree)}
                    />
                    <label>I agree to the Terms and Conditions</label>
                </div>
                <button type="submit" disabled={!agree || loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <p>
                Already have an account? <Link to="/">Log In</Link>
            </p>
        </div>
    );
};

export default SignupPage;
