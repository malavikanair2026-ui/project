import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsAPI, resultsAPI, classesAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const PrincipalStudents = () => {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const [studentsRes, resultsRes, classesRes] = await Promise.all([
        studentsAPI.getAll(),
        resultsAPI.getAll(),
        classesAPI.getAll(),
      ]);

      setStudents(studentsRes.data);
      setResults(resultsRes.data);
      const classesData = Array.isArray(classesRes.data) ? classesRes.data : classesRes.data?.data || classesRes.data || [];
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    let filtered = students;

    // Filter by class
    if (filterClass) {
      filtered = filtered.filter((s) => {
        const studentClassName = s.class?.class_name || s.class;
        return studentClassName === filterClass;
      });
    }

    // Filter by section
    if (filterSection) {
      filtered = filtered.filter((s) => s.section === filterSection);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.student_id?.toLowerCase().includes(term) ||
          s.class?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const getStudentResult = (studentId) => {
    return results.find(
      (r) => r.student?._id === studentId || r.student === studentId
    );
  };

  const groupStudentsByClass = (studentList) => {
    const grouped = {};
    studentList.forEach((student) => {
      const className = student.class?.class_name || student.class || 'Unassigned';
      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(student);
    });

    // Sort students within each class
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

  const handleViewDetails = (studentId) => {
    navigate(`/principal/student/${studentId}`);
  };

  const getGradeColor = (grade) => {
    if (!grade) return '#95a5a6';
    if (['A+', 'A'].includes(grade)) return '#27ae60';
    if (['B+', 'B'].includes(grade)) return '#3498db';
    if (['C+', 'C'].includes(grade)) return '#f39c12';
    if (grade === 'D') return '#e67e22';
    return '#e74c3c';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredStudents = getFilteredStudents();
  const groupedStudents = groupStudentsByClass(filteredStudents);
  // Same source as admin Class Management: classes from classesAPI
  const uniqueClasses = classes.map((c) => c.class_name).filter(Boolean).sort();
  
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
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setFilterSection(''); // Reset section when class changes
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
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Section</th>
                          <th>Latest Result</th>
                          <th>Grade</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => {
                          const result = getStudentResult(student._id);
                          return (
                            <tr key={student._id}>
                              <td>{student.student_id}</td>
                              <td style={styles.nameCell}>{student.name}</td>
                              <td>{student.section || 'N/A'}</td>
                              <td>
                                {result ? (
                                  <span>
                                    {result.percentage?.toFixed(2)}%
                                  </span>
                                ) : (
                                  <span style={styles.noResult}>No result</span>
                                )}
                              </td>
                              <td>
                                {result?.grade ? (
                                  <span
                                    style={{
                                      ...styles.gradeBadge,
                                      backgroundColor: getGradeColor(result.grade),
                                    }}
                                  >
                                    {result.grade}
                                  </span>
                                ) : (
                                  <span style={styles.noResult}>-</span>
                                )}
                              </td>
                              <td>
                                <button
                                  onClick={() => handleViewDetails(student._id)}
                                  style={styles.viewButton}
                                >
                                  View Details
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
    color: '#9b59b6',
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
    borderBottom: '1px solid #dee2e6',
  },
  nameCell: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  noResult: {
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#9b59b6',
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

export default PrincipalStudents;
