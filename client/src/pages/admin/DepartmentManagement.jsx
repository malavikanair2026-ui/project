import { useState, useEffect } from 'react';
import { departmentsAPI, coursesAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Admin: Manage Departments under a Course (Course → Department → Class → Student).
 * Examples: CSE, ECE, IT, Mechanical.
 */
const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({ department_name: '', department_code: '', course: '' });
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, courseRes] = await Promise.all([
        departmentsAPI.getAll(),
        coursesAPI.getAll(),
      ]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data || []);
      setCourses(Array.isArray(courseRes.data) ? courseRes.data : courseRes.data?.data || []);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load data';
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
    if (!formData.course) {
      setError('Please select a course');
      showToast('Please select a course', 'error');
      return;
    }
    try {
      if (editingDepartment) {
        await departmentsAPI.update(editingDepartment._id, formData);
        showToast('Department updated successfully!', 'success');
      } else {
        await departmentsAPI.create(formData);
        showToast('Department created successfully!', 'success');
      }
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ department_name: '', department_code: '', course: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save department';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const handleEdit = (dept) => {
    setEditingDepartment(dept);
    setFormData({
      department_name: dept.department_name || '',
      department_code: dept.department_code || '',
      course: dept.course?._id || dept.course || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? This will fail if any classes are linked to it.')) return;
    try {
      await departmentsAPI.delete(id);
      showToast('Department deleted successfully!', 'success');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete department';
      showToast(msg, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ department_name: '', department_code: '', course: '' });
    setError('');
  };

  if (loading) return <LoadingSpinner message="Loading departments..." />;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Department Management</h2>
        <button onClick={() => { setEditingDepartment(null); setFormData({ department_name: '', department_code: '', course: '' }); setShowModal(true); }} style={styles.addButton}>
          + Add Department
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.grid}>
        {departments.map((d) => (
          <div key={d._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{d.department_name}</h3>
              {d.department_code && <span style={styles.code}>{d.department_code}</span>}
            </div>
            <p style={styles.courseName}>Course: {d.course?.course_name || d.course || '-'}</p>
            <div style={styles.cardActions}>
              <button type="button" onClick={() => handleEdit(d)} style={styles.editButton}>Edit</button>
              <button type="button" onClick={() => handleDelete(d._id)} style={styles.deleteButton}>Delete</button>
            </div>
          </div>
        ))}
        {departments.length === 0 && <div style={styles.noData}>No departments yet. Add a course first, then add departments (e.g. CSE, ECE, IT).</div>}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editingDepartment ? 'Edit Department' : 'Add Department'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Course *</label>
                <select name="course" value={formData.course} onChange={handleInputChange} required style={styles.input}>
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.course_name} {c.course_code ? `(${c.course_code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Department Name</label>
                <input type="text" name="department_name" value={formData.department_name} onChange={handleInputChange} required style={styles.input} placeholder="e.g. Computer Science" />
              </div>
              <div style={styles.formGroup}>
                <label>Department Code (optional)</label>
                <input type="text" name="department_code" value={formData.department_code} onChange={handleInputChange} style={styles.input} placeholder="e.g. CSE, ECE" />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>{editingDepartment ? 'Update' : 'Create'}</button>
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
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '2px solid #f0f0f0' },
  cardTitle: { margin: 0, fontSize: '20px', color: '#2c3e50' },
  code: { color: '#7f8c8d', fontSize: '14px' },
  courseName: { margin: '0 0 15px 0', fontSize: '14px', color: '#7f8c8d' },
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

export default DepartmentManagement;
