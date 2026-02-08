const express = require('express');
const mongoose = require('mongoose');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');

const router = express.Router();

// Enter Marks: create marks for a student (once per student+subject+exam_type+semester)
// To change marks, use Edit Marks (PUT /:markId).
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

    const existing = await Marks.findOne({
      student: req.params.studentId,
      subject: subjectId,
      exam_type: exam_type || 'final',
      semester: semester || '',
    });

    if (existing) {
      return res.status(409).json({
        message: 'Marks for this student and subject have already been entered. Use Edit Marks to change them.',
      });
    }

    const mark = await Marks.create({
      student: req.params.studentId,
      subject: subjectId,
      marks_obtained,
      exam_type: exam_type || 'final',
      semester: semester || '',
      is_final: is_final ?? false,
    });

    res.status(201).json(mark);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to save marks' });
  }
});

// Edit Marks: update an existing mark by id
router.put('/:markId', async (req, res) => {
  try {
    const { markId } = req.params;
    const { marks_obtained, exam_type, semester, is_final } = req.body;

    const mark = await Marks.findById(markId).populate('subject');
    if (!mark) return res.status(404).json({ message: 'Mark not found' });

    if (marks_obtained !== undefined) {
      const maxMarks = mark.subject?.max_marks ?? 100;
      if (marks_obtained > maxMarks) {
        return res.status(400).json({
          message: `Marks obtained (${marks_obtained}) cannot exceed maximum marks (${maxMarks})`,
        });
      }
      if (marks_obtained < 0) {
        return res.status(400).json({ message: 'Marks obtained cannot be negative' });
      }
      mark.marks_obtained = marks_obtained;
    }
    if (exam_type !== undefined) mark.exam_type = exam_type;
    if (semester !== undefined) mark.semester = semester;
    if (typeof is_final === 'boolean') mark.is_final = is_final;

    await mark.save();
    res.json(mark);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update marks' });
  }
});

// Get marks for a student (optionally by semester) - specific path so GET /marks/:id is unambiguous
router.get('/student/:studentId', async (req, res) => {
  try {
    const filter = { student: req.params.studentId };
    if (req.query.semester) filter.semester = req.query.semester;

    const marks = await Marks.find(filter).populate('subject');
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch marks' });
  }
});

// Get marks count per student (for students list) - must be before /:studentId
router.get('/counts', async (req, res) => {
  try {
    const counts = await Marks.aggregate([
      { $group: { _id: '$student', count: { $sum: 1 } } },
    ]);
    const byStudent = {};
    counts.forEach((c) => {
      byStudent[c._id.toString()] = c.count;
    });
    res.json(byStudent);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch marks counts' });
  }
});

// Get marks grouped by student (for students list display) - must be before /:studentId
router.get('/by-students', async (req, res) => {
  try {
    const studentIds = req.query.studentIds;
    if (!studentIds) {
      return res.json({});
    }
    const rawIds = typeof studentIds === 'string' ? studentIds.split(',') : studentIds;
    const validId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());
    const ids = rawIds
      .map((id) => (typeof id === 'string' ? id.trim() : String(id)))
      .filter(validId);
    if (!ids.length) return res.json({});

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const marks = await Marks.find({ student: { $in: objectIds } }).populate('subject');
    const byStudent = {};
    ids.forEach((id) => {
      byStudent[id] = [];
    });
    marks.forEach((m) => {
      const sid = m.student ? m.student.toString() : null;
      if (!sid) return;
      if (!byStudent[sid]) byStudent[sid] = [];
      byStudent[sid].push({
        subjectName: m.subject?.subject_name || m.subject?.name || '-',
        marks_obtained: m.marks_obtained,
        max_marks: m.subject?.max_marks,
        semester: m.semester,
        exam_type: m.exam_type,
      });
    });
    res.json(byStudent);
  } catch (err) {
    console.error('by-students error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch marks by students' });
  }
});

// Get marks for a student (optionally by semester) - legacy path, same as /student/:studentId
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
