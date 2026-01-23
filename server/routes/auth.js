import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, address, school_id, supervisor, office_id } = req.body;

    // Staff users use middle name as password
    const isStaffUser = userType === 'school_staff' || userType === 'academica_employee';

    // Validation
    if (!email || !contactName || !userType) {
      return res.status(400).json({
        error: 'Email, name, and account type are required'
      });
    }

    // For staff users, require middle name; for admin users, require password
    if (isStaffUser) {
      if (!middleName || middleName.trim().length < 2) {
        return res.status(400).json({ error: 'Middle name is required and must be at least 2 characters' });
      }
    } else {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
    }

    // Validate based on user type - school_id is required for school staff
    if (userType === 'school_staff') {
      if (!school_id) {
        return res.status(400).json({ error: 'School selection is required for school staff' });
      }
      if (!supervisor || !supervisor.trim()) {
        return res.status(400).json({ error: 'Supervisor name is required for school staff' });
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
      middleName,
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

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        contactName: user.contactName,
        middleName: user.middleName,
        positionTitle: user.positionTitle,
        department: user.department,
        schoolName: user.schoolName,
        principalName: user.principalName,
        phone: user.phone,
        address: user.address,
        school_id: user.school_id,
        supervisor: user.supervisor,
        office_id: user.office_id,
        role: user.role
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

    // Validate password
    const isValid = await User.validatePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

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
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const { password, ...user } = req.user;
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
    const { password, ...user } = updatedUser;

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
