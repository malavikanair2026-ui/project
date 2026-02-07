import { useState, useEffect } from 'react';
import { coursesAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Admin: Manage Courses (top of hierarchy: Course → Department → Class → Student).
 * Examples: BSc, BCA, BE, MCA.
 */
const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ course_name: '', course_code: '' });
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await coursesAPI.getAll();
      setCourses(Array.isArray(res.data) ? res.data : res.data?.data || []);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load courses';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingCourse) {
        await coursesAPI.update(editingCourse._id, formData);
        showToast('Course updated successfully!', 'success');
      } else {
        await coursesAPI.create(formData);
        showToast('Course created successfully!', 'success');
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ course_name: '', course_code: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save course';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name || '',
      course_code: course.course_code || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? This will fail if any departments are linked to it.')) return;
    try {
      await coursesAPI.delete(id);
      showToast('Course deleted successfully!', 'success');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete course';
      showToast(msg, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData({ course_name: '', course_code: '' });
    setError('');
  };

  if (loading) return <LoadingSpinner message="Loading courses..." />;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Course Management</h2>
        <button onClick={() => { setEditingCourse(null); setFormData({ course_name: '', course_code: '' }); setShowModal(true); }} style={styles.addButton}>
          + Add Course
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.grid}>
        {courses.map((c) => (
          <div key={c._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{c.course_name}</h3>
              {c.course_code && <span style={styles.code}>{c.course_code}</span>}
            </div>
            <div style={styles.cardActions}>
              <button type="button" onClick={() => handleEdit(c)} style={styles.editButton}>Edit</button>
              <button type="button" onClick={() => handleDelete(c._id)} style={styles.deleteButton}>Delete</button>
            </div>
          </div>
        ))}
        {courses.length === 0 && <div style={styles.noData}>No courses yet. Add a course (e.g. BSc, BCA, BE, MCA).</div>}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Course Name</label>
                <input type="text" name="course_name" value={formData.course_name} onChange={handleInputChange} required style={styles.input} placeholder="e.g. Bachelor of Science" />
              </div>
              <div style={styles.formGroup}>
                <label>Course Code (optional)</label>
                <input type="text" name="course_code" value={formData.course_code} onChange={handleInputChange} style={styles.input} placeholder="e.g. BSc, BCA" />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>{editingCourse ? 'Update' : 'Create'}</button>
                <button type="button" onClick={handleCloseModal} style={styles.cancelButton}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '28px', color: '#2c3e50', margin: 0 },
  addButton: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' },
  error: { backgroundColor: '#fee', color: '#c33', padding: '12px', borderRadius: '4px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' },
  cardTitle: { margin: 0, fontSize: '20px', color: '#2c3e50' },
  code: { color: '#7f8c8d', fontSize: '14px' },
  cardActions: { display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '2px solid #f0f0f0' },
  editButton: { padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', flex: 1 },
  deleteButton: { padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', flex: 1 },
  noData: { textAlign: 'center', padding: '40px', color: '#7f8c8d', backgroundColor: 'white', borderRadius: '8px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' },
  modalTitle: { marginTop: 0, marginBottom: '20px', fontSize: '24px', color: '#2c3e50' },
  formGroup: { marginBottom: '20px' },
  input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' },
  saveButton: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  cancelButton: { padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
};

export default CourseManagement;
