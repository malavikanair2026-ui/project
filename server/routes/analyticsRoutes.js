const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');

// Get class-wise performance
router.get('/class-performance', async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;

    const results = await Result.find(filter).populate('student');
    const students = await Student.find();

    const classPerformance = {};

    results.forEach((result) => {
      if (!result.student) return; // Skip orphaned results (deleted student)
      const student = students.find(
        (s) => s._id.toString() === result.student?._id?.toString() || s._id.toString() === result.student?.toString()
      );
      if (!student?.name || !student?.class) return; // Skip unknown/missing student details
      if (student?.class) {
        const className = `${student.class} ${student.section || ''}`.trim();
        if (!classPerformance[className]) {
          classPerformance[className] = {
            className,
            totalStudents: 0,
            resultsCount: 0,
            totalPercentage: 0,
            passCount: 0,
            failCount: 0,
            gradeDistribution: {},
            students: [],
          };
        }
        classPerformance[className].resultsCount += 1;
        classPerformance[className].totalPercentage += result.percentage;
        if (result.grade !== 'F') {
          classPerformance[className].passCount += 1;
        } else {
          classPerformance[className].failCount += 1;
        }
        classPerformance[className].gradeDistribution[result.grade] =
          (classPerformance[className].gradeDistribution[result.grade] || 0) + 1;

        // Add student result
        classPerformance[className].students.push({
          studentId: student.student_id,
          name: student.name,
          percentage: result.percentage,
          grade: result.grade,
          rank: 0, // Will be calculated later
        });
      }
    });

    // Calculate averages and ranks for each class
    Object.keys(classPerformance).forEach((className) => {
      const classData = classPerformance[className];
      classData.averagePercentage =
        classData.resultsCount > 0 ? classData.totalPercentage / classData.resultsCount : 0;
      classData.passRate =
        classData.resultsCount > 0 ? (classData.passCount / classData.resultsCount) * 100 : 0;

      // Calculate ranks within class
      classData.students.sort((a, b) => b.percentage - a.percentage);
      classData.students.forEach((student, index) => {
        student.rank = index + 1;
      });

      // Count unique students
      const uniqueStudents = new Set(classData.students.map((s) => s.studentId));
      classData.totalStudents = uniqueStudents.size;
    });

    res.json(classPerformance);
  } catch (error) {
    console.error('Class performance error:', error);
    res.status(500).json({ message: 'Failed to fetch class performance' });
  }
});

// Get subject-wise analysis
router.get('/subject-analysis', async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;

    const marks = await Marks.find(filter).populate('subject').populate('student');
    const subjects = await Subject.find();

    const subjectAnalysis = {};

    marks.forEach((mark) => {
      if (!mark.student || !mark.student?.name) return; // Skip unknown student details
      const subject = mark.subject;
      if (!subject) return;

      const subjectName = subject.subject_name;
      if (!subjectAnalysis[subjectName]) {
        subjectAnalysis[subjectName] = {
          subjectName,
          subjectId: subject._id,
          maxMarks: subject.max_marks,
          totalMarks: 0,
          count: 0,
          averageMarks: 0,
          averagePercentage: 0,
          passCount: 0,
          failCount: 0,
          topScorers: [],
        };
      }

      const data = subjectAnalysis[subjectName];
      data.totalMarks += mark.marks_obtained;
      data.count += 1;

      const percentage = (mark.marks_obtained / subject.max_marks) * 100;
      if (percentage >= 33) {
        data.passCount += 1;
      } else {
        data.failCount += 1;
      }

      // Track top scorers (student already validated above)
      data.topScorers.push({
        studentId: mark.student?.student_id ?? '-',
        studentName: mark.student?.name ?? '-',
        marks: mark.marks_obtained,
        percentage: percentage,
      });
    });

    // Calculate averages and sort top scorers
    Object.keys(subjectAnalysis).forEach((subjectName) => {
      const data = subjectAnalysis[subjectName];
      data.averageMarks = data.count > 0 ? data.totalMarks / data.count : 0;
      data.averagePercentage = data.count > 0 ? (data.averageMarks / data.maxMarks) * 100 : 0;
      data.passRate = data.count > 0 ? (data.passCount / data.count) * 100 : 0;

      // Sort and get top 10 scorers
      data.topScorers = data.topScorers
        .filter((s) => s.studentName && s.studentName !== '-')
        .sort((a, b) => b.marks - a.marks)
        .slice(0, 10);
    });

    res.json(subjectAnalysis);
  } catch (error) {
    console.error('Subject analysis error:', error);
    res.status(500).json({ message: 'Failed to fetch subject analysis' });
  }
});

