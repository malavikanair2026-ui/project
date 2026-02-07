import { useState, useEffect } from 'react';
import { studentsAPI, usersAPI, classesAPI, coursesAPI, departmentsAPI } from '../../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [hoveredClass, setHoveredClass] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    user: '',
    name: '',
    course: '',
    department: '',
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
      const [studentsRes, usersRes, classesRes, coursesRes, departmentsRes] = await Promise.all([
        studentsAPI.getAll(),
        usersAPI.getAll(),
        classesAPI.getAll(),
        coursesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      setStudents(studentsRes.data);
      setUsers(usersRes.data.filter((u) => u.role === 'student'));
      setClasses(classesRes.data);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || []);
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : departmentsRes.data?.data || []);
      const allClassNames = [...new Set(
        studentsRes.data
          .map(s => s.class?.class_name || s.class?._id || 'CS')
          .filter(Boolean)
      )];
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

    const classVal = (formData.class || '').trim();
    if (!classVal) {
      setError('Please select a class');
      return;
    }
    const submitData = {
      ...formData,
      class: formData.class,
      course: formData.course || undefined,
      department: formData.department || undefined,
      student_id: Number(formData.student_id),
      dob: formData.dob ? new Date(formData.dob) : null,
    };

    try {
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
        course: '',
        department: '',
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
      user: student.user?._id || student.user || '',
      name: student.name,
      course: student.course?._id || student.course || '',
      department: student.department?._id || student.department || '',
      class: student.class?._id || student.class || '',
      section: student.section,
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError('Invalid student');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this student? All marks, results, and related data will be removed.')) return;

    setError('');
    try {
      await studentsAPI.delete(id);
      setError('');
      await fetchData();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete student';
      setError(message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      student_id: '',
      user: '',
      name: '',
      course: '',
      department: '',
      class: '',
      section: '',
      dob: '',
    });
    setError('');
  };

  // Dependent dropdowns: classes filtered by selected department in form
  const formDepartmentId = formData.department;
  const formCourseId = formData.course;
  const classesForForm = formDepartmentId
    ? classes.filter((c) => (c.department?._id || c.department) === formDepartmentId)
    : classes;
  const departmentsForForm = formCourseId
    ? departments.filter((d) => (d.course?._id || d.course) === formCourseId)
    : departments;

  const toggleClass = (className) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  // Filter students by course, department, class, section
  let filteredStudents = students;
  if (selectedCourse !== 'all') {
    filteredStudents = filteredStudents.filter((s) => (s.course?._id || s.course) === selectedCourse);
  }
  if (selectedDepartment !== 'all') {
    filteredStudents = filteredStudents.filter((s) => (s.department?._id || s.department) === selectedDepartment);
  }
  if (selectedClass !== 'all') {
    filteredStudents = filteredStudents.filter((s) => String(s.class?._id || s.class) === String(selectedClass));
  }
  if (selectedSection !== 'all') {
    filteredStudents = filteredStudents.filter((s) => s.section === selectedSection);
  }

  // Group students by class (key = class name for display)
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const className = student.class?.class_name || student.class?._id || 'CS';
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const allClassNames = Object.keys(groupedStudents).sort();
  const displayClasses = selectedClass === 'all'
    ? allClassNames
    : (() => {
        const cls = classes.find((c) => String(c._id) === String(selectedClass));
        const name = cls?.class_name;
        return name && groupedStudents[name] ? [name] : name ? [name] : [];
      })();

  // Class options for form: filtered by selected department (dependent dropdown)
  const classOptions = classesForForm.map((c) => ({ _id: c._id, class_name: c.class_name }));

  // When adding, only show users with role student who don't already have a student record
  const linkedUserIds = new Set(
    students.map(s => (s.user?._id || s.user)).filter(Boolean)
  );
  const availableUsers = users.filter(u => !linkedUserIds.has(u._id));

  // Get unique sections from students
  const uniqueSections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Student Management</h2>
        <button
          onClick={() => {
            setEditingStudent(null);
            setFormData({
              student_id: '',
              user: '',
              name: '',
              course: '',
              department: '',
              class: '',
              section: '',
              dob: '',
            });
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          + Add Student
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Filters: Course → Department → Class → Section */}
      <div style={styles.filterContainer}>
        <label style={styles.filterLabel}>Course:</label>
        <select
          value={selectedCourse}
          onChange={(e) => { setSelectedCourse(e.target.value); setSelectedDepartment('all'); setSelectedClass('all'); }}
          style={styles.filterSelect}
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.course_name} {c.course_code ? `(${c.course_code})` : ''}</option>
          ))}
        </select>
        <label style={styles.filterLabel}>Department:</label>
        <select
          value={selectedDepartment}
          onChange={(e) => { setSelectedDepartment(e.target.value); setSelectedClass('all'); }}
          style={styles.filterSelect}
        >
          <option value="all">All Departments</option>
          {(selectedCourse === 'all' ? departments : departments.filter((d) => (d.course?._id || d.course) === selectedCourse)).map((d) => (
            <option key={d._id} value={d._id}>{d.department_name} {d.department_code ? `(${d.department_code})` : ''}</option>
          ))}
        </select>
        <label style={styles.filterLabel}>Class:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Classes</option>
          {(() => {
            let classesFiltered = classes;
            if (selectedDepartment !== 'all') {
              classesFiltered = classes.filter((c) => String(c.department?._id || c.department) === String(selectedDepartment));
            } else if (selectedCourse !== 'all') {
              const deptIds = departments.filter((d) => String(d.course?._id || d.course) === String(selectedCourse)).map((d) => d._id);
              classesFiltered = classes.filter((c) => deptIds.includes(c.department?._id || c.department));
            }
            const studentsBeforeClassFilter = selectedCourse !== 'all' || selectedDepartment !== 'all' || selectedSection !== 'all'
              ? students.filter((s) => {
                  if (selectedCourse !== 'all' && (s.course?._id || s.course) !== selectedCourse) return false;
                  if (selectedDepartment !== 'all' && (s.department?._id || s.department) !== selectedDepartment) return false;
                  if (selectedSection !== 'all' && s.section !== selectedSection) return false;
                  return true;
                })
              : students;
            return classesFiltered.map((c) => {
              const count = studentsBeforeClassFilter.filter((s) => String(s.class?._id || s.class) === String(c._id)).length;
              return (
                <option key={c._id} value={c._id}>
                  {c.class_name} ({count} students)
                </option>
              );
            });
          })()}
        </select>
        <label style={styles.filterLabel}>Section:</label>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Sections</option>
          {uniqueSections.map((section) => (
            <option key={section} value={section}>
              {section}
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
            
            // Get class name for display
            const displayClassName = className === 'CS' 
              ? 'CS' 
              : (classes.find(c => c._id === className || c.class_name === className)?.class_name || className);
            
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
                    <h3 style={styles.className}>{displayClassName}</h3>
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
                          <th style={styles.th}>Student ID</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Section</th>
                          <th style={styles.th}>Date of Birth</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ ...styles.td, ...styles.noData, textAlign: 'left' }}>
                              No students in this class
                            </td>
                          </tr>
                        ) : (
                          classStudents.map((student) => (
                            <tr key={student._id}>
                              <td style={styles.td}>{student.student_id}</td>
                              <td style={styles.td}>{student.name}</td>
                              <td style={styles.td}>{student.section}</td>
                              <td style={styles.td}>
                                {student.dob
                                  ? new Date(student.dob).toLocaleDateString()
                                  : 'N/A'}
                              </td>
                              <td style={styles.td}>
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
                  <option value="">
                    {editingStudent
                      ? 'Select User'
                      : availableUsers.length === 0
                        ? 'No available users (create a user with role Student first)'
                        : 'Select User'}
                  </option>
                  {(editingStudent ? users : availableUsers).map((user) => (
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
                <label>Course</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormData((prev) => ({ ...prev, department: '', class: '' }));
                  }}
                  style={styles.input}
                >
                  <option value="">Select Course (optional)</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.course_name} {c.course_code ? `(${c.course_code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormData((prev) => ({ ...prev, class: '' }));
                  }}
                  style={styles.input}
                >
                  <option value="">Select Department (optional)</option>
                  {departmentsForForm.map((d) => (
                    <option key={d._id} value={d._id}>{d.department_name} {d.department_code ? `(${d.department_code})` : ''}</option>
                  ))}
                </select>
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
                  {classOptions.length ? classOptions.map((classObj) => (
                    <option key={classObj._id} value={classObj._id}>
                      {classObj.class_name}
                    </option>
                  )) : classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.class_name}</option>
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
    textAlign: 'left',
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
