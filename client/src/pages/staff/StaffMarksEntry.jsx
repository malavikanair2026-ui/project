import { useState, useEffect } from 'react';
import { studentsAPI, subjectsAPI, marksAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StaffMarksEntry = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        studentsAPI.getAll(),
        subjectsAPI.getAll(),
      ]);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await marksAPI.add(formData.studentId, {
        subjectId: formData.subjectId,
        marks_obtained: Number(formData.marks_obtained),
        exam_type: formData.exam_type,
        semester: formData.semester,
        is_final: formData.is_final,
        entered_by: user._id,
      });

      // If final submission, calculate result
      if (formData.is_final) {
        try {
          await resultsAPI.calculate(formData.studentId, formData.semester);
        } catch (calcError) {
          console.error('Failed to calculate result:', calcError);
        }
      }

      setSuccess('Marks entered successfully!');
      setFormData({
        studentId: '',
        subjectId: '',
        marks_obtained: '',
        exam_type: 'final',
        semester: '',
        is_final: false,
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save marks');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Enter Marks</h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit}>
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
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} - {student.class} {student.section} (ID: {student.student_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                required
                style={styles.input}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.subject_name} (Max: {subject.max_marks})
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
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Exam Type</label>
              <select
                name="exam_type"
                value={formData.exam_type}
                onChange={handleInputChange}
                required
                style={styles.input}
              >
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Semester</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                placeholder="e.g., Sem1, 2024-1"
                style={styles.input}
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
            disabled={submitting}
            style={styles.submitButton}
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
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  success: {
    backgroundColor: '#efe',
    color: '#3c3',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default StaffMarksEntry;
