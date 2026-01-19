import { useEffect, useState } from 'react';
import { classesAPI, marksAPI, studentsAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MarksEntry = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    classId: '',
    studentId: '',
    subjectId: '',
    marks_obtained: '',
    exam_type: 'final',
    semester: '',
    is_final: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
      ]);
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'marks_obtained' ? Number(e.target.value) : e.target.value,
    });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (!formData.classId || !formData.studentId || !formData.subjectId || formData.marks_obtained === '') {
        setError('Class, Student, Subject, and Marks are required');
        return;
      }

      await marksAPI.add(formData.studentId, {
        subjectId: formData.subjectId,
        marks_obtained: formData.marks_obtained,
        exam_type: formData.exam_type,
        semester: formData.semester,
        is_final: formData.is_final,
      });

      // Auto-calculate result for the student (optional)
      if (formData.is_final) {
        await resultsAPI.calculate(formData.studentId, formData.semester);
      }

      setMessage('Marks saved successfully');
      setFormData({ ...formData, marks_obtained: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks');
    }
  };

  // Derived data based on selected class and teacher assignments
  const selectedClass = classes.find((cls) => cls._id === formData.classId);

  const teacherSubjects =
    selectedClass && selectedClass.subjects
      ? selectedClass.subjects.filter(
          (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
        )
      : [];

  const classStudents =
    selectedClass && students.length > 0
      ? students.filter((stu) => stu.class === selectedClass.class_name)
      : [];

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <h2 style={styles.title}>Enter Marks</h2>
      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Class</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={(e) => {
                // Reset dependent fields when class changes
                handleChange(e);
                setFormData((prev) => ({
                  ...prev,
                  studentId: '',
                  subjectId: '',
                }));
              }}
              required
              style={styles.input}
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name} (ID: {cls.class_id})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>Subject</label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              required
              disabled={!selectedClass}
              style={styles.input}
            >
              <option value="">
                {selectedClass ? 'Select subject' : 'Select class first'}
              </option>
              {teacherSubjects.map((s, idx) => (
                <option key={s.subject?._id || idx} value={s.subject?._id}>
                  {s.subject?.subject_name || 'Unknown Subject'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Student</label>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              disabled={!selectedClass}
              style={styles.input}
            >
              <option value="">
                {selectedClass ? 'Select student' : 'Select class first'}
              </option>
              {classStudents.map((stu) => (
                <option key={stu._id} value={stu._id}>
                  {stu.name} - {stu.class} {stu.section} (ID: {stu.student_id})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>Marks Obtained</label>
            <input
              type="number"
              name="marks_obtained"
              value={formData.marks_obtained}
              onChange={handleChange}
              min="0"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label>Exam Type</label>
            <select
              name="exam_type"
              value={formData.exam_type}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="final">Final</option>
              <option value="midterm">Midterm</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Semester</label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              placeholder="e.g., Sem1"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroupCheckbox}>
            <label>
              <input
                type="checkbox"
                name="is_final"
                checked={formData.is_final}
                onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
              />
              {' '}Final Submission (trigger result calc)
            </label>
          </div>
        </div>

        <button type="submit" style={styles.button}>Save Marks</button>
      </form>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '26px',
    marginBottom: '16px',
    color: '#1f2a44',
  },
  form: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formGroupCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    alignSelf: 'flex-start',
    padding: '10px 18px',
    backgroundColor: '#1f8b4c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
  },
  success: {
    backgroundColor: '#e7f7ef',
    color: '#1f8b4c',
    padding: '12px',
    borderRadius: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
  },
};

export default MarksEntry;
