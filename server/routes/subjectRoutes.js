const express = require('express');
const Subject = require('../models/Subject');
const Class = require('../models/Class');

const router = express.Router();

// Create subject
router.post('/', async (req, res) => {
  try {
    // Validate that class is provided
    if (!req.body.class) {
      return res.status(400).json({ message: 'Class is required' });
    }
    
    // Validate that the class exists
    const classExists = await Class.findById(req.body.class);
    if (!classExists) {
      return res.status(400).json({ message: 'Class not found' });
    }

    const subject = await Subject.create(req.body);
    
    // Add subject to class's subjects array
    const classDoc = await Class.findById(req.body.class);
    // Check if subject is already in class
    const subjectExists = classDoc.subjects.some(
      (s) => String(s.subject) === String(subject._id)
    );
    if (!subjectExists) {
      classDoc.subjects.push({ subject: subject._id, teacher: req.body.teacher || null });
      await classDoc.save();
    }

    const populatedSubject = await Subject.findById(subject._id)
      .populate('class', 'class_name');
    res.status(201).json(populatedSubject);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create subject' });
  }
});

// Get all subjects (optionally filter by class)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.class) {
      query.class = req.query.class;
    }

    const subjects = await Subject.find(query)
      .populate('class', 'class_name')
      .sort({ subject_id: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// Get subjects by class ID
router.get('/class/:classId', async (req, res) => {
  try {
    const subjects = await Subject.find({ class: req.params.classId })
      .populate('class', 'class_name')
      .sort({ subject_id: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// Get subject by id
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('class', 'class_name');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subject' });
  }
});

// Update subject
router.put('/:id', async (req, res) => {
  try {
    // Validate that class is provided
    if (!req.body.class) {
      return res.status(400).json({ message: 'Class is required' });
    }
    
    // Validate that the class exists
    const classExists = await Class.findById(req.body.class);
    if (!classExists) {
      return res.status(400).json({ message: 'Class not found' });
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('class', 'class_name');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update subject' });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

module.exports = router;
