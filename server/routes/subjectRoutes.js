const express = require('express');
const Subject = require('../models/Subject');

const router = express.Router();

// Create subject
router.post('/', async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create subject' });
  }
});

// Get all subjects
router.get('/', async (_req, res) => {
  try {
    const subjects = await Subject.find().sort({ subject_id: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// Get subject by id
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subject' });
  }
});

// Update subject
router.put('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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
