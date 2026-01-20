import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsAPI, resultsAPI, marksAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const PrincipalStudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchData();
  }, [studentId, selectedSemester]);

  const fetchData = async () => {
    try {
      const [studentRes, resultsRes, marksRes] = await Promise.all([
        studentsAPI.getById(studentId),
        resultsAPI.getByStudent(studentId, selectedSemester || undefined),
        marksAPI.getByStudent(studentId, selectedSemester || undefined),
      ]);

      setStudent(studentRes.data);
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : [resultsRes.data].filter(Boolean));
      setMarks(marksRes.data || []);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      showToast('Failed to load student details', 'error');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    if (status === 'approved') return '#27ae60';
    if (status === 'pending') return '#f39c12';
    return '#e74c3c';
  };

  const uniqueSemesters = [...new Set(results.map((r) => r.semester))].filter(Boolean);
  const currentResult = results.length > 0 ? results[0] : null;

  // Group marks by subject
  const marksBySubject = {};
  marks.forEach((mark) => {
    const subjectName = mark.subject?.name || 'Unknown';
    if (!marksBySubject[subjectName]) {
      marksBySubject[subjectName] = [];
    }
    marksBySubject[subjectName].push(mark);
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!student) {
    return (
      <div style={styles.error}>
        <p>Student not found</p>
        <button onClick={() => navigate('/principal/students')} style={styles.backButton}>
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <button onClick={() => navigate('/principal/students')} style={styles.backButton}>
            ← Back to Students
          </button>
          <h2 style={styles.title}>Student Details</h2>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={styles.select}
        >
          <option value="">All Semesters</option>
          {uniqueSemesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      {/* Student Info Card */}
      <div style={styles.infoCard}>
        <div style={styles.infoHeader}>
          <div>
            <h3 style={styles.studentName}>{student.name}</h3>
            <div style={styles.studentInfo}>
              <span>ID: {student.student_id}</span>
              <span>•</span>
              <span>Class: {student.class || 'N/A'}</span>
              <span>•</span>
              <span>Section: {student.section || 'N/A'}</span>
              {student.dob && (
                <>
                  <span>•</span>
                  <span>DOB: {new Date(student.dob).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
          {currentResult && (
            <div style={styles.resultSummary}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Percentage</div>
                <div style={styles.summaryValue}>
                  {currentResult.percentage?.toFixed(2)}%
                </div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Grade</div>
                <div
                  style={{
                    ...styles.summaryValue,
                    ...styles.gradeBadge,
                    backgroundColor: getGradeColor(currentResult.grade),
                  }}
                >
                  {currentResult.grade}
                </div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Status</div>
                <div
                  style={{
                    ...styles.summaryValue,
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(currentResult.status),
                  }}
                >
                  {currentResult.status || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 ? (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Results History</h3>
          <div style={styles.resultsList}>
            {results.map((result) => (
              <div key={result._id} style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <div>
                    <div style={styles.resultSemester}>{result.semester || 'N/A'}</div>
                    <div style={styles.resultDate}>
                      {new Date(result.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={styles.resultStats}>
                    <div style={styles.resultStat}>
                      <span style={styles.resultStatLabel}>Total Marks</span>
                      <span style={styles.resultStatValue}>{result.total_marks}</span>
                    </div>
                    <div style={styles.resultStat}>
                      <span style={styles.resultStatLabel}>Percentage</span>
                      <span style={styles.resultStatValue}>
                        {result.percentage?.toFixed(2)}%
                      </span>
                    </div>
                    <div style={styles.resultStat}>
                      <span style={styles.resultStatLabel}>Grade</span>
                      <span
                        style={{
                          ...styles.gradeBadge,
                          backgroundColor: getGradeColor(result.grade),
                        }}
                      >
                        {result.grade}
                      </span>
                    </div>
                    {result.sgpa && (
                      <div style={styles.resultStat}>
                        <span style={styles.resultStatLabel}>SGPA</span>
                        <span style={styles.resultStatValue}>
                          {result.sgpa.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={styles.resultStatus}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(result.status),
                    }}
                  >
                    {result.status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Results History</h3>
          <div style={styles.noData}>No results available</div>
        </div>
      )}

      {/* Marks Section */}
      {marks.length > 0 ? (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Subject-wise Marks</h3>
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
                  {subjectMarks.length > 1 && (
                    <div style={styles.markHistory}>
                      <div style={styles.historyLabel}>History:</div>
                      {subjectMarks.slice(1).map((mark, idx) => (
                        <span key={idx} style={styles.historyItem}>
                          {mark.marks_obtained} ({new Date(mark.createdAt).toLocaleDateString()})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Subject-wise Marks</h3>
          <div style={styles.noData}>No marks available</div>
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
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '10px',
    fontWeight: '500',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  infoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '20px',
  },
  studentName: {
    fontSize: '24px',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  studentInfo: {
    display: 'flex',
    gap: '10px',
    color: '#7f8c8d',
    fontSize: '14px',
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
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  resultCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  resultSemester: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  resultDate: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  resultStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  resultStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  resultStatLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '4px',
  },
  resultStatValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  resultStatus: {
    paddingTop: '15px',
    borderTop: '1px solid #dee2e6',
  },
  marksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  markCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  markHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  subjectName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
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
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
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
    marginBottom: '10px',
  },
  markBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  markHistory: {
    paddingTop: '10px',
    borderTop: '1px solid #dee2e6',
    fontSize: '12px',
    color: '#7f8c8d',
  },
  historyLabel: {
    fontWeight: '600',
    marginBottom: '5px',
  },
  historyItem: {
    display: 'inline-block',
    marginRight: '10px',
    marginBottom: '5px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px',
  },
};

export default PrincipalStudentDetail;
