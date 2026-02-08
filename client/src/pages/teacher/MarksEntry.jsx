import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { classesAPI, marksAPI, studentsAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const MarksEntry = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [loadingStudentsInClass, setLoadingStudentsInClass] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    studentId: '',
    subjectId: '',
    marks_obtained: '',
    exam_type: 'final',
    semester: '',
    is_final: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marksAlreadyEntered, setMarksAlreadyEntered] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    fetchData();
    // Pre-select student from URL parameter
    const studentIdParam = searchParams.get('studentId');
    if (studentIdParam) {
      setFormData((prev) => ({ ...prev, studentId: studentIdParam }));
    }
  }, [searchParams]);

  // Fetch students for selected class so dropdown lists names correctly
  useEffect(() => {
    const classId = formData.classId ? String(formData.classId).trim() : '';
    if (!classId) {
      setStudentsInClass([]);
      return;
    }
    let cancelled = false;
    setLoadingStudentsInClass(true);
    studentsAPI
      .getAll({ class: classId })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setStudentsInClass(list);
      })
      .catch(() => {
        if (!cancelled) setStudentsInClass([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStudentsInClass(false);
      });
    return () => { cancelled = true; };
  }, [formData.classId]);

  // Auto-fill semester with the selected class's active semester
  useEffect(() => {
    if (!formData.classId || !classes.length) return;
    const cls = classes.find((c) => String(c._id) === String(formData.classId));
    const semesters = cls?.semesters;
    if (!Array.isArray(semesters) || semesters.length === 0) return;
    const active = semesters.find((s) => s.is_active === true);
    const semesterName = active?.semester_name ?? semesters[0]?.semester_name ?? '';
    if (semesterName) {
      setFormData((prev) => (prev.semester === semesterName ? prev : { ...prev, semester: semesterName }));
    }
  }, [formData.classId, classes]);

  // Enter Marks: each student's marks for a given subject can be entered only once.
  // Check if marks already exist for this student + subject + semester + exam_type.
  useEffect(() => {
    const { studentId, subjectId, semester, exam_type } = formData;
    if (!studentId || !subjectId) {
      setMarksAlreadyEntered(false);
      return;
    }
    let cancelled = false;
    setCheckingExisting(true);
    marksAPI
      .getByStudent(studentId, semester || undefined)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const exists = list.some(
          (m) =>
            String(m.subject?._id || m.subject) === String(subjectId) &&
            (m.exam_type || 'final') === (exam_type || 'final')
        );
        setMarksAlreadyEntered(exists);
      })
      .catch(() => {
        if (!cancelled) setMarksAlreadyEntered(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingExisting(false);
      });
    return () => { cancelled = true; };
  }, [formData.studentId, formData.subjectId, formData.semester, formData.exam_type]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
      ]);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      const studentsList = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      setStudents(studentsList);

      // If studentId is in URL, try to find and set the class
      const studentIdParam = searchParams.get('studentId');
      if (studentIdParam) {
        const student = studentsList.find((s) => s && s._id === studentIdParam);
        const studentClassId = student?.class?._id || student?.class;
        if (studentClassId) {
          setFormData((prev) => ({ ...prev, classId: String(studentClassId) }));
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'marks_obtained' ? Number(e.target.value) : e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.classId || !formData.studentId || !formData.subjectId || formData.marks_obtained === '') {
        showToast('Class, Student, Subject, and Marks are required', 'error');
        setSubmitting(false);
        return;
      }
      if (marksAlreadyEntered) {
        showToast('Marks for this student and subject have already been entered. Use Edit Marks to change them.', 'error');
        setSubmitting(false);
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
        try {
          await resultsAPI.calculate(formData.studentId, formData.semester);
          showToast('Marks saved and result calculated successfully!', 'success');
        } catch (calcError) {
          console.error('Failed to calculate result:', calcError);
          showToast('Marks saved but result calculation failed', 'warning');
        }
      } else {
        showToast('Marks saved successfully!', 'success');
      }

      setFormData({ ...formData, marks_obtained: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save marks', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Selected class (teacher's assigned class)
  const selectedClass = classes.find((c) => String(c._id) === String(formData.classId));

  // Subjects the teacher teaches in the selected class
  const teacherSubjects =
    selectedClass && selectedClass.subjects
      ? selectedClass.subjects.filter(
          (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
        )
      : [];

  // Students in the selected class (from API when class is selected - already filtered by class)
  const classStudents = Array.isArray(studentsInClass) ? studentsInClass : [];
  const studentOptions = classStudents;

  // Always show a visible name in dropdown (API may use name or user.name)
  const getStudentLabel = (stu) => {
    const name = (stu && (stu.name ?? stu.user?.name)) ? String(stu.name ?? stu.user.name).trim() : 'Student';
    const section = stu?.section ? ` (${stu.section})` : '';
    const id = stu?.student_id ?? stu?._id ?? '';
    return `${name}${section} — ID: ${id}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 style={styles.title}>Enter Marks</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {marksAlreadyEntered && (
          <div style={styles.alertBox}>
            Marks for this student and subject have already been entered. To change them, use <strong>Edit Marks</strong>.
          </div>
        )}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Class</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={(e) => {
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
                <option key={cls._id} value={cls._id != null ? String(cls._id) : ''}>
                  {cls.class_name} {cls.class_id ? `(ID: ${cls.class_id})` : ''}
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
                  {s.subject?.subject_name || '-'}
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
              disabled={!formData.classId || loadingStudentsInClass}
              style={styles.input}
            >
              <option value="">
                {loadingStudentsInClass ? 'Loading students...' : formData.classId ? 'Select student' : 'Select class first'}
              </option>
              {studentOptions.map((stu) => (
                <option key={stu._id} value={stu._id != null ? String(stu._id) : ''}>
                  {getStudentLabel(stu)}
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
              disabled={marksAlreadyEntered || checkingExisting}
              style={{ ...styles.input, ...(marksAlreadyEntered ? styles.readOnlyInput : {}) }}
            />
            {checkingExisting && <span style={styles.hint}>Checking existing marks...</span>}
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
              readOnly
              placeholder="Auto-filled from class"
              style={{ ...styles.input, ...styles.readOnlyInput }}
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

        <button
          type="submit"
          disabled={submitting || marksAlreadyEntered}
          style={{
            ...styles.button,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Saving...' : 'Save Marks'}
        </button>
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
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#555',
    cursor: 'not-allowed',
  },
  alertBox: {
    padding: '12px 16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    color: '#856404',
    fontSize: '14px',
  },
  hint: {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '4px',
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
};

export default MarksEntry;
