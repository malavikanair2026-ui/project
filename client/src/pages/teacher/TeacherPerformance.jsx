import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { classesAPI, studentsAPI, marksAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherPerformance = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchData();
    const studentId = searchParams.get('studentId');
    if (studentId) {
      setSelectedStudent(studentId);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
      ]);

      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData();
    }
  }, [selectedStudent, selectedSemester]);

  const fetchStudentData = async () => {
    try {
      const [marksRes, resultsRes] = await Promise.all([
        marksAPI.getByStudent(selectedStudent, selectedSemester || undefined),
        resultsAPI.getByStudent(selectedStudent, selectedSemester || undefined),
      ]);

      setMarks(marksRes.data || []);
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : [resultsRes.data].filter(Boolean));
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      showToast('Failed to load student performance', 'error');
    }
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

  const student = students.find((s) => s._id === selectedStudent);
  const teacherClasses = classes.filter((cls) => {
    return cls.subjects?.some(
      (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
    );
  });

  const classStudents = selectedClass
    ? students.filter((s) => {
        const studentClassId = s.class?._id || s.class;
        return String(studentClassId) === String(selectedClass);
      })
    : [];

  const currentResult = results.length > 0 ? results[0] : null;
  const marksBySubject = {};
  marks.forEach((mark) => {
    const subjectName = mark.subject?.subject_name || '-';
    if (!marksBySubject[subjectName]) {
      marksBySubject[subjectName] = [];
    }
    marksBySubject[subjectName].push(mark);
  });

  return (
    <div>
      <h2 style={styles.title}>Student Performance</h2>

      <div style={styles.filters}>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedStudent('');
          }}
          style={styles.select}
        >
          <option value="">Select Class</option>
          {teacherClasses.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.class_name}
            </option>
          ))}
        </select>

        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          style={styles.select}
          disabled={!selectedClass}
        >
          <option value="">Select Student</option>
          {classStudents.map((student) => (
            <option key={student._id} value={student._id}>
              {student.name} - {student.student_id}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by semester..."
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={styles.input}
        />
      </div>

      {selectedStudent && student ? (
        <div>
          {/* Student Info */}
          <div style={styles.infoCard}>
            <h3 style={styles.studentName}>{student.name}</h3>
            <div style={styles.studentInfo}>
              <span>ID: {student.student_id}</span>
              <span>•</span>
              <span>Class: {student.class?.class_name || student.class || 'CS'}</span>
              <span>•</span>
              <span>Section: {student.section || 'N/A'}</span>
            </div>
            {currentResult && (
              <div style={styles.resultSummary}>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Overall Percentage</div>
                  <div style={styles.summaryValue}>
                    {currentResult.percentage?.toFixed(2)}%
                  </div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Grade</div>
                  <div
                    style={{
                      ...styles.gradeBadge,
                      backgroundColor: getGradeColor(currentResult.grade),
                    }}
                  >
                    {currentResult.grade}
                  </div>
                </div>
                {currentResult.sgpa && (
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>SGPA</div>
                    <div style={styles.summaryValue}>
                      {currentResult.sgpa.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject-wise Performance */}
          {Object.keys(marksBySubject).length > 0 ? (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Subject-wise Performance</h3>
              <div style={styles.marksGrid}>
                {Object.entries(marksBySubject).map(([subjectName, subjectMarks]) => {
                  const latestMark = subjectMarks[0];
                  const maxMarks = latestMark.subject?.max_marks || 100;
                  const percentage = (latestMark.marks_obtained / maxMarks) * 100;
                  return (
                    <div key={subjectName} style={styles.markCard}>
                      <div style={styles.markHeader}>
                        <h4 style={styles.subjectName}>{subjectName}</h4>
                        <span style={styles.maxMarks}>Max: {maxMarks}</span>
                      </div>
                      <div style={styles.markValue}>
                        <span style={styles.marksObtained}>
                          {latestMark.marks_obtained}
                        </span>
                        <span style={styles.marksPercentage}>
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={styles.markBarContainer}>
                        <div
                          style={{
                            ...styles.markBar,
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: getGradeColor(
                              percentage >= 90 ? 'A+' :
                              percentage >= 80 ? 'A' :
                              percentage >= 70 ? 'B+' :
                              percentage >= 60 ? 'B' :
                              percentage >= 50 ? 'C+' :
                              percentage >= 40 ? 'C' :
                              percentage >= 33 ? 'D' : 'F'
                            ),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={styles.noData}>No marks available for this student</div>
          )}
        </div>
      ) : (
        <div style={styles.noData}>
          Please select a class and student to view performance
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
  infoCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  studentName: {
    fontSize: '22px',
    color: '#1f2a44',
    margin: '0 0 10px 0',
  },
  studentInfo: {
    display: 'flex',
    gap: '10px',
    color: '#7f8c8d',
    fontSize: '14px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  resultSummary: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  summaryItem: {
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '5px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2a44',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1f2a44',
    marginBottom: '15px',
  },
  marksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },
  markCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  markHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  subjectName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2a44',
    margin: 0,
  },
  maxMarks: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  markValue: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '10px',
  },
  marksObtained: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2a44',
  },
  marksPercentage: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  markBarContainer: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  markBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#7f8c8d',
  },
};

export default TeacherPerformance;
