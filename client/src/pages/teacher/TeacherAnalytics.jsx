import { useState, useEffect } from 'react';
import { classesAPI, studentsAPI, marksAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherAnalytics = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass, selectedSemester]);

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

  const fetchClassData = async () => {
    try {
      const allResults = await resultsAPI.getAll();
      let filteredResults = allResults.data;

      if (selectedClass) {
        const classObj = classes.find((c) => c._id === selectedClass);
        if (classObj) {
          filteredResults = filteredResults.filter((r) => {
            const student = students.find((s) => s._id === (r.student?._id || r.student));
            return student?.class === classObj.class_name;
          });
        }
      }

      if (selectedSemester) {
        filteredResults = filteredResults.filter((r) => r.semester === selectedSemester);
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Failed to fetch class data:', error);
      showToast('Failed to load class performance', 'error');
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

  const teacherClasses = classes.filter((cls) => {
    return cls.subjects?.some(
      (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
    );
  });

  const classObj = classes.find((c) => c._id === selectedClass);
  const classStudents = classObj
    ? students.filter((s) => s.class === classObj.class_name)
    : [];

  const uniqueSemesters = [...new Set(results.map((r) => r.semester))].filter(Boolean);

  // Calculate statistics
  const totalStudents = classStudents.length;
  const studentsWithResults = results.length;
  const passCount = results.filter((r) => r.grade !== 'F').length;
  const failCount = results.filter((r) => r.grade === 'F').length;
  const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
  const averagePercentage = results.length > 0 ? totalPercentage / results.length : 0;
  const passRate = results.length > 0 ? (passCount / results.length) * 100 : 0;

  // Grade distribution
  const gradeDistribution = {};
  results.forEach((r) => {
    gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
  });

  // Top performers
  const topPerformers = [...results]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)
    .map((r) => {
      const student = students.find((s) => s._id === (r.student?._id || r.student));
      return {
        name: student?.name || 'Unknown',
        percentage: r.percentage,
        grade: r.grade,
        studentId: student?.student_id || 'N/A',
      };
    });

  return (
    <div>
      <h2 style={styles.title}>Class Performance Analytics</h2>

      <div style={styles.filters}>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
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
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={styles.select}
          disabled={!selectedClass}
        >
          <option value="">All Semesters</option>
          {uniqueSemesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      {selectedClass ? (
        <div>
          {/* Statistics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{totalStudents}</div>
                <div style={styles.statLabel}>Total Students</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>📋</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{studentsWithResults}</div>
                <div style={styles.statLabel}>Results Available</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{passCount}</div>
                <div style={styles.statLabel}>Passed</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>❌</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{failCount}</div>
                <div style={styles.statLabel}>Failed</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{passRate.toFixed(1)}%</div>
                <div style={styles.statLabel}>Pass Rate</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>📈</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{averagePercentage.toFixed(1)}%</div>
                <div style={styles.statLabel}>Average Percentage</div>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Grade Distribution</h3>
            <div style={styles.gradeList}>
              {Object.entries(gradeDistribution).map(([grade, count]) => {
                const percentage = results.length > 0
                  ? ((count / results.length) * 100).toFixed(1)
                  : 0;
                return (
                  <div key={grade} style={styles.gradeItem}>
                    <div style={styles.gradeHeader}>
                      <span style={styles.gradeLabel}>Grade {grade}</span>
                      <span style={styles.gradeCount}>{count} ({percentage}%)</span>
                    </div>
                    <div style={styles.gradeBarContainer}>
                      <div
                        style={{
                          ...styles.gradeBar,
                          width: `${percentage}%`,
                          backgroundColor: getGradeColor(grade),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(gradeDistribution).length === 0 && (
                <p style={styles.noData}>No grade data available</p>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Top Performers</h3>
            <div style={styles.topPerformersList}>
              {topPerformers.map((performer, index) => (
                <div key={index} style={styles.performerItem}>
                  <div style={styles.rankBadge}>#{index + 1}</div>
                  <div style={styles.performerInfo}>
                    <div style={styles.performerName}>{performer.name}</div>
                    <div style={styles.performerDetails}>ID: {performer.studentId}</div>
                  </div>
                  <div style={styles.performerStats}>
                    <span style={styles.percentage}>{performer.percentage.toFixed(2)}%</span>
                    <span
                      style={{
                        ...styles.gradeBadge,
                        backgroundColor: getGradeColor(performer.grade),
                      }}
                    >
                      {performer.grade}
                    </span>
                  </div>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <p style={styles.noData}>No performance data available</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.noData}>
          Please select a class to view analytics
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2a44',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '4px',
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
  gradeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  gradeItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  gradeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLabel: {
    fontWeight: '600',
    color: '#1f2a44',
  },
  gradeCount: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  gradeBarContainer: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  gradeBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  topPerformersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  performerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  rankBadge: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2a44',
    color: 'white',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontWeight: '600',
    color: '#1f2a44',
    marginBottom: '4px',
  },
  performerDetails: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  performerStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  percentage: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2a44',
  },
  gradeBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#7f8c8d',
  },
};

export default TeacherAnalytics;
