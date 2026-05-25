const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult, body } = require('express-validator');
const User = require('../models/user');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Register user with validation
const register = [
  body('username').trim().isLength({ min: 3, max: 20 }),
  body('fullname').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { username, fullname, email, password } = req.body;

    try {
      // Validate password separately (don't apply escape to password)
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }

      const user = await User.create({ username, fullname, email, password });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          _id: user._id,
          username: user.username,
          fullname: user.fullname,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
  }
];

// Login user with validation
const login = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Validate password exists
      if (!password || password.trim() === '') {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'No account found with this email' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }

      const token = generateToken(user._id);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
  }
];

// Logout user
const logout = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
};

// Get user details
const getuserdetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { fullname, username, email } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!fullname || !username) {
      return res.status(400).json({ success: false, message: 'Fullname and username are required' });
    }

    // Check if username already exists (excluding current user)
    const existingUser = await User.findOne({
      username: username,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Prepare update data
    const updateData = {
      fullname: fullname.trim(),
      username: username.trim()
    };

    // Handle profile image if uploaded
    if (req.file) {
      console.log('File uploaded:', req.file);
      const profileImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      console.log('Profile image URL:', profileImageUrl);
      updateData.profileImageUrl = profileImageUrl;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('Updated user:', user);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        profileImageUrl: user.profileImageUrl
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    // Trim passwords
    const trimmedNewPassword = newPassword.trim();
    const trimmedCurrentPassword = currentPassword.trim();

    // Validate new password
    if (trimmedNewPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    if (!/[a-z]/.test(trimmedNewPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter' });
    }

    if (!/[A-Z]/.test(trimmedNewPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter' });
    }

    if (!/\d/.test(trimmedNewPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one number' });
    }

    if (trimmedCurrentPassword.length === 0) {
      return res.status(400).json({ success: false, message: 'Current password cannot be empty' });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isPasswordMatch = await bcrypt.compare(trimmedCurrentPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(trimmedNewPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    // Update password
    user.password = trimmedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

module.exports = { register, login, logout, getuserdetails, updateProfile, changePassword };