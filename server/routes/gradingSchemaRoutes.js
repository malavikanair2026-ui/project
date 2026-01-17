const express = require('express');
const router = express.Router();
const GradingSchema = require('../models/GradingSchema');
const { protect, authorize } = require('../middleware/auth');

// Get all grading schemas
router.get('/', async (req, res) => {
  try {
    const schemas = await GradingSchema.find().populate('created_by', 'name email').sort({ createdAt: -1 });
    res.json(schemas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch grading schemas' });
  }
});

// Get active grading schema
router.get('/active', async (req, res) => {
  try {
    const schema = await GradingSchema.findOne({ is_active: true });
    if (!schema) {
      return res.status(404).json({ message: 'No active grading schema found' });
    }
    res.json(schema);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch active grading schema' });
  }
});

// Get grading schema by ID
router.get('/:id', async (req, res) => {
  try {
    const schema = await GradingSchema.findById(req.params.id);
    if (!schema) {
      return res.status(404).json({ message: 'Grading schema not found' });
    }
    res.json(schema);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch grading schema' });
  }
});

// Create new grading schema
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, grade_ranges, pass_percentage } = req.body;

    // Validate grade ranges
    if (!grade_ranges || grade_ranges.length === 0) {
      return res.status(400).json({ message: 'Grade ranges are required' });
    }

    // Check for overlapping ranges
    const sortedRanges = [...grade_ranges].sort((a, b) => b.min_percentage - a.min_percentage);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].min_percentage <= sortedRanges[i + 1].max_percentage) {
        return res.status(400).json({ message: 'Grade ranges cannot overlap' });
      }
    }

    const schema = await GradingSchema.create({
      name,
      grade_ranges,
      pass_percentage,
      created_by: req.user._id,
      is_active: req.body.is_active || false,
    });

    res.status(201).json(schema);
  } catch (error) {
    console.error('Create grading schema error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: error.message || 'Failed to create grading schema' });
  }
});

// Update grading schema
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, grade_ranges, pass_percentage, is_active } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (grade_ranges) {
      // Validate grade ranges
      const sortedRanges = [...grade_ranges].sort((a, b) => b.min_percentage - a.min_percentage);
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        if (sortedRanges[i].min_percentage <= sortedRanges[i + 1].max_percentage) {
          return res.status(400).json({ message: 'Grade ranges cannot overlap' });
        }
      }
      updateData.grade_ranges = grade_ranges;
    }
    if (pass_percentage !== undefined) updateData.pass_percentage = pass_percentage;
    if (is_active !== undefined) updateData.is_active = is_active;

    // If activating this schema, deactivate others
    if (is_active === true) {
      await GradingSchema.updateMany(
        { _id: { $ne: req.params.id }, is_active: true },
        { is_active: false }
      );
    }

    const schema = await GradingSchema.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!schema) {
      return res.status(404).json({ message: 'Grading schema not found' });
    }

    res.json(schema);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update grading schema' });
  }
});

// Delete grading schema
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const schema = await GradingSchema.findById(req.params.id);
    if (!schema) {
      return res.status(404).json({ message: 'Grading schema not found' });
    }

    if (schema.is_active) {
      return res.status(400).json({ message: 'Cannot delete active grading schema' });
    }

    await GradingSchema.findByIdAndDelete(req.params.id);
    res.json({ message: 'Grading schema deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete grading schema' });
  }
});

module.exports = router;
