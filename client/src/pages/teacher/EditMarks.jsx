import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { classesAPI, studentsAPI, marksAPI, subjectsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const EditMarks = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [editingMark, setEditingMark] = useState(null);

  useEffect(() => {
    fetchData();
    const studentId = searchParams.get('studentId');
    if (studentId) {
      setFilterStudent(studentId);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes, subjectsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
        subjectsAPI.getAll(),
      ]);

      setClasses(classesRes.data);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterStudent) {
      fetchMarks();
    }
  }, [filterStudent, filterSemester]);

  const fetchMarks = async () => {
    try {
      const marksRes = await marksAPI.getByStudent(filterStudent, filterSemester || undefined);
      setMarks(marksRes.data || []);
    } catch (error) {
      console.error('Failed to fetch marks:', error);
      showToast('Failed to load marks', 'error');
    }
  };

  const handleEdit = (mark) => {
    setEditingMark({ ...mark });
  };

  const handleSave = async () => {
    if (!editingMark || editingMark.marks_obtained === '') {
      showToast('Please enter valid marks', 'error');
      return;
    }

    try {
      await marksAPI.add(editingMark.student?._id || editingMark.student, {
        subjectId: editingMark.subject?._id || editingMark.subject,
        marks_obtained: Number(editingMark.marks_obtained),
        exam_type: editingMark.exam_type,
        semester: editingMark.semester,
        is_final: editingMark.is_final,
      });

      showToast('Marks updated successfully', 'success');
      setEditingMark(null);
      fetchMarks();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update marks', 'error');
    }
  };

  const handleCancel = () => {
    setEditingMark(null);
  };

  const getFilteredMarks = () => {
    let filtered = marks;

    if (filterClass) {
      const classObj = classes.find((c) => c._id === filterClass);
      if (classObj) {
        filtered = filtered.filter((m) => {
          const student = students.find((s) => s._id === (m.student?._id || m.student));
          return student?.class === classObj.class_name;
        });
      }
    }

    return filtered;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredMarks = getFilteredMarks();
  const teacherClasses = classes.filter((cls) => {
    return cls.subjects?.some(
      (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
    );
  });

  return (
    <div>
      <h2 style={styles.title}>Edit Marks</h2>

      <div style={styles.filters}>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          style={styles.select}
        >
          <option value="">All Classes</option>
          {teacherClasses.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.class_name}
            </option>
          ))}
        </select>

        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          style={styles.select}
        >
          <option value="">Select Student</option>
          {students
            .filter((s) => {
              if (filterClass) {
                const classObj = classes.find((c) => c._id === filterClass);
                return s.class === classObj?.class_name;
              }
              return true;
            })
            .map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} - {student.class} {student.section} (ID: {student.student_id})
              </option>
            ))}
        </select>

        <input
          type="text"
          placeholder="Filter by semester..."
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          style={styles.input}
        />
      </div>

      {filteredMarks.length === 0 ? (
        <div style={styles.noData}>
          {filterStudent ? 'No marks found for this student' : 'Please select a student to view marks'}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Exam Type</th>
                <th>Semester</th>
                <th>Final</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.map((mark) => {
                const isEditing = editingMark?._id === mark._id;
                const subject = subjects.find((s) => s._id === (mark.subject?._id || mark.subject));
                const maxMarks = subject?.max_marks || 100;
                const percentage = ((mark.marks_obtained / maxMarks) * 100).toFixed(1);

                return (
                  <tr key={mark._id}>
                    <td>{subject?.subject_name || 'Unknown'}</td>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            type="number"
                            value={editingMark.marks_obtained}
                            onChange={(e) =>
                              setEditingMark({
                                ...editingMark,
                                marks_obtained: e.target.value,
                              })
                            }
                            min="0"
                            max={maxMarks}
                            style={styles.editInput}
                          />
                        </td>
                        <td>{maxMarks}</td>
                        <td>
                          {editingMark.marks_obtained
                            ? ((editingMark.marks_obtained / maxMarks) * 100).toFixed(1)
                            : '0.0'}%
                        </td>
                        <td>
                          <select
                            value={editingMark.exam_type}
                            onChange={(e) =>
                              setEditingMark({ ...editingMark, exam_type: e.target.value })
                            }
                            style={styles.editSelect}
                          >
                            <option value="final">Final</option>
                            <option value="midterm">Midterm</option>
                            <option value="assignment">Assignment</option>
                            <option value="quiz">Quiz</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingMark.semester}
                            onChange={(e) =>
                              setEditingMark({ ...editingMark, semester: e.target.value })
                            }
                            style={styles.editInput}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={editingMark.is_final}
                            onChange={(e) =>
                              setEditingMark({ ...editingMark, is_final: e.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <div style={styles.actionButtons}>
                            <button onClick={handleSave} style={styles.saveButton}>
                              Save
                            </button>
                            <button onClick={handleCancel} style={styles.cancelButton}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{mark.marks_obtained}</td>
                        <td>{maxMarks}</td>
                        <td>{percentage}%</td>
                        <td>{mark.exam_type}</td>
                        <td>{mark.semester || 'N/A'}</td>
                        <td>{mark.is_final ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(mark)}
                            style={styles.editButton}
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '26px',
    marginBottom: '20px',
    color: '#1f2a44',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
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
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#1f2a44',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
  editInput: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '80px',
  },
  editSelect: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#1f2a44',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  saveButton: {
    padding: '6px 12px',
    backgroundColor: '#1f8b4c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#7f8c8d',
  },
};

export default EditMarks;
