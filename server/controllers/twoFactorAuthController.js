const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const setup2FA = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA is already enabled' });
        }

        const secret = speakeasy.generateSecret({
            name: `Food-Ordering-System (${user.email})`,
        });

        user.twoFactorSecret = secret.base32;
        await user.save();

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return res.status(500).json({ message: 'Error generating QR code' });
            }
            res.json({
                message: '2FA setup initiated',
                secret: secret.base32,
                qrCodeUrl: data_url,
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const verify2FA = async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
        });

        if (verified) {
            if (!user.twoFactorEnabled) {
                user.twoFactorEnabled = true;
                await user.save();
            }
            const authToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });
            res.json({ message: '2FA verification successful', token: authToken });
        } else {
            res.status(400).json({ message: 'Invalid 2FA token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    setup2FA,
    verify2FA,
};
