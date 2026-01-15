const express = require('express');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');

const router = express.Router();

// Add marks for a student (create or update same combination)
router.post('/:studentId', async (req, res) => {
  try {
    const { subjectId, marks_obtained, exam_type, semester, is_final } = req.body;

    if (!subjectId || marks_obtained === undefined) {
      return res.status(400).json({ message: 'subjectId and marks_obtained are required' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Validate marks don't exceed maximum
    if (marks_obtained > subject.max_marks) {
      return res.status(400).json({
        message: `Marks obtained (${marks_obtained}) cannot exceed maximum marks (${subject.max_marks})`,
      });
    }

    if (marks_obtained < 0) {
      return res.status(400).json({ message: 'Marks obtained cannot be negative' });
    }

    let mark = await Marks.findOne({
      student: req.params.studentId,
      subject: subjectId,
      exam_type: exam_type || 'final',
      semester,
    });

    if (mark) {
      mark.marks_obtained = marks_obtained;
      mark.is_final = is_final ?? mark.is_final;
      mark.exam_type = exam_type || mark.exam_type;
      mark.semester = semester || mark.semester;
      await mark.save();
    } else {
      mark = await Marks.create({
        student: req.params.studentId,
        subject: subjectId,
        marks_obtained,
        exam_type: exam_type || 'final',
        semester,
        is_final: is_final ?? false,
      });
    }

    res.status(201).json(mark);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to save marks' });
  }
});

// Get marks for a student (optionally by semester)
router.get('/:studentId', async (req, res) => {
  try {
    const filter = { student: req.params.studentId };
    if (req.query.semester) filter.semester = req.query.semester;

    const marks = await Marks.find(filter).populate('subject');
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch marks' });
  }
});

module.exports = router;
