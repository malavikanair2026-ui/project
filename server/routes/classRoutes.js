const express = require('express');
const ClassModel = require('../models/Class');

const router = express.Router();

// Create class (department optional for backward compatibility)
router.post('/', async (req, res) => {
  try {
    if (req.body.department) {
      const Department = require('../models/Department');
      const deptExists = await Department.findById(req.body.department);
      if (!deptExists) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }
    const classDoc = await ClassModel.create(req.body);
    const populated = await ClassModel.findById(classDoc._id)
      .populate('department', 'department_name department_code course');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create class' });
  }
});

// Get all classes (optionally filter by department or teacher)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;

    const classes = await ClassModel.find(query)
      .populate('department', 'department_name department_code course')
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');

    // If teacher query present, filter classes where:
    // - teacher is assigned to class (class_teacher or assigned_teachers)
    // - teacher is assigned to any subject in the class
    if (req.query.teacher) {
      const teacherId = req.query.teacher;
      const filtered = classes.filter((cls) => {
        const isClassTeacher = String(cls.class_teacher?._id || cls.class_teacher) === teacherId;
        const isAssignedTeacher = cls.assigned_teachers?.some(
          (t) => String(t._id || t) === teacherId
        );
        const teachesSubject = cls.subjects?.some((s) => String(s.teacher?._id || s.teacher) === teacherId);
        return isClassTeacher || isAssignedTeacher || teachesSubject;
      });
      return res.json(filtered);
    }

    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Get single class by ID
router.get('/:classId', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.params.classId)
      .populate('department', 'department_name department_code course')
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classDoc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch class' });
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
    if (req.body.department !== undefined) {
      const Department = require('../models/Department');
      if (req.body.department) {
        const deptExists = await Department.findById(req.body.department);
        if (!deptExists) {
          return res.status(400).json({ message: 'Department not found' });
        }
      }
    }
    const updated = await ClassModel.findByIdAndUpdate(req.params.classId, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'department_name department_code course')
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');
    if (!updated) return res.status(404).json({ message: 'Class not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update class' });
  }
});

// Assign teacher to class
router.post('/:classId/assign-teacher', async (req, res) => {
  try {
    const { teacherId, role = 'assigned' } = req.body; // role: 'class_teacher' or 'assigned'
    
    if (!teacherId) {
      return res.status(400).json({ message: 'teacherId is required' });
    }

    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    if (role === 'class_teacher') {
      classDoc.class_teacher = teacherId;
    } else {
      // Add to assigned_teachers if not already there
      if (!classDoc.assigned_teachers.includes(teacherId)) {
        classDoc.assigned_teachers.push(teacherId);
      }
    }

    await classDoc.save();
    const updated = await ClassModel.findById(req.params.classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to assign teacher to class' });
  }
});

// Remove teacher from class
router.delete('/:classId/remove-teacher/:teacherId', async (req, res) => {
  try {
    const { classId, teacherId } = req.params;
    const { role = 'assigned' } = req.query; // role: 'class_teacher' or 'assigned'

    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    if (role === 'class_teacher') {
      classDoc.class_teacher = null;
    } else {
      classDoc.assigned_teachers = classDoc.assigned_teachers.filter(
        (t) => String(t._id || t) !== teacherId
      );
    }

    await classDoc.save();
    const updated = await ClassModel.findById(classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to remove teacher from class' });
  }
});

// Add semester to class
router.post('/:classId/semesters', async (req, res) => {
  try {
    const { semester_name, start_date, end_date, is_active } = req.body;
    
    if (!semester_name) {
      return res.status(400).json({ message: 'semester_name is required' });
    }

    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    // Check if semester already exists
    const semesterExists = classDoc.semesters.some(
      (s) => s.semester_name.toLowerCase() === semester_name.toLowerCase()
    );
    if (semesterExists) {
      return res.status(400).json({ message: 'Semester already exists for this class' });
    }

    // If setting as active, deactivate other semesters
    if (is_active === true) {
      classDoc.semesters.forEach((s) => {
        s.is_active = false;
      });
    }

    classDoc.semesters.push({
      semester_name,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      is_active: is_active || false,
    });

    await classDoc.save();
    const updated = await ClassModel.findById(req.params.classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add semester to class' });
  }
});

// Update semester in class
router.put('/:classId/semesters/:semesterId', async (req, res) => {
  try {
    const { semester_name, start_date, end_date, is_active } = req.body;

    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const semesterIndex = classDoc.semesters.findIndex(
      (s) => s._id.toString() === req.params.semesterId
    );
    if (semesterIndex === -1) {
      return res.status(404).json({ message: 'Semester not found in class' });
    }

    // If setting as active, deactivate other semesters
    if (is_active === true) {
      classDoc.semesters.forEach((s, idx) => {
        if (idx !== semesterIndex) {
          s.is_active = false;
        }
      });
    }

    if (semester_name) classDoc.semesters[semesterIndex].semester_name = semester_name;
    if (start_date !== undefined) {
      classDoc.semesters[semesterIndex].start_date = start_date ? new Date(start_date) : null;
    }
    if (end_date !== undefined) {
      classDoc.semesters[semesterIndex].end_date = end_date ? new Date(end_date) : null;
    }
    if (is_active !== undefined) {
      classDoc.semesters[semesterIndex].is_active = is_active;
    }

    await classDoc.save();
    const updated = await ClassModel.findById(req.params.classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update semester in class' });
  }
});

// Remove semester from class
router.delete('/:classId/semesters/:semesterId', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    classDoc.semesters = classDoc.semesters.filter(
      (s) => s._id.toString() !== req.params.semesterId
    );
    await classDoc.save();

    const updated = await ClassModel.findById(req.params.classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to remove semester from class' });
  }
});

// Delete class
router.delete('/:classId', async (req, res) => {
  try {
    const deleted = await ClassModel.findByIdAndDelete(req.params.classId);
    if (!deleted) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete class' });
  }
});

// Remove subject from class
router.delete('/:classId/subjects/:subjectId', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    classDoc.subjects = classDoc.subjects.filter(
      (subj) => subj._id.toString() !== req.params.subjectId
    );
    await classDoc.save();

    const updated = await ClassModel.findById(req.params.classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to remove subject from class' });
  }
});

// Update subject in class (update teacher assignment)
router.put('/:classId/subjects/:subjectId', async (req, res) => {
  try {
    const { teacher } = req.body;
    const classDoc = await ClassModel.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const subjectIndex = classDoc.subjects.findIndex(
      (subj) => subj._id.toString() === req.params.subjectId
    );
    if (subjectIndex === -1) {
      return res.status(404).json({ message: 'Subject not found in class' });
    }

    if (teacher !== undefined) {
      classDoc.subjects[subjectIndex].teacher = teacher || undefined;
    }
    await classDoc.save();

    const updated = await ClassModel.findById(req.params.classId)
      .populate('subjects.subject subjects.teacher')
      .populate('class_teacher', 'name email')
      .populate('assigned_teachers', 'name email');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update subject in class' });
  }
});

module.exports = router;
