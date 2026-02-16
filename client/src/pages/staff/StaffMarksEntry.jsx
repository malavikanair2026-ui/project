import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentsAPI, classesAPI, marksAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StaffMarksEntry = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    marks_obtained: '',
    exam_type: 'final',
    semester: '',
    is_final: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marksAlreadyEntered, setMarksAlreadyEntered] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
    // Pre-select student from URL parameter
    const studentIdParam = searchParams.get('studentId');
    if (studentIdParam) {
      setFormData((prev) => ({ ...prev, studentId: studentIdParam }));
    }
  }, [searchParams]);

  // Auto-fill semester with the selected student's class active semester
  useEffect(() => {
    if (!formData.studentId || !classes.length) return;
    const student = students.find((s) => String(s._id) === String(formData.studentId));
    const classId = student?.class?._id ?? student?.class;
    if (!classId) return;
    const cls = classes.find((c) => String(c._id) === String(classId));
    const semesters = cls?.semesters;
    if (!Array.isArray(semesters) || semesters.length === 0) return;
    const active = semesters.find((s) => s.is_active === true);
    const semesterName = active?.semester_name ?? semesters[0]?.semester_name ?? '';
    if (semesterName && formData.semester !== semesterName) {
      setFormData((prev) => ({ ...prev, semester: semesterName }));
    }
  }, [formData.studentId, classes, students]);

  // Enter Marks: each student's marks for a given subject can be entered only once.
  useEffect(() => {
    const { studentId, subjectId, semester, exam_type } = formData;
    if (!studentId || !subjectId || !semester) {
      setMarksAlreadyEntered(false);
      return;
    }
    let cancelled = false;
    setCheckingExisting(true);
    marksAPI
      .getByStudent(studentId, semester)
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
      const [studentsRes, classesRes] = await Promise.all([
        studentsAPI.getAll(),
        classesAPI.getAll(),
      ]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updates = { [name]: type === 'checkbox' ? checked : value };
    if (name === 'studentId') {
      updates.subjectId = '';
      if (!value) updates.semester = '';
    }
    setFormData({ ...formData, ...updates });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (marksAlreadyEntered) {
        showToast('Marks for this student and subject have already been entered. Use Edit Marks to change them.', 'error');
        setSubmitting(false);
        return;
      }
      await marksAPI.add(formData.studentId, {
        subjectId: formData.subjectId,
        marks_obtained: Number(formData.marks_obtained),
        exam_type: formData.exam_type,
        semester: formData.semester,
        is_final: formData.is_final,
      });

      // If final submission, calculate result
      if (formData.is_final) {
        try {
          await resultsAPI.calculate(formData.studentId, formData.semester);
          showToast('Marks entered and result calculated successfully!', 'success');
        } catch (calcError) {
          console.error('Failed to calculate result:', calcError);
          showToast('Marks saved but result calculation failed', 'warning');
        }
      } else {
        showToast('Marks entered successfully!', 'success');
      }

      setFormData({
        studentId: '',
        subjectId: '',
        marks_obtained: '',
        exam_type: 'final',
        semester: '',
        is_final: false,
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save marks', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Group students class-wise: by class name, then sort students within each class
  const getClassKey = (s) => String(s.class?._id ?? s.class ?? '');
  const getClassName = (s) => (s.class?.class_name ?? s.class ?? 'No Class').toString().trim();
  const studentsByClass = (Array.isArray(students) ? students : []).reduce((acc, s) => {
    const key = getClassKey(s);
    if (!acc[key]) acc[key] = { name: getClassName(s), students: [] };
    acc[key].students.push(s);
    return acc;
  }, {});
  const classKeysOrdered = Object.keys(studentsByClass).sort((a, b) =>
    (studentsByClass[a].name || '').localeCompare(studentsByClass[b].name || '')
  );
  classKeysOrdered.forEach((key) => {
    studentsByClass[key].students.sort((a, b) => {
      const nameA = (a.name ?? a.user?.name ?? '').toString().toLowerCase();
      const nameB = (b.name ?? b.user?.name ?? '').toString().toLowerCase();
      return nameA.localeCompare(nameB) || ((a.section ?? '') + (a.student_id ?? '')).localeCompare((b.section ?? '') + (b.student_id ?? ''));
    });
  });

  // Subjects for the selected student's class only
  const selectedStudent = students.find((s) => String(s._id) === String(formData.studentId));
  const selectedClassId = selectedStudent?.class?._id ?? selectedStudent?.class;
  const selectedClass = classes.find((c) => String(c._id) === String(selectedClassId));
  const subjectsForClass = Array.isArray(selectedClass?.subjects)
    ? selectedClass.subjects
        .map((s) => s.subject)
        .filter(Boolean)
    : [];

  if (loading) {
    return <LoadingSpinner message="Loading form..." />;
  }

  return (
    <div>
      <h2 style={styles.title}>Enter Marks</h2>

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {marksAlreadyEntered && (
            <div style={styles.alertBox}>
              Marks for this student and subject have already been entered. To change them, use <strong>Edit Marks</strong>.
            </div>
          )}
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Student</label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                required
                style={styles.input}
              >
                <option value="">Select Student</option>
                {classKeysOrdered.map((classKey) => {
                  const { name: className, students: classStudents } = studentsByClass[classKey];
                  return (
                    <optgroup key={classKey} label={className || 'Other'}>
                      {classStudents.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} {student.section ? `— ${student.section}` : ''} (ID: {student.student_id})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                required
                disabled={!formData.studentId}
                style={styles.input}
              >
                <option value="">
                  {formData.studentId ? 'Select Subject' : 'Select student first'}
                </option>
                {subjectsForClass.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.subject_name} (Max: {subject.max_marks ?? 100})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Marks Obtained</label>
              <input
                type="number"
                name="marks_obtained"
                value={formData.marks_obtained}
                onChange={handleInputChange}
                required
                min="0"
                disabled={marksAlreadyEntered || checkingExisting}
                style={{
                  ...styles.input,
                  ...(marksAlreadyEntered ? { backgroundColor: '#f5f5f5', color: '#555', cursor: 'not-allowed' } : {}),
                }}
              />
              {checkingExisting && <span style={styles.hint}>Checking existing marks...</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Semester</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                readOnly
                placeholder="Auto-filled from class"
                style={{ ...styles.input, backgroundColor: '#f5f5f5', color: '#555', cursor: 'not-allowed' }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_final"
                  checked={formData.is_final}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                Final Submission (Calculate Result)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || marksAlreadyEntered}
            style={{
              ...styles.submitButton,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving...' : 'Save Marks'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    marginTop: '28px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  alertBox: {
    padding: '12px 16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    color: '#856404',
    fontSize: '14px',
    marginBottom: '20px',
  },
  hint: {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '4px',
  },
  submitButton: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default StaffMarksEntry;
