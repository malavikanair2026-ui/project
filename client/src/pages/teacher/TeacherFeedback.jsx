import { useState, useEffect } from 'react';
import { classesAPI, studentsAPI, feedbackAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherFeedback = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    student: '',
    feedback: '',
    feedback_type: 'academic',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user?._id) fetchData();
  }, [user?._id]);

  useEffect(() => {
    if (selectedStudent) {
      fetchFeedbacks();
    }
  }, [selectedStudent]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
      ]);

      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await feedbackAPI.getByStudent(selectedStudent);
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      // If no feedbacks exist, that's okay
      setFeedbacks([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.student || !formData.feedback.trim()) {
      showToast('Please select a student and enter feedback', 'error');
      return;
    }

    try {
      await feedbackAPI.create({
        student: formData.student,
        teacher: user?._id,
        feedback: formData.feedback,
        feedback_type: formData.feedback_type,
      });

      showToast('Feedback sent successfully', 'success');
      setFormData({
        student: '',
        feedback: '',
        feedback_type: 'academic',
      });
      setShowForm(false);
      if (selectedStudent === formData.student) {
        fetchFeedbacks();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send feedback', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Students in teacher's classes; fallback to all students so dropdown is never empty
  const classStudents = students.filter((s) => {
    const studentClassId = s.class?._id || s.class;
    return classes.some((cls) => String(cls._id) === String(studentClassId));
  });
  const studentsForDropdown = classStudents.length > 0 ? classStudents : students;

  const selectedStudentObj = students.find((s) => s._id === selectedStudent);

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Share Feedback</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : '+ Add Feedback'}
        </button>
      </div>

      {/* Feedback Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Send Feedback to Student</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Student</label>
              <select
                name="student"
                value={formData.student}
                onChange={handleInputChange}
                style={styles.input}
                required
              >
                <option value="">Select Student</option>
                {studentsForDropdown.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} - {student.class?.class_name || student.class || 'N/A'} {student.section} (ID: {student.student_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Feedback Type</label>
              <select
                name="feedback_type"
                value={formData.feedback_type}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="general">General</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Feedback Message</label>
              <textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="5"
                required
                placeholder="Enter your feedback for the student..."
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Send Feedback
            </button>
          </form>
        </div>
      )}

      {/* View Feedbacks */}
      <div style={styles.viewSection}>
        <h3 style={styles.sectionTitle}>View Student Feedbacks</h3>
        <div style={styles.filters}>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Student to View Feedbacks</option>
            {studentsForDropdown.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} - {student.class?.class_name || student.class || 'N/A'} {student.section} (ID: {student.student_id})
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div style={styles.feedbacksList}>
            {feedbacks.length === 0 ? (
              <div style={styles.noData}>
                No feedbacks available for {selectedStudentObj?.name || 'this student'}
              </div>
            ) : (
              feedbacks.map((feedback) => (
                <div key={feedback._id} style={styles.feedbackCard}>
                  <div style={styles.feedbackHeader}>
                    <div>
                      <div style={styles.feedbackType}>{feedback.feedback_type || 'academic'}</div>
                      <div style={styles.feedbackDate}>
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.teacherName}>
                      {feedback.teacher?.name || user?.name || 'Teacher'}
                    </div>
                  </div>
                  <div style={styles.feedbackMessage}>{feedback.feedback}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '26px',
    color: '#1f2a44',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#1f8b4c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  formTitle: {
    fontSize: '18px',
    color: '#1f2a44',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2a44',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#1f2a44',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  viewSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1f2a44',
    marginBottom: '16px',
  },
  filters: {
    marginBottom: '20px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '300px',
  },
  feedbacksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  feedbackCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  feedbackType: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#1f2a44',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: '4px',
  },
  feedbackDate: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  teacherName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2a44',
  },
  feedbackMessage: {
    fontSize: '14px',
    color: '#2c3e50',
    lineHeight: '1.6',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
};

export default TeacherFeedback;
