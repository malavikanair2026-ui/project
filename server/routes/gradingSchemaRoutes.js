const express = require('express');
const router = express.Router();
const GradingSchema = require('../models/GradingSchema');
const { protect, authorize } = require('../middleware/auth');

// Get all grading schemas
router.get('/', async (req, res) => {
  try {
    const schemas = await GradingSchema.find()
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(schemas);
  } catch (error) {
    console.error('Get all schemas error:', error);
    res.status(500).json({ message: 'Failed to fetch grading schemas' });
  }
});

// Get active grading schema
router.get('/active', async (req, res) => {
  try {
    const schema = await GradingSchema.findOne({ is_active: true }).lean();
    if (!schema) {
      return res.status(404).json({ message: 'No active grading schema found' });
    }
    res.json(schema);
  } catch (error) {
    console.error('Get active schema error:', error);
    res.status(500).json({ message: 'Failed to fetch active grading schema' });
  }
});

// Get grading schema by ID
router.get('/:id', async (req, res) => {
  try {
    const schema = await GradingSchema.findById(req.params.id).lean();
    if (!schema) {
      return res.status(404).json({ message: 'Grading schema not found' });
    }
    res.json(schema);
  } catch (error) {
    console.error('Get schema by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid schema ID' });
    }
    res.status(500).json({ message: 'Failed to fetch grading schema' });
  }
});

// Create new grading schema
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, grade_ranges, pass_percentage, is_active } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Schema name is required' });
    }

    // Validate grade ranges
    if (!grade_ranges || !Array.isArray(grade_ranges) || grade_ranges.length === 0) {
      return res.status(400).json({ message: 'Grade ranges are required' });
    }

    // Validate each grade range
    for (const range of grade_ranges) {
      if (!range.grade || range.min_percentage === undefined || range.max_percentage === undefined || range.grade_point === undefined) {
        return res.status(400).json({ message: 'Each grade range must have grade, min_percentage, max_percentage, and grade_point' });
      }
      if (range.min_percentage < 0 || range.min_percentage > 100 || 
          range.max_percentage < 0 || range.max_percentage > 100) {
        return res.status(400).json({ message: 'Percentages must be between 0 and 100' });
      }
      if (range.min_percentage > range.max_percentage) {
        return res.status(400).json({ message: 'Min percentage cannot be greater than max percentage' });
      }
    }

    // Check for overlapping ranges
    const sortedRanges = [...grade_ranges].sort((a, b) => b.min_percentage - a.min_percentage);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].min_percentage <= sortedRanges[i + 1].max_percentage) {
        return res.status(400).json({ message: 'Grade ranges cannot overlap' });
      }
    }

    // If activating this schema, deactivate others first
    if (is_active === true) {
      await GradingSchema.updateMany(
        { is_active: true },
        { is_active: false }
      );
    }

    const schema = await GradingSchema.create({
      name: name.trim(),
      grade_ranges,
      pass_percentage: pass_percentage || 33,
      created_by: req.user?._id || null,
      is_active: is_active || false,
    });

    res.status(201).json(schema);
  } catch (error) {
    console.error('Create grading schema error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A grading schema with this name already exists' });
    }
    res.status(500).json({ message: error.message || 'Failed to create grading schema' });
  }
});

// Update grading schema
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, grade_ranges, pass_percentage, is_active } = req.body;

    // Check if schema exists
    const existingSchema = await GradingSchema.findById(req.params.id);
    if (!existingSchema) {
      return res.status(404).json({ message: 'Grading schema not found' });
    }

    const updateData = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Schema name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (grade_ranges) {
      // Validate grade ranges array
      if (!Array.isArray(grade_ranges) || grade_ranges.length === 0) {
        return res.status(400).json({ message: 'Grade ranges must be a non-empty array' });
      }

      // Validate each grade range
      for (const range of grade_ranges) {
        if (!range.grade || range.min_percentage === undefined || range.max_percentage === undefined || range.grade_point === undefined) {
          return res.status(400).json({ message: 'Each grade range must have grade, min_percentage, max_percentage, and grade_point' });
        }
        if (range.min_percentage < 0 || range.min_percentage > 100 || 
            range.max_percentage < 0 || range.max_percentage > 100) {
          return res.status(400).json({ message: 'Percentages must be between 0 and 100' });
        }
        if (range.min_percentage > range.max_percentage) {
          return res.status(400).json({ message: 'Min percentage cannot be greater than max percentage' });
        }
      }

      // Check for overlapping ranges
      const sortedRanges = [...grade_ranges].sort((a, b) => b.min_percentage - a.min_percentage);
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        if (sortedRanges[i].min_percentage <= sortedRanges[i + 1].max_percentage) {
          return res.status(400).json({ message: 'Grade ranges cannot overlap' });
        }
      }
      updateData.grade_ranges = grade_ranges;
    }
    if (pass_percentage !== undefined) {
      if (pass_percentage < 0 || pass_percentage > 100) {
        return res.status(400).json({ message: 'Pass percentage must be between 0 and 100' });
      }
      updateData.pass_percentage = pass_percentage;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    // If activating this schema, deactivate others first
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
    console.error('Update grading schema error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A grading schema with this name already exists' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid schema ID' });
    }
    res.status(500).json({ message: error.message || 'Failed to update grading schema' });
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
