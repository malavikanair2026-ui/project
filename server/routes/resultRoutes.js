const express = require('express');
const Result = require('../models/Result');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const { calculateGrade, calculatePercentage, calculateSGPA } = require('../utils/calculateResult');

const router = express.Router();

// Helper to calculate and upsert result for a student
const calculateStudentResult = async (studentId, semester) => {
  const marksFilter = { student: studentId };
  if (semester) marksFilter.semester = semester;

  const marks = await Marks.find(marksFilter).populate('subject');
  if (!marks.length) {
    throw new Error('No marks found for this student/semester');
  }

  let totalMarks = 0;
  let maxMarks = 0;

  marks.forEach((m) => {
    totalMarks += m.marks_obtained;
    maxMarks += m.subject?.max_marks || 0;
  });

  const percentage = Number(calculatePercentage(totalMarks, maxMarks));
  const grade = calculateGrade(percentage);
  const sgpa = calculateSGPA(grade);

  const result = await Result.findOneAndUpdate(
    { student: studentId, semester: semester || 'N/A' },
    {
      student: studentId,
      semester: semester || 'N/A',
      total_marks: totalMarks,
      percentage,
      grade,
      sgpa,
      cgpa: sgpa, // simple placeholder for demo
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return result;
};

// Calculate result for a student
router.post('/calculate/:studentId', async (req, res) => {
  try {
    const result = await calculateStudentResult(req.params.studentId, req.body.semester);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to calculate result' });
  }
});

// Get all results (populate student with course, department, class for analytics)
router.get('/', async (req, res) => {
  try {
    const results = await Result.find()
      .populate({
        path: 'student',
        populate: [
          { path: 'course', select: 'course_name course_code' },
          { path: 'department', select: 'department_name department_code' },
          { path: 'class', select: 'class_name' },
        ],
      })
      .sort({ semester: -1, percentage: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// Get result for a student (returns all results if no semester specified)
router.get('/:studentId', async (req, res) => {
  try {
    const filter = { student: req.params.studentId };
    if (req.query.semester) filter.semester = req.query.semester;

    // If semester is specified, return single result; otherwise return all
    if (req.query.semester) {
      const result = await Result.findOne(filter).populate('student');
      if (!result) return res.status(404).json({ message: 'Result not found' });
      return res.json(result);
    } else {
      const results = await Result.find(filter).populate('student').sort({ createdAt: -1 });
      return res.json(results);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch result' });
  }
});

// Update result status (approve/freeze)
router.put('/:resultId/status', async (req, res) => {
  try {
    const { status, approved_by } = req.body;
    if (!['pending', 'approved', 'frozen'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await Result.findByIdAndUpdate(
      req.params.resultId,
      { status, approved_by },
      { new: true }
    ).populate('student');

    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update result status' });
  }
});

module.exports = router;