// Get full ranking (all students)
router.get('/rankings', async (req, res) => {
  try {
    const { semester, class: className } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;

    const results = await Result.find(filter).populate('student');
    const students = await Student.find();

    let rankings = results
      .filter((result) => result.student) // Exclude orphaned results
      .map((result) => {
        const student = students.find(
          (s) => s._id.toString() === result.student?._id?.toString() || s._id.toString() === result.student?.toString()
        );
        return {
          rank: 0,
          studentId: student?.student_id ?? '-',
          name: student?.name ?? '-',
          class: student?.class ?? '-',
          section: student?.section || '',
          semester: result.semester,
          totalMarks: result.total_marks,
          percentage: result.percentage,
          grade: result.grade,
          sgpa: result.sgpa,
          status: result.status,
        };
      })
      .filter((r) => r.name && r.name !== '-'); // Remove details of unknown

    // Filter by class if specified
    if (className) {
      rankings = rankings.filter((r) => r.class === className);
    }

    // Sort by percentage descending
    rankings.sort((a, b) => b.percentage - a.percentage);

    // Assign ranks (handle ties)
    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
      if (i > 0 && rankings[i].percentage < rankings[i - 1].percentage) {
        currentRank = i + 1;
      }
      rankings[i].rank = currentRank;
    }

    res.json(rankings);
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({ message: 'Failed to fetch rankings' });
  }
});

// Get toppers list
router.get('/toppers', async (req, res) => {
  try {
    const { limit = 10, semester } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;

    const results = await Result.find(filter)
      .populate('student')
      .sort({ percentage: -1 })
      .limit(parseInt(limit));

    const toppers = results
      .filter((result) => result.student && result.student?.name) // Remove details of unknown
      .map((result, index) => ({
        rank: index + 1,
        studentId: result.student?.student_id ?? '-',
        name: result.student?.name ?? '-',
        class: result.student?.class ?? '-',
        section: result.student?.section || '',
        percentage: result.percentage,
        grade: result.grade,
        sgpa: result.sgpa,
      }));

    res.json(toppers);
  } catch (error) {
    console.error('Toppers error:', error);
    res.status(500).json({ message: 'Failed to fetch toppers' });
  }
});

// Get pass/fail statistics
router.get('/pass-fail', async (req, res) => {
  try {
    const { semester, class: className } = req.query;
    const filter = {};
    if (semester) filter.semester = semester;

    let results = await Result.find(filter).populate('student');

    // Filter by class if specified
    if (className) {
      const students = await Student.find({ class: className });
      const studentIds = students.map((s) => s._id.toString());
      results = results.filter((r) => {
        const studentId = r.student?._id?.toString() || r.student?.toString();
        return studentIds.includes(studentId);
      });
    }

    const passCount = results.filter((r) => r.grade !== 'F').length;
    const failCount = results.filter((r) => r.grade === 'F').length;
    const total = results.length;
    const passRate = total > 0 ? (passCount / total) * 100 : 0;

    res.json({
      total,
      passCount,
      failCount,
      passRate: parseFloat(passRate.toFixed(2)),
    });
  } catch (error) {
    console.error('Pass/fail stats error:', error);
    res.status(500).json({ message: 'Failed to fetch pass/fail statistics' });
  }
});

module.exports = router;
