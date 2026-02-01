const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const Feedback = require('../models/Feedback');
const Query = require('../models/Query');
const Notification = require('../models/Notification');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Create user (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: error.message || 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (and linked student + related data if role is student)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is a student, delete the Student record and all related data first
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        const studentId = student._id;
        await Marks.deleteMany({ student: studentId });
        await Result.deleteMany({ student: studentId });
        await Feedback.deleteMany({ student: studentId });
        await Query.deleteMany({ student: studentId });
        await Notification.updateMany(
          { recipients: studentId },
          { $pull: { recipients: studentId } }
        );
        await Student.findByIdAndDelete(studentId);
      }
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: error.message || 'Failed to delete user',
    });
  }
});

module.exports = router;
