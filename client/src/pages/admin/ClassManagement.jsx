import { useState, useEffect } from 'react';
import { classesAPI, subjectsAPI, usersAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [teacherAssignmentData, setTeacherAssignmentData] = useState({
    teacherId: '',
    role: 'assigned', // 'class_teacher' or 'assigned'
  });
  const [formData, setFormData] = useState({
    class_id: '',
    class_name: '',
  });
  const [subjectFormData, setSubjectFormData] = useState({
    subject: '',
    teacher: '',
  });
  const [editSubjectFormData, setEditSubjectFormData] = useState({
    teacher: '',
  });
  const [semesterFormData, setSemesterFormData] = useState({
    semester_name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, subjectsRes, usersRes] = await Promise.all([
        classesAPI.getAll(),
        subjectsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      
      // Handle response format - axios wraps responses in .data
      const classesData = Array.isArray(classesRes.data) ? classesRes.data : classesRes.data?.data || classesRes.data || [];
      const subjectsData = Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data?.data || subjectsRes.data || [];
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || usersRes.data || [];
      
      setClasses(classesData);
      setSubjects(subjectsData);
      setTeachers(usersData.filter((u) => u.role === 'teacher'));
      setError('');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load data';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'class_id'
        ? Number(e.target.value)
        : e.target.value,
    });
  };

  const handleSubjectInputChange = (e) => {
    setSubjectFormData({
      ...subjectFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingClass) {
        if (!editingClass._id) {
          console.error('No class ID provided for update');
          showToast('Error: No class ID provided', 'error');
          return;
        }
        console.log('Updating class:', editingClass._id, formData);
        console.log('Full URL will be:', `/api/classes/${editingClass._id}`);
        const response = await classesAPI.update(editingClass._id, formData);
        console.log('Update response:', response);
        showToast('Class updated successfully!', 'success');
      } else {
        console.log('Creating class:', formData);
        const response = await classesAPI.create(formData);
        console.log('Create response:', response);
        showToast('Class created successfully!', 'success');
      }
      setShowModal(false);
      setEditingClass(null);
      setFormData({ class_id: '', class_name: '' });
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || `Failed to save class (Status: ${error.response?.status || 'Unknown'})`;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await classesAPI.addSubject(selectedClass._id, subjectFormData);
      showToast('Subject added successfully!', 'success');
      setShowSubjectModal(false);
      setSubjectFormData({ subject: '', teacher: '' });
      setSelectedClass(null);
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add subject';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleEdit = (classItem) => {
    console.log('Editing class:', classItem);
    setEditingClass(classItem);
    setFormData({
      class_id: classItem.class_id,
      class_name: classItem.class_name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error('No class ID provided for deletion');
      showToast('Error: No class ID provided', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;
    
    try {
      console.log('Deleting class with ID:', id);
      console.log('Full URL will be:', `/api/classes/${id}`);
      const response = await classesAPI.delete(id);
      console.log('Delete response:', response);
      showToast('Class deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || `Failed to delete class (Status: ${error.response?.status || 'Unknown'})`;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleRemoveSubject = async (classId, subjectId) => {
    if (!window.confirm('Are you sure you want to remove this subject from the class?')) return;

    try {
      await classesAPI.removeSubject(classId, subjectId);
      showToast('Subject removed successfully!', 'success');
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove subject';
      showToast(errorMsg, 'error');
    }
  };

  const handleEditSubject = (classItem, subjectItem) => {
    setSelectedClass(classItem);
    setEditingSubject(subjectItem);
    setEditSubjectFormData({
      teacher: subjectItem.teacher?._id || subjectItem.teacher || '',
    });
    setShowEditSubjectModal(true);
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await classesAPI.updateSubject(selectedClass._id, editingSubject._id, editSubjectFormData);
      showToast('Subject updated successfully!', 'success');
      setShowEditSubjectModal(false);
      setSelectedClass(null);
      setEditingSubject(null);
      setEditSubjectFormData({ teacher: '' });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update subject';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ class_id: '', class_name: '' });
    setError('');
    console.log('Modal closed, form reset');
  };

  const handleCloseSubjectModal = () => {
    setShowSubjectModal(false);
    setSelectedClass(null);
    setSubjectFormData({ subject: '', teacher: '' });
    setError('');
  };

  const handleCloseEditSubjectModal = () => {
    setShowEditSubjectModal(false);
    setSelectedClass(null);
    setEditingSubject(null);
    setEditSubjectFormData({ teacher: '' });
    setError('');
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    setError('');

    if (!teacherAssignmentData.teacherId) {
      showToast('Please select a teacher', 'error');
      return;
    }

    try {
      await classesAPI.assignTeacher(
        selectedClass._id,
        teacherAssignmentData.teacherId,
        teacherAssignmentData.role
      );
      showToast(
        teacherAssignmentData.role === 'class_teacher'
          ? 'Class teacher assigned successfully!'
          : 'Teacher assigned to class successfully!',
        'success'
      );
      setShowAssignTeacherModal(false);
      setSelectedClass(null);
      setTeacherAssignmentData({ teacherId: '', role: 'assigned' });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to assign teacher';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleRemoveTeacher = async (classId, teacherId, role = 'assigned') => {
    if (!window.confirm(`Are you sure you want to remove this teacher from the class?`)) return;

    try {
      await classesAPI.removeTeacher(classId, teacherId, role);
      showToast('Teacher removed from class successfully!', 'success');
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove teacher';
      showToast(errorMsg, 'error');
    }
  };

  const handleOpenAssignTeacherModal = (classItem) => {
    setSelectedClass(classItem);
    setTeacherAssignmentData({ teacherId: '', role: 'assigned' });
    setShowAssignTeacherModal(true);
  };

  const handleOpenSemesterModal = (classItem, semesterItem = null) => {
    setSelectedClass(classItem);
    if (semesterItem) {
      setEditingSemester(semesterItem);
      setSemesterFormData({
        semester_name: semesterItem.semester_name,
        start_date: semesterItem.start_date
          ? new Date(semesterItem.start_date).toISOString().split('T')[0]
          : '',
        end_date: semesterItem.end_date
          ? new Date(semesterItem.end_date).toISOString().split('T')[0]
          : '',
        is_active: semesterItem.is_active || false,
      });
    } else {
      setEditingSemester(null);
      setSemesterFormData({
        semester_name: '',
        start_date: '',
        end_date: '',
        is_active: false,
      });
    }
    setShowSemesterModal(true);
  };

  const handleSubmitSemester = async (e) => {
    e.preventDefault();
    setError('');

    if (!semesterFormData.semester_name.trim()) {
      showToast('Please enter a semester name', 'error');
      return;
    }

    try {
      if (editingSemester) {
        await classesAPI.updateSemester(selectedClass._id, editingSemester._id, semesterFormData);
        showToast('Semester updated successfully!', 'success');
      } else {
        await classesAPI.addSemester(selectedClass._id, semesterFormData);
        showToast('Semester added successfully!', 'success');
      }
      setShowSemesterModal(false);
      setSelectedClass(null);
      setEditingSemester(null);
      setSemesterFormData({ semester_name: '', start_date: '', end_date: '', is_active: false });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save semester';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleRemoveSemester = async (classId, semesterId) => {
    if (!window.confirm('Are you sure you want to remove this semester from the class?')) return;

    try {
      await classesAPI.removeSemester(classId, semesterId);
      showToast('Semester removed successfully!', 'success');
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove semester';
      showToast(errorMsg, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading classes..." />;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Class Management</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Add Class
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {classes.map((classItem) => (
          <div key={classItem._id} style={styles.classCard}>
            <div style={styles.classHeader}>
              <h3 style={styles.className}>{classItem.class_name}</h3>
              <span style={styles.classId}>ID: {classItem.class_id}</span>
            </div>
            <div style={styles.teachersList}>
              <h4 style={styles.teachersTitle}>Assigned Teachers:</h4>
              {classItem.class_teacher && (
                <div style={styles.teacherItem}>
                  <span style={styles.teacherRole}>👨‍🏫 Class Teacher:</span>
                  <span style={styles.teacherName}>
                    {classItem.class_teacher?.name || '-'}
                  </span>
                  <button
                    onClick={() => handleRemoveTeacher(classItem._id, classItem.class_teacher._id || classItem.class_teacher, 'class_teacher')}
                    style={styles.removeTeacherButton}
                    title="Remove Class Teacher"
                  >
                    ✕
                  </button>
                </div>
              )}
              {classItem.assigned_teachers && classItem.assigned_teachers.length > 0 && (
                <>
                  {classItem.assigned_teachers.map((teacher) => {
                    const teacherId = teacher._id || teacher;
                    const teacherName = teacher.name || '-';
                    return (
                      <div key={teacherId} style={styles.teacherItem}>
                        <span style={styles.teacherRole}>👤 Teacher:</span>
                        <span style={styles.teacherName}>{teacherName}</span>
                        <button
                          onClick={() => handleRemoveTeacher(classItem._id, teacherId, 'assigned')}
                          style={styles.removeTeacherButton}
                          title="Remove Teacher"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
              {(!classItem.class_teacher && (!classItem.assigned_teachers || classItem.assigned_teachers.length === 0)) && (
                <p style={styles.noTeachers}>No teachers assigned</p>
              )}
              <button
                onClick={() => handleOpenAssignTeacherModal(classItem)}
                style={styles.assignTeacherButton}
              >
                + Assign Teacher
              </button>
            </div>
            <div style={styles.semestersList}>
              <h4 style={styles.semestersTitle}>Semesters:</h4>
              {classItem.semesters && classItem.semesters.length > 0 ? (
                <ul style={styles.semestersUl}>
                  {classItem.semesters.map((semester, idx) => (
                    <li key={semester._id || idx} style={styles.semesterItem}>
                      <div style={styles.semesterInfo}>
                        <strong>{semester.semester_name}</strong>
                        {semester.is_active && (
                          <span style={styles.activeSemesterBadge}>Active</span>
                        )}
                        {(semester.start_date || semester.end_date) && (
                          <span style={styles.semesterDates}>
                            {' '}
                            {semester.start_date && new Date(semester.start_date).toLocaleDateString()}
                            {semester.end_date && ' - ' + new Date(semester.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div style={styles.semesterActions}>
                        <button
                          onClick={() => handleOpenSemesterModal(classItem, semester)}
                          style={styles.editSemesterButton}
                          title="Edit Semester"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemoveSemester(classItem._id, semester._id)}
                          style={styles.removeSemesterButton}
                          title="Remove Semester"
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={styles.noSemesters}>No semesters added</p>
              )}
              <button
                onClick={() => handleOpenSemesterModal(classItem)}
                style={styles.addSemesterButton}
              >
                + Add Semester
              </button>
            </div>
            <div style={styles.subjectsList}>
              <h4 style={styles.subjectsTitle}>Subjects:</h4>
              {classItem.subjects && classItem.subjects.length > 0 ? (
                <ul style={styles.subjectsUl}>
                  {classItem.subjects.map((subj, idx) => (
                    <li key={idx} style={styles.subjectItem}>
                      <div style={styles.subjectInfo}>
                        <strong>
                          {subj.subject?.subject_name || '-'}
                        </strong>
                        {subj.teacher && (
                          <span style={styles.teacherName}>
                            {' '}
                            - Teacher: {subj.teacher?.name || 'cs'}
                          </span>
                        )}
                      </div>
                      <div style={styles.subjectActions}>
                        <button
                          onClick={() => handleEditSubject(classItem, subj)}
                          style={styles.editSubjectButton}
                          title="Edit Subject"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemoveSubject(classItem._id, subj._id)}
                          style={styles.removeSubjectButton}
                          title="Remove Subject"
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={styles.noSubjects}>No subjects assigned</p>
              )}
              <button
                onClick={() => {
                  setSelectedClass(classItem);
                  setShowSubjectModal(true);
                }}
                style={styles.addSubjectButton}
              >
                + Add Subject
              </button>
            </div>
            <div style={styles.cardActions}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('Edit button clicked for class:', classItem);
                  console.log('Class ID:', classItem._id);
                  if (!classItem._id) {
                    showToast('Error: Class ID is missing', 'error');
                    return;
                  }
                  handleEdit(classItem);
                }}
                style={styles.editButton}
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('Delete button clicked for class:', classItem);
                  console.log('Class ID:', classItem._id);
                  if (!classItem._id) {
                    showToast('Error: Class ID is missing', 'error');
                    return;
                  }
                  handleDelete(classItem._id);
                }}
                style={styles.deleteButton}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div style={styles.noData}>No classes found</div>
        )}
      </div>

      {showModal && (
        <div
          style={styles.modalOverlay}
          onClick={handleCloseModal}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Class ID</label>
                <input
                  type="number"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Class Name</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  {editingClass ? 'Update' : 'Create'}
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

      {showSubjectModal && (
        <div
          style={styles.modalOverlay}
          onClick={handleCloseSubjectModal}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              Add Subject to {selectedClass?.class_name}
            </h3>
            <form onSubmit={handleAddSubject}>
              <div style={styles.formGroup}>
                <label>Subject</label>
                <select
                  name="subject"
                  value={subjectFormData.subject}
                  onChange={handleSubjectInputChange}
                  required
                  style={styles.input}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Teacher (Optional)</label>
                <select
                  name="teacher"
                  value={subjectFormData.teacher}
                  onChange={handleSubjectInputChange}
                  style={styles.input}
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Add Subject
                </button>
                <button
                  type="button"
                  onClick={handleCloseSubjectModal}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSubjectModal && (
        <div
          style={styles.modalOverlay}
          onClick={handleCloseEditSubjectModal}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              Edit Subject in {selectedClass?.class_name}
            </h3>
            <form onSubmit={handleUpdateSubject}>
              <div style={styles.formGroup}>
                <label>Subject</label>
                <input
                  type="text"
                  value={editingSubject?.subject?.subject_name || '-'}
                  disabled
                  style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Teacher</label>
                <select
                  name="teacher"
                  value={editSubjectFormData.teacher}
                  onChange={(e) => setEditSubjectFormData({ teacher: e.target.value })}
                  style={styles.input}
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditSubjectModal}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignTeacherModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            setShowAssignTeacherModal(false);
            setSelectedClass(null);
            setTeacherAssignmentData({ teacherId: '', role: 'assigned' });
          }}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              Assign Teacher to {selectedClass?.class_name}
            </h3>
            <form onSubmit={handleAssignTeacher}>
              <div style={styles.formGroup}>
                <label>Teacher</label>
                <select
                  name="teacherId"
                  value={teacherAssignmentData.teacherId}
                  onChange={(e) =>
                    setTeacherAssignmentData({
                      ...teacherAssignmentData,
                      teacherId: e.target.value,
                    })
                  }
                  required
                  style={styles.input}
                >
                  <option value="">Select Teacher</option>
                  {teachers
                    .filter((teacher) => {
                      // Exclude already assigned teachers
                      const teacherId = teacher._id;
                      const isClassTeacher =
                        selectedClass?.class_teacher &&
                        (selectedClass.class_teacher._id === teacherId ||
                          selectedClass.class_teacher === teacherId);
                      const isAssigned =
                        selectedClass?.assigned_teachers?.some(
                          (t) => (t._id || t) === teacherId
                        );
                      return !isClassTeacher && !isAssigned;
                    })
                    .map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Assignment Type</label>
                <select
                  name="role"
                  value={teacherAssignmentData.role}
                  onChange={(e) =>
                    setTeacherAssignmentData({
                      ...teacherAssignmentData,
                      role: e.target.value,
                    })
                  }
                  required
                  style={styles.input}
                >
                  <option value="assigned">Assigned Teacher</option>
                  <option value="class_teacher">Class Teacher (Homeroom)</option>
                </select>
                <small style={styles.helpText}>
                  Class Teacher is the primary/homeroom teacher. Only one class teacher per class.
                </small>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Assign Teacher
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignTeacherModal(false);
                    setSelectedClass(null);
                    setTeacherAssignmentData({ teacherId: '', role: 'assigned' });
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSemesterModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            setShowSemesterModal(false);
            setSelectedClass(null);
            setEditingSemester(null);
            setSemesterFormData({ semester_name: '', start_date: '', end_date: '', is_active: false });
          }}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingSemester ? 'Edit Semester' : 'Add Semester to'} {selectedClass?.class_name}
            </h3>
            <form onSubmit={handleSubmitSemester}>
              <div style={styles.formGroup}>
                <label>Semester Name</label>
                <input
                  type="text"
                  name="semester_name"
                  value={semesterFormData.semester_name}
                  onChange={(e) =>
                    setSemesterFormData({
                      ...semesterFormData,
                      semester_name: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g., Sem1, 2024-1, Fall 2024"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Start Date (Optional)</label>
                <input
                  type="date"
                  name="start_date"
                  value={semesterFormData.start_date}
                  onChange={(e) =>
                    setSemesterFormData({
                      ...semesterFormData,
                      start_date: e.target.value,
                    })
                  }
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>End Date (Optional)</label>
                <input
                  type="date"
                  name="end_date"
                  value={semesterFormData.end_date}
                  onChange={(e) =>
                    setSemesterFormData({
                      ...semesterFormData,
                      end_date: e.target.value,
                    })
                  }
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={semesterFormData.is_active}
                    onChange={(e) =>
                      setSemesterFormData({
                        ...semesterFormData,
                        is_active: e.target.checked,
                      })
                    }
                    style={styles.checkbox}
                  />
                  Set as Active Semester
                </label>
                <small style={styles.helpText}>
                  Only one semester can be active at a time. The active semester will be used for default operations.
                </small>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  {editingSemester ? 'Update' : 'Add'} Semester
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSemesterModal(false);
                    setSelectedClass(null);
                    setEditingSemester(null);
                    setSemesterFormData({ semester_name: '', start_date: '', end_date: '', is_active: false });
                  }}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  classCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  className: {
    margin: 0,
    fontSize: '20px',
    color: '#2c3e50',
  },
  classId: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  subjectsList: {
    marginTop: '15px',
  },
  subjectsTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#34495e',
  },
  subjectsUl: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '15px',
  },
  subjectItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    color: '#555',
  },
  teacherName: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  noSubjects: {
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: '15px',
  },
  addSubjectButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
    marginTop: '10px',
  },
  teachersList: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  teachersTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#34495e',
  },
  teacherItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    gap: '10px',
  },
  teacherRole: {
    color: '#7f8c8d',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '120px',
  },
  teacherName: {
    flex: 1,
    color: '#2c3e50',
    fontWeight: '500',
  },
  removeTeacherButton: {
    padding: '4px 8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '24px',
    height: '24px',
  },
  assignTeacherButton: {
    padding: '8px 16px',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
    marginTop: '10px',
  },
  noTeachers: {
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: '10px',
  },
  helpText: {
    display: 'block',
    marginTop: '5px',
    color: '#7f8c8d',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  semestersList: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  semestersTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#34495e',
  },
  semestersUl: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '10px',
  },
  semesterItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    gap: '10px',
  },
  semesterInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  semesterDates: {
    color: '#7f8c8d',
    fontSize: '12px',
  },
  activeSemesterBadge: {
    padding: '2px 8px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
  },
  semesterActions: {
    display: 'flex',
    gap: '5px',
  },
  editSemesterButton: {
    padding: '4px 8px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  removeSemesterButton: {
    padding: '4px 8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  addSemesterButton: {
    padding: '8px 16px',
    backgroundColor: '#16a085',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
    marginTop: '10px',
  },
  noSemesters: {
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectActions: {
    display: 'flex',
    gap: '5px',
  },
  editSubjectButton: {
    padding: '4px 8px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  removeSubjectButton: {
    padding: '4px 8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  subjectItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    color: '#555',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    paddingTop: '15px',
    marginTop: '15px',
    borderTop: '2px solid #f0f0f0',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  editButtonHover: {
    backgroundColor: '#2980b9',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  deleteButtonHover: {
    backgroundColor: '#c0392b',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
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
};

export default ClassManagement;
