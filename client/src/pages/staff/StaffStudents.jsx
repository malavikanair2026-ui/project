import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsAPI, marksAPI, coursesAPI, departmentsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StaffStudents = () => {
  const [students, setStudents] = useState([]);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClasses, setExpandedClasses] = useState({});
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes, departmentsRes] = await Promise.all([
        studentsAPI.getAll(),
        coursesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      const studentList = Array.isArray(studentsRes?.data) ? studentsRes.data : [];
      setStudents(studentList);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || []);
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : departmentsRes.data?.data || []);

      const ids = studentList.map((s) => s._id).filter(Boolean);
      if (ids.length > 0) {
        const marksRes = await marksAPI.getByStudentIds(ids);
        setMarksByStudent(typeof marksRes?.data === 'object' && marksRes.data !== null ? marksRes.data : {});
      } else {
        setMarksByStudent({});
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load students', 'error');
      setStudents([]);
      setMarksByStudent({});
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    let filtered = students;

    if (filterCourse) {
      filtered = filtered.filter((s) => (s.course?._id || s.course) === filterCourse);
    }
    if (filterDepartment) {
      filtered = filtered.filter((s) => (s.department?._id || s.department) === filterDepartment);
    }
    if (filterClass) {
      filtered = filtered.filter((s) => {
        const studentClassName = s.class?.class_name || s.class;
        return studentClassName === filterClass;
      });
    }
    if (filterSection) {
      filtered = filtered.filter((s) => s.section === filterSection);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.student_id?.toLowerCase().includes(term) ||
          (s.class?.class_name || s.class)?.toLowerCase?.()?.includes?.(term)
      );
    }

    return filtered;
  };

  const getStudentMarks = (studentId) => {
    if (!studentId) return [];
    const id = typeof studentId === 'string' ? studentId : studentId.toString();
    const list = marksByStudent[id];
    return Array.isArray(list) ? list : [];
  };

  const groupStudentsByClass = (studentList) => {
    const grouped = {};
    studentList.forEach((student) => {
      const className = student.class?.class_name || student.class || 'CS';
      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(student);
    });

    Object.keys(grouped).forEach((className) => {
      grouped[className].sort((a, b) => {
        if (a.student_id < b.student_id) return -1;
        if (a.student_id > b.student_id) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  };

  const toggleClass = (className) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [className]: !prev[className],
    }));
  };

  const handleEnterMarks = (studentId) => {
    navigate(`/staff/marks?studentId=${studentId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredStudents = getFilteredStudents();
  const groupedStudents = groupStudentsByClass(filteredStudents);
  const uniqueClasses = [...new Set(students.map((s) => s.class?.class_name || s.class).filter(Boolean))].sort();
  
  // Get unique sections from filtered students (by class if selected)
  const studentsForSectionFilter = filterClass
    ? students.filter((s) => {
        const studentClassName = s.class?.class_name || s.class;
        return studentClassName === filterClass;
      })
    : students;
  const uniqueSections = [...new Set(studentsForSectionFilter.map(s => s.section).filter(Boolean))].sort();

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Students List</h2>
        <div style={styles.actions}>
          <input
            type="text"
            placeholder="Search by name, ID, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setFilterDepartment(''); }}
            style={styles.select}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.course_name} {c.course_code ? `(${c.course_code})` : ''}</option>
            ))}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={styles.select}
          >
            <option value="">All Departments</option>
            {(filterCourse ? departments.filter((d) => (d.course?._id || d.course) === filterCourse) : departments).map((d) => (
              <option key={d._id} value={d._id}>{d.department_name} {d.department_code ? `(${d.department_code})` : ''}</option>
            ))}
          </select>
          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setFilterSection('');
            }}
            style={styles.select}
          >
            <option value="">All Classes</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            style={styles.select}
          >
            <option value="">All Sections</option>
            {uniqueSections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{students.length}</div>
          <div style={styles.statLabel}>Total Students</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{Object.keys(groupedStudents).length}</div>
          <div style={styles.statLabel}>Classes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{filteredStudents.length}</div>
          <div style={styles.statLabel}>Filtered Results</div>
        </div>
      </div>

      {Object.keys(groupedStudents).length === 0 ? (
        <div style={styles.noData}>
          <p>No students found</p>
        </div>
      ) : (
        <div style={styles.classList}>
          {Object.entries(groupedStudents)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([className, classStudents]) => (
              <div key={className} style={styles.classCard}>
                <div
                  style={styles.classHeader}
                  onClick={() => toggleClass(className)}
                >
                  <div style={styles.classHeaderLeft}>
                    <span style={styles.classIcon}>
                      {expandedClasses[className] ? '📂' : '📁'}
                    </span>
                    <div>
                      <span style={styles.className}>{className}</span>
                      <span style={styles.classCount}>
                        ({classStudents.length} students)
                      </span>
                    </div>
                  </div>
                  <span style={styles.toggleIcon}>
                    {expandedClasses[className] ? '▼' : '▶'}
                  </span>
                </div>

                {expandedClasses[className] && (
                  <div style={styles.studentsList}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Student ID</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Section</th>
                          <th style={styles.th}>Marks Entered</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => {
                          const enteredMarks = getStudentMarks(student._id);
                          return (
                            <tr key={student._id}>
                              <td style={styles.td}>{student.student_id}</td>
                              <td style={{ ...styles.td, ...styles.nameCell }}>{student.name}</td>
                              <td style={styles.td}>{student.section || 'N/A'}</td>
                              <td style={styles.td}>
                                <div style={styles.marksCell}>
                                  <span style={styles.marksCount}>
                                    {enteredMarks.length} {enteredMarks.length === 1 ? 'entry' : 'entries'}
                                  </span>
                                  {enteredMarks.length > 0 && (
                                    <div style={styles.marksList}>
                                      {enteredMarks.map((m, i) => (
                                        <span key={i} style={styles.marksItem}>
                                          {m.subjectName}: {m.marks_obtained}
                                          {m.max_marks != null ? `/${m.max_marks}` : ''}
                                          {m.semester ? ` (${m.semester})` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={styles.td}>
                                <button
                                  onClick={() => handleEnterMarks(student._id)}
                                  style={styles.enterButton}
                                >
                                  Enter Marks
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
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
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    minWidth: '250px',
  },
  select: {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  classList: {
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    borderBottom: '2px solid #dee2e6',
    transition: 'background 0.2s',
  },
  classHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  classIcon: {
    fontSize: '24px',
  },
  className: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: '10px',
  },
  classCount: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  toggleIcon: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  studentsList: {
    padding: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6',
  },
  nameCell: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  marksCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  marksCount: {
    color: '#3498db',
    fontWeight: '500',
  },
  marksList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px 12px',
    fontSize: '12px',
    color: '#5a6c7d',
  },
  marksItem: {
    whiteSpace: 'nowrap',
  },
  enterButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

export default StaffStudents;
