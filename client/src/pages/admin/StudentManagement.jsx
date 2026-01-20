import { useState, useEffect } from 'react';
import { studentsAPI, usersAPI, classesAPI } from '../../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [hoveredClass, setHoveredClass] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    user: '',
    name: '',
    class: '',
    section: '',
    dob: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, usersRes, classesRes] = await Promise.all([
        studentsAPI.getAll(),
        usersAPI.getAll(),
        classesAPI.getAll(),
      ]);
      setStudents(studentsRes.data);
      setUsers(usersRes.data.filter((u) => u.role === 'student'));
      setClasses(classesRes.data);
      
      // Expand all classes by default
      const allClassNames = [...new Set(studentsRes.data.map(s => s.class))];
      setExpandedClasses(new Set(allClassNames));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const submitData = {
        ...formData,
        student_id: Number(formData.student_id),
        dob: new Date(formData.dob),
      };

      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, submitData);
      } else {
        await studentsAPI.create(submitData);
      }
      setShowModal(false);
      setEditingStudent(null);
      setFormData({
        student_id: '',
        user: '',
        name: '',
        class: '',
        section: '',
        dob: '',
      });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      user: student.user._id || student.user,
      name: student.name,
      class: student.class,
      section: student.section,
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await studentsAPI.delete(id);
      fetchData();
    } catch (error) {
      setError('Failed to delete student');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      student_id: '',
      user: '',
      name: '',
      class: '',
      section: '',
      dob: '',
    });
    setError('');
  };

  const toggleClass = (className) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  // Group students by class
  const groupedStudents = students.reduce((acc, student) => {
    const className = student.class || 'Unassigned';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {});

  // Get all unique class names
  const allClassNames = Object.keys(groupedStudents).sort();

  // Filter classes based on selection
  const displayClasses = selectedClass === 'all' 
    ? allClassNames 
    : allClassNames.filter(c => c === selectedClass);

  // Get class options for dropdown (from both students and classes table)
  const classOptions = [
    ...new Set([
      ...allClassNames,
      ...classes.map(c => c.class_name)
    ])
  ].sort();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Student Management</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Add Student
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Class Filter */}
      <div style={styles.filterContainer}>
        <label style={styles.filterLabel}>Filter by Class:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Classes</option>
          {allClassNames.map((className) => (
            <option key={className} value={className}>
              {className} ({groupedStudents[className]?.length || 0} students)
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const allExpanded = new Set(allClassNames);
            setExpandedClasses(allExpanded);
          }}
          style={styles.expandAllButton}
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedClasses(new Set())}
          style={styles.collapseAllButton}
        >
          Collapse All
        </button>
      </div>

      {/* Class-wise Student Display */}
      <div style={styles.classContainer}>
        {displayClasses.length === 0 ? (
          <div style={styles.noData}>No students found</div>
        ) : (
          displayClasses.map((className) => {
            const classStudents = (groupedStudents[className] || []).sort((a, b) => {
              // Sort by student_id first (ascending)
              if (a.student_id !== b.student_id) {
                return (a.student_id || 0) - (b.student_id || 0);
              }
              // If student_id is the same, sort by name (ascending)
              return (a.name || '').localeCompare(b.name || '');
            });
            const isExpanded = expandedClasses.has(className);
            
            return (
              <div key={className} style={styles.classCard}>
                <div
                  style={{
                    ...styles.classHeader,
                    backgroundColor: hoveredClass === className ? '#e9ecef' : '#f8f9fa',
                  }}
                  onClick={() => toggleClass(className)}
                  onMouseEnter={() => setHoveredClass(className)}
                  onMouseLeave={() => setHoveredClass(null)}
                >
                  <div style={styles.classHeaderLeft}>
                    <span style={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <h3 style={styles.className}>{className}</h3>
                    <span style={styles.studentCount}>
                      ({classStudents.length} {classStudents.length === 1 ? 'student' : 'students'})
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.studentsTableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Section</th>
                          <th>Date of Birth</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={styles.noData}>
                              No students in this class
                            </td>
                          </tr>
                        ) : (
                          classStudents.map((student) => (
                            <tr key={student._id}>
                              <td>{student.student_id}</td>
                              <td>{student.name}</td>
                              <td>{student.section}</td>
                              <td>
                                {student.dob
                                  ? new Date(student.dob).toLocaleDateString()
                                  : 'N/A'}
                              </td>
                              <td>
                                <button
                                  onClick={() => handleEdit(student)}
                                  style={styles.editButton}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(student._id)}
                                  style={styles.deleteButton}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Student ID</label>
                <input
                  type="number"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>User Account</label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Class</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                >
                  <option value="">Select Class</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  {editingStudent ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid #dee2e6',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '24px',
    color: '#2c3e50',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filterLabel: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '200px',
  },
  expandAllButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  collapseAllButton: {
    padding: '8px 16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  classContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  classHeader: {
    padding: '15px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  classHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#666',
    minWidth: '20px',
  },
  className: {
    margin: 0,
    fontSize: '18px',
    color: '#2c3e50',
    fontWeight: '600',
  },
  studentCount: {
    fontSize: '14px',
    color: '#7f8c8d',
    fontWeight: 'normal',
  },
  studentsTableContainer: {
    padding: '20px',
  },
};

export default StudentManagement;
