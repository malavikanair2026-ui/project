const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const Class = require('../models/Class');

// Build student filter from hierarchy query params (course, department, class)
const studentFilterFromQuery = (query) => {
  const filter = {};
  if (query.course) filter.course = query.course;
  if (query.department) filter.department = query.department;
  if (query.class) filter.class = query.class;
  return filter;
};

// Get class-wise performance with section-wise breakdown (supports filter by course, department, class)
router.get('/class-performance', async (req, res) => {
  try {
    const { semester, course, department, class: classId } = req.query;
    const filter = {};
    if (semester) filter.semester = String(semester).trim();

    const studentFilter = studentFilterFromQuery(req.query);

    const results = await Result.find(filter).populate('student');
    const students = await Student.find(studentFilter).populate('class').populate('course').populate('department');
    const classes = await Class.find();

    const classMap = {};
    classes.forEach((c) => { classMap[c._id.toString()] = c.class_name; });

    const classPerformance = {};

    results.forEach((result) => {
      if (!result.student) return;
      const student = students.find(
        (s) => s._id.toString() === result.student?._id?.toString() || s._id.toString() === result.student?.toString()
      );
      if (!student?.name || !student?.class) return;
      const classId = student.class?._id?.toString() || student.class?.toString();
      const className = student.class?.class_name || classMap[classId] || classId;
      const section = student.section || '-';

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
          sections: {},
        };
      }

      if (!classPerformance[className].sections[section]) {
        classPerformance[className].sections[section] = {
          sectionName: section,
          totalStudents: 0,
          resultsCount: 0,
          totalPercentage: 0,
          passCount: 0,
          failCount: 0,
          gradeDistribution: {},
          students: [],
        };
      }

      const classData = classPerformance[className];
      const sectionData = classData.sections[section];

      classData.resultsCount += 1;
      classData.totalPercentage += result.percentage;
      if (result.grade !== 'F') classData.passCount += 1;
      else classData.failCount += 1;
      classData.gradeDistribution[result.grade] =
        (classData.gradeDistribution[result.grade] || 0) + 1;
      classData.students.push({
        studentId: student.student_id,
        name: student.name,
        section,
        percentage: result.percentage,
        grade: result.grade,
        rank: 0,
      });

      sectionData.resultsCount += 1;
      sectionData.totalPercentage += result.percentage;
      if (result.grade !== 'F') sectionData.passCount += 1;
      else sectionData.failCount += 1;
      sectionData.gradeDistribution[result.grade] =
        (sectionData.gradeDistribution[result.grade] || 0) + 1;
      sectionData.students.push({
        studentId: student.student_id,
        name: student.name,
        percentage: result.percentage,
        grade: result.grade,
        rank: 0,
      });
    });

    Object.keys(classPerformance).forEach((className) => {
      const classData = classPerformance[className];
      classData.averagePercentage =
        classData.resultsCount > 0 ? classData.totalPercentage / classData.resultsCount : 0;
      classData.passRate =
        classData.resultsCount > 0 ? (classData.passCount / classData.resultsCount) * 100 : 0;
      classData.students.sort((a, b) => b.percentage - a.percentage);
      classData.students.forEach((s, i) => { s.rank = i + 1; });
      classData.totalStudents = new Set(classData.students.map((s) => s.studentId)).size;

      Object.keys(classData.sections).forEach((section) => {
        const sectionData = classData.sections[section];
        sectionData.averagePercentage =
          sectionData.resultsCount > 0 ? sectionData.totalPercentage / sectionData.resultsCount : 0;
        sectionData.passRate =
          sectionData.resultsCount > 0 ? (sectionData.passCount / sectionData.resultsCount) * 100 : 0;
        sectionData.students.sort((a, b) => b.percentage - a.percentage);
        sectionData.students.forEach((s, i) => { s.rank = i + 1; });
        sectionData.totalStudents = new Set(sectionData.students.map((s) => s.studentId)).size;
      });
    });

    res.json(classPerformance);
  } catch (error) {
    console.error('Class performance error:', error);
    res.status(500).json({ message: 'Failed to fetch class performance' });
  }
});

