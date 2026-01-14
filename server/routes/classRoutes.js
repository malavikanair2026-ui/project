const express = require('express');
const ClassModel = require('../models/Class');

const router = express.Router();

// Create class
router.post('/', async (req, res) => {
  try {
    const classDoc = await ClassModel.create(req.body);
    res.status(201).json(classDoc);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create class' });
  }
});

// Get all classes (optionally filter by teacher)
router.get('/', async (req, res) => {
  try {
    const classes = await ClassModel.find().populate('subjects.subject subjects.teacher');

    // If teacher query present, filter classes where any subject is taught by teacher
    if (req.query.teacher) {
      const teacherId = req.query.teacher;
      const filtered = classes.filter((cls) =>
        cls.subjects?.some((s) => String(s.teacher) === teacherId)
      );
      return res.json(filtered);
    }

    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Add subject-teacher mapping to a class
router.post('/:classId/subjects', async (req, res) => {
  try {
    const { subject, teacher } = req.body;
    if (!subject) {
      return res.status(400).json({ message: 'subject is required' });
    }

    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    classDoc.subjects.push({ subject, teacher });
    await classDoc.save();

    res.json(classDoc);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add subject to class' });
  }
});

// Update class info
router.put('/:classId', async (req, res) => {
  try {
    const updated = await ClassModel.findByIdAndUpdate(req.params.classId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Class not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update class' });
  }
});

module.exports = router;
