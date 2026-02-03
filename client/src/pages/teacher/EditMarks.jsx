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
  const [filterSection, setFilterSection] = useState('');
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

      setClasses(Array.isArray(classesRes?.data) ? classesRes.data : []);
      setSubjects(Array.isArray(subjectsRes?.data) ? subjectsRes.data : []);
      const studentList = Array.isArray(studentsRes?.data) ? studentsRes.data : [];
      setStudents(studentList);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when user is available so teacher's classes load correctly
  useEffect(() => {
    if (user?._id) fetchData();
  }, [user?._id]);

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

  const getSectionValue = (s) => {
    const v = s?.section;
    const str = v === null || v === undefined ? '' : String(v).trim();
    return str || 'N/A';
  };

  const getFilteredMarks = () => {
    let filtered = marks;

    if (filterSection) {
      filtered = filtered.filter((m) => {
        const student = students.find((s) => String(s._id) === String(m.student?._id || m.student));
        const sectionValue = getSectionValue(student ?? m.student ?? {});
        return sectionValue === filterSection;
      });
    }

    return filtered;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredMarks = getFilteredMarks();
  const teacherClasses = classes.filter((cls) =>
    cls.subjects?.some((s) => String(s.teacher?._id || s.teacher) === String(user?._id))
  );
  const teacherStudents = students.filter((s) => {
    const studentClassId = s.class?._id ?? s.class;
    return teacherClasses.some((cls) => String(cls._id) === String(studentClassId));
  });
  const sectionSet = new Set(
    (teacherStudents.length > 0 ? teacherStudents : students).map((s) => getSectionValue(s))
  );
  const sections = [...sectionSet].sort((a, b) =>
    a === 'N/A' ? 1 : b === 'N/A' ? -1 : a.localeCompare(b)
  );

  // Students for dropdown: all or filtered by section, sorted by name; label: "Name (Section)"
  const studentsForDropdown = filterSection
    ? (teacherStudents.length > 0 ? teacherStudents : students).filter(
        (s) => getSectionValue(s) === filterSection
      )
    : teacherStudents.length > 0 ? teacherStudents : students;
  const allStudentsSorted = [...studentsForDropdown].sort((a, b) => {
    const nameA = (a?.name ?? a?.user?.name ?? '').toString().toLowerCase();
    const nameB = (b?.name ?? b?.user?.name ?? '').toString().toLowerCase();
    return nameA.localeCompare(nameB);
  });
  const getStudentLabel = (student) => {
    const name = (student?.name ?? student?.user?.name ?? student?.user?.email ?? '')
      .toString()
      .trim();
    const displayName = name || `Student (ID: ${student?.student_id ?? student?._id ?? ''})`;
    const section = (student?.section ?? '').toString().trim() || '-';
    return `${displayName} (${section})`;
  };

  return (
    <div>
      <h2 style={styles.title}>Edit Marks</h2>

      <div style={styles.filters}>
        <select
          value={filterSection}
          onChange={(e) => {
            setFilterSection(e.target.value);
            setFilterStudent('');
          }}
          style={styles.select}
        >
          <option value="">All Sections</option>
          {sections.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>

        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          style={styles.select}
        >
          <option value="">
            {filterSection ? 'Select Student' : 'Select section (optional)'}
          </option>
          {allStudentsSorted.map((student) => (
            <option key={student._id} value={student._id}>
              {getStudentLabel(student)}
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
                    <td>{subject?.subject_name || '-'}</td>
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
    textAlign: 'left',
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
