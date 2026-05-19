import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

const Enable2FA = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEnable2FA = async () => {
        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) {
                setError("You must be logged in to enable 2FA.");
                return;
            }
            const { data } = await axios.get(`${BACKEND_URL}/api/admin/2fa/setup`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            setQrCodeUrl(data.qrCodeUrl);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to set up 2FA. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) {
                setError("You must be logged in to verify 2FA.");
                return;
            }
            const { data } = await axios.post(`${BACKEND_URL}/api/admin/2fa/verify`, {
                token,
                // The backend should get the userId from the auth token
            }, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            setSuccess(data.message);
            setQrCodeUrl(''); // Hide QR code after successful verification
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid 2FA token. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Enable Two-Factor Authentication</h2>
            {!qrCodeUrl && (
                <button onClick={handleEnable2FA} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                    Enable 2FA
                </button>
            )}

            {qrCodeUrl && (
                <div>
                    <p>Scan this QR code with your authenticator app (e.g., Google Authenticator).</p>
                    <img src={qrCodeUrl} alt="2FA QR Code" />
                    <form onSubmit={handleSubmit}>
                        <div style={{ margin: '15px 0' }}>
                            <label htmlFor="token">Enter the 6-digit code from your app:</label>
                            <input
                                type="text"
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                maxLength="6"
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '5px' }}
                            />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
                            Verify & Activate
                        </button>
                    </form>
                </div>
            )}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}
        </div>
    );
};

export default Enable2FA;