// Get section-wise performance (supports filter by course, department, class)
router.get('/section-performance', async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester) filter.semester = String(semester).trim();

    const studentFilter = studentFilterFromQuery(req.query);

    const results = await Result.find(filter).populate('student');
    const students = await Student.find(studentFilter).populate('class');

    const sectionPerformance = {};

    results.forEach((result) => {
      if (!result.student) return;
      const student = students.find(
        (s) => s._id.toString() === result.student?._id?.toString() || s._id.toString() === result.student?.toString()
      );
      if (!student?.name) return;
      const section = student.section || '-';

      if (!sectionPerformance[section]) {
        sectionPerformance[section] = {
          sectionName: section,
          totalStudents: 0,
          resultsCount: 0,
          totalPercentage: 0,
          passCount: 0,
          failCount: 0,
          gradeDistribution: {},
          students: [],
        };
      }

      const sectionData = sectionPerformance[section];
      sectionData.resultsCount += 1;
      sectionData.totalPercentage += result.percentage;
      if (result.grade !== 'F') sectionData.passCount += 1;
      else sectionData.failCount += 1;
      sectionData.gradeDistribution[result.grade] =
        (sectionData.gradeDistribution[result.grade] || 0) + 1;
      sectionData.students.push({
        studentId: student.student_id,
        name: student.name,
        class: student.class?.class_name || student.class || 'cs',
        percentage: result.percentage,
        grade: result.grade,
        rank: 0,
      });
    });

    Object.keys(sectionPerformance).forEach((section) => {
      const sectionData = sectionPerformance[section];
      sectionData.averagePercentage =
        sectionData.resultsCount > 0 ? sectionData.totalPercentage / sectionData.resultsCount : 0;
      sectionData.passRate =
        sectionData.resultsCount > 0 ? (sectionData.passCount / sectionData.resultsCount) * 100 : 0;
      sectionData.students.sort((a, b) => b.percentage - a.percentage);
      sectionData.students.forEach((s, i) => { s.rank = i + 1; });
      sectionData.totalStudents = new Set(sectionData.students.map((s) => s.studentId)).size;
    });

    res.json(sectionPerformance);
  } catch (error) {
    console.error('Section performance error:', error);
    res.status(500).json({ message: 'Failed to fetch section performance' });
  }
});

// Get subject-wise analysis (supports filter by course, department, class via student)
router.get('/subject-analysis', async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester) filter.semester = String(semester).trim();

    const studentFilter = studentFilterFromQuery(req.query);
    let studentIds = null;
    if (Object.keys(studentFilter).length > 0) {
      const students = await Student.find(studentFilter).select('_id');
      studentIds = students.map((s) => s._id);
      if (studentIds.length === 0) return res.json({});
      filter.student = { $in: studentIds };
    }

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

// Get full ranking (all students; filter by course, department, class)
router.get('/rankings', async (req, res) => {
  try {
    const { semester, course, department, class: classId } = req.query;
    const filter = {};
    if (semester) filter.semester = String(semester).trim();

    const studentFilter = studentFilterFromQuery(req.query);

    const results = await Result.find(filter).populate('student');
    const students = await Student.find(studentFilter)
      .populate('course', 'course_name')
      .populate('department', 'department_name')
      .populate('class', 'class_name');

    let rankings = results
      .filter((result) => result.student)
      .map((result) => {
        const student = students.find(
          (s) => s._id.toString() === result.student?._id?.toString() || s._id.toString() === result.student?.toString()
        );
        if (!student) return null;
        return {
          rank: 0,
          studentId: student?.student_id ?? '-',
          name: student?.name ?? '-',
          course: student?.course?.course_name ?? student?.course ?? '-',
          department: student?.department?.department_name ?? student?.department ?? '-',
          class: student?.class?.class_name ?? student?.class ?? 'cs',
          section: student?.section || '',
          semester: result.semester,
          totalMarks: result.total_marks,
          percentage: result.percentage,
          grade: result.grade,
          sgpa: result.sgpa,
          status: result.status,
        };
      })
      .filter((r) => r && r.name && r.name !== '-');

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

// Get toppers list (supports filter by course, department, class)
router.get('/toppers', async (req, res) => {
  try {
    const { limit = 10, semester, course, department, class: classId } = req.query;
    const filter = {};
    if (semester) filter.semester = String(semester).trim();

    const studentFilter = studentFilterFromQuery(req.query);
    if (Object.keys(studentFilter).length > 0) {
      const students = await Student.find(studentFilter).select('_id');
      const ids = students.map((s) => s._id);
      if (ids.length === 0) return res.json([]);
      filter.student = { $in: ids };
    }

    const results = await Result.find(filter)
      .populate({ path: 'student', populate: [{ path: 'course' }, { path: 'department' }, { path: 'class' }] })
      .sort({ percentage: -1 })
      .limit(parseInt(limit));

    const toppers = results
      .filter((result) => result.student && result.student?.name)
      .map((result, index) => ({
        rank: index + 1,
        studentId: result.student?.student_id ?? '-',
        name: result.student?.name ?? '-',
        course: result.student?.course?.course_name ?? result.student?.course ?? '-',
        department: result.student?.department?.department_name ?? result.student?.department ?? '-',
        class: result.student?.class?.class_name ?? result.student?.class ?? 'cs',
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

// Get pass/fail statistics (supports filter by course, department, class)
router.get('/pass-fail', async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = {};
    if (semester) filter.semester = String(semester).trim();

    const studentFilter = studentFilterFromQuery(req.query);

    let results = await Result.find(filter).populate('student');
    if (Object.keys(studentFilter).length > 0) {
      const students = await Student.find(studentFilter).select('_id');
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
