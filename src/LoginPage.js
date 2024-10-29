import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // New state for password visibility toggle
    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = localStorage.getItem('rememberedEmail');
        if (storedEmail) {
            setEmail(storedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await axios.post('http://localhost:5000/login', { email, password });
            if (response.status === 200) {
                setSuccessMessage('Login successful!');
                setTimeout(() => setSuccessMessage(''), 3000);

                const token = response.data.token;
                localStorage.setItem('authToken', token);

                const role = response.data.role;

                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                if (role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/CustomerForm');
                }
            } else {
                setErrorMessage('Login failed!');
            }
        } catch (error) {
            if (error.response) {
                setErrorMessage(error.response.data.error || 'Error logging in');
            } else {
                setErrorMessage('Network error, please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to Your Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="input-group password-container">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                    <span
                        className="password-toggle-icon"
                        onClick={() => setShowPassword((prev) => !prev)}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                </div>
                <div className="remember-me">
                    <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember">Remember Me</label>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            {errorMessage && <p className="errorMessage">{errorMessage}</p>}
            {successMessage && <p className="successMessage">{successMessage}</p>}

            <p className="forgot-password">
                <a href="/forgot-password">Forgot Password?</a>
            </p>
            <p className="signup-link">
                Don't have an account? <a href="/signup">Sign Up</a>
            </p>
        </div>
    );
};

export default LoginPage;
