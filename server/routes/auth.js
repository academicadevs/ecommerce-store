import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLog.js';
import { sendPasswordResetEmail } from '../utils/sendgrid.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType, contactName, positionTitle, department, schoolName, principalName, phone, address, school_id, supervisor, office_id } = req.body;

    // Validation
    if (!email || !contactName || !userType) {
      return res.status(400).json({
        error: 'Email, name, and account type are required'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate based on user type - school_id is required for school staff
    if (userType === 'school_staff') {
      if (!school_id) {
        return res.status(400).json({ error: 'School selection is required for school staff' });
      }
    }

    // Validate based on user type - office_id is required for academica employees
    if (userType === 'academica_employee') {
      if (!office_id) {
        return res.status(400).json({ error: 'Office selection is required for Academica employees' });
      }
    }

    // Check if user exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      userType,
      contactName,
      positionTitle,
      department,
      schoolName,
      principalName,
      phone,
      address,
      school_id,
      supervisor,
      office_id
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    logAudit(req, { action: 'auth.register', category: 'auth', targetId: user.id, targetType: 'user', details: { email, userType, contactName, schoolName, department, positionTitle } });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        contactName: user.contactName,
        positionTitle: user.positionTitle,
        department: user.department,
        schoolName: user.schoolName,
        principalName: user.principalName,
        phone: user.phone,
        address: user.address,
        school_id: user.school_id,
        supervisor: user.supervisor,
        office_id: user.office_id,
        role: user.role,
        passwordNeedsUpdate: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check user status before password validation
    if (user.status === 'deleted') {
      // Don't reveal that account existed
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const isValid = await User.validatePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check user status after password validation (for informative messages)
    if (user.status === 'archived') {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact an administrator.',
        code: 'ACCOUNT_ARCHIVED'
      });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({
        error: user.block_reason || 'Your account has been blocked.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    logAudit({ user, ip: req.ip, connection: req.connection }, { action: 'auth.login', category: 'auth', targetId: user.id, targetType: 'user', details: { email, contactName: user.contactName, userType: user.userType } });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType || 'school_staff',
        contactName: user.contactName,
        positionTitle: user.positionTitle,
        department: user.department,
        schoolName: user.schoolName,
        principalName: user.principalName,
        phone: user.phone,
        address: user.address,
        school_id: user.school_id,
        supervisor: user.supervisor,
        office_id: user.office_id,
        role: user.role,
        passwordNeedsUpdate: !!user.password_needs_update
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const { password, password_reset_token, password_reset_expires, block_reason, ...user } = req.user;
  user.passwordNeedsUpdate = !!user.password_needs_update;
  res.json({ user });
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { contactName, positionTitle, department, schoolName, principalName, phone, address } = req.body;
    const userId = req.user.id;

    const stmt = (await import('../utils/database.js')).default.prepare(`
      UPDATE users SET contactName = ?, positionTitle = ?, department = ?, schoolName = ?, principalName = ?, phone = ?, address = ?
      WHERE id = ?
    `);

    stmt.run(contactName, positionTitle, department, schoolName, principalName, phone, address, userId);

    const updatedUser = User.findById(userId);
    const { password, password_reset_token, password_reset_expires, ...user } = updatedUser;
    user.passwordNeedsUpdate = !!user.password_needs_update;

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password (authenticated)
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // If password_needs_update is true, skip currentPassword check (user just authenticated)
    if (!req.user.password_needs_update) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const isValid = await User.validatePassword(currentPassword, req.user.password);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    await User.updatePassword(userId, newPassword);

    logAudit(req, { action: 'auth.password_change', category: 'auth', targetId: userId, targetType: 'user', details: { email: req.user.email } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password (unauthenticated)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return same success message to prevent email enumeration
    const successMessage = 'If an account exists with that email, a password reset link has been sent.';

    const user = User.findByEmail(email);
    if (!user) {
      return res.json({ message: successMessage });
    }

    // Generate 32-byte random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    User.setPasswordResetToken(user.id, hashedToken, expiresAt);

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Send email
    const firstName = (user.contactName || 'User').split(' ')[0];
    await sendPasswordResetEmail({ to: email, contactName: firstName, resetUrl });

    logAudit(req, { action: 'auth.forgot_password', category: 'auth', targetId: user.id, targetType: 'user', details: { email } });

    res.json({ message: successMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password (unauthenticated)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash provided token and look up
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = User.findByResetToken(hashedToken);

    if (!user || user.email !== email) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    // Update password and clear token
    await User.updatePassword(user.id, newPassword);
    User.clearResetToken(user.id);

    logAudit(req, { action: 'auth.password_reset', category: 'auth', targetId: user.id, targetType: 'user', details: { email } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
