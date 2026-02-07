import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesAPI, studentsAPI, marksAPI, coursesAPI, departmentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherStudents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes, coursesRes, departmentsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
        coursesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);

      setClasses(classesRes.data);
      setStudents(studentsRes.data);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || []);
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : departmentsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load students', 'error');
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
    if (selectedClass) {
      const classObj = classes.find((c) => c._id === selectedClass);
      if (classObj) {
        filtered = filtered.filter((s) => {
          const studentClassId = s.class?._id || s.class;
          return String(studentClassId) === String(classObj._id);
        });
      }
    }

    if (selectedSection) {
      filtered = filtered.filter((s) => s.section === selectedSection);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.student_id?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      const idA = a.student_id?.toString() || '';
      const idB = b.student_id?.toString() || '';
      const numA = Number(idA);
      const numB = Number(idB);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return idA.localeCompare(idB);
    });

    return filtered;
  };

  const handleEnterMarks = (studentId) => {
    navigate(`/teacher/marks?studentId=${studentId}`);
  };

  const handleViewPerformance = (studentId) => {
    navigate(`/teacher/performance?studentId=${studentId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredStudents = getFilteredStudents();
  const teacherClasses = classes.filter((cls) => {
    return cls.subjects?.some(
      (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
    );
  });

  // Get unique sections from filtered students (by class if selected)
  const studentsForSectionFilter = selectedClass
    ? students.filter((s) => {
        const studentClassId = s.class?._id || s.class;
        const classObj = classes.find((c) => c._id === selectedClass);
        return classObj && String(studentClassId) === String(classObj._id);
      })
    : students;
  const uniqueSections = [...new Set(studentsForSectionFilter.map(s => s.section).filter(Boolean))].sort();

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>My Students</h2>
        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or ID..."
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
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSection('');
            }}
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
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
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
          <div style={styles.statValue}>{filteredStudents.length}</div>
          <div style={styles.statLabel}>Students</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{teacherClasses.length}</div>
          <div style={styles.statLabel}>Classes</div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Section</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ ...styles.td, ...styles.noData }}>
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td style={styles.td}>{student.student_id}</td>
                  <td style={{ ...styles.td, ...styles.nameCell }}>{student.name}</td>
                  <td style={styles.td}>{student.class?.class_name || student.class || 'CS'}</td>
                  <td style={styles.td}>{student.section || 'N/A'}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleEnterMarks(student._id)}
                        style={styles.actionButton}
                      >
                        Enter Marks
                      </button>
                      <button
                        onClick={() => handleViewPerformance(student._id)}
                        style={{ ...styles.actionButton, ...styles.viewButton }}
                      >
                        View Performance
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '26px',
    color: '#1f2a44',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '200px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2a44',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
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
  nameCell: {
    fontWeight: '500',
    color: '#1f2a44',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#1f8b4c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#1f2a44',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
};

export default TeacherStudents;
