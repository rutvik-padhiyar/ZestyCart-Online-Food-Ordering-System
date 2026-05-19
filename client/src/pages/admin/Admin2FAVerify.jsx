import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

const Admin2FAVerify = () => {
    const [token, setToken] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId;

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }

        const setup2FA = async () => {
            try {
                // We need to get the auth token from somewhere to make this request
                // For now, let's assume the user is already authenticated somehow
                // to be able to set up 2FA. This is a tricky part of the flow.
                // In a real app, you might have a temporary token or other mechanism.
                const authToken = localStorage.getItem('token');
                if (!authToken) {
                    setError('Authentication token not found. Please log in again.');
                    navigate('/login');
                    return;
                }
                // The backend might need the userId to know for whom to set up 2FA.
                // We pass it as a query parameter in the GET request.
                const { data } = await axios.get(`${BACKEND_URL}/api/admin/2fa/setup`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                    params: { userId }
                });
                setQrCodeUrl(data.qrCodeUrl);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to set up 2FA. Please try again.');
            }
        };

        // This logic is a bit tricky. If the user has 2FA enabled, we just show the input.
        // If they don't, we need to set it up. The backend login response should tell us this.
        // For simplicity, we'll assume the login response tells us if setup is needed.
        // Let's say if location.state.setup2FA is true, we run setup.
        if (location.state?.setup2FA) {
            setup2FA();
        }
    }, [userId, navigate, location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const tempAuthToken = localStorage.getItem('token');
            const { data } = await axios.post(`${BACKEND_URL}/api/admin/2fa/verify`, {
                userId,
                token,
            }, {
                headers: { Authorization: `Bearer ${tempAuthToken}` }
            });

            // Assuming the server returns a new token for the authenticated session
            localStorage.setItem('token', data.token);
            // Notify other parts of the app (like Navbar) that login is complete
            window.dispatchEvent(new Event("loginSuccess"));
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid 2FA token. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Admin 2FA Verification</h2>
            {qrCodeUrl && (
                <div>
                    <p>Please scan this QR code with your authenticator app and enter the token below.</p>
                    <img src={qrCodeUrl} alt="2FA QR Code" />
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="token">6-Digit Token</label>
                    <input
                        type="text"
                        id="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        maxLength="6"
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                    Verify
                </button>
            </form>
        </div>
    );
};

export default Admin2FAVerify;
