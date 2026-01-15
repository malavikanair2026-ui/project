import { useState, useEffect } from 'react';
import { resultsAPI, studentsAPI, subjectsAPI, marksAPI } from '../../services/api';

const PrincipalAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalResults: 0,
    passCount: 0,
    failCount: 0,
    averagePercentage: 0,
    gradeDistribution: {},
    subjectPerformance: {},
    classPerformance: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [resultsRes, studentsRes, subjectsRes, marksRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
        subjectsAPI.getAll(),
        marksAPI.getByStudent('all'), // This won't work, need to get all marks differently
      ]);

      const results = resultsRes.data;
      const students = studentsRes.data;
      const subjects = subjectsRes.data;

      // Calculate pass/fail
      const passCount = results.filter((r) => r.grade !== 'F').length;
      const failCount = results.filter((r) => r.grade === 'F').length;

      // Calculate average percentage
      const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
      const averagePercentage = results.length > 0 ? totalPercentage / results.length : 0;

      // Grade distribution
      const gradeDistribution = {};
      results.forEach((r) => {
        gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
      });

      // Class performance
      const classPerformance = {};
      results.forEach((result) => {
        const student = students.find(
          (s) => s._id === result.student?._id || s._id === result.student
        );
        if (student?.class) {
          if (!classPerformance[student.class]) {
            classPerformance[student.class] = {
              total: 0,
              sum: 0,
              count: 0,
            };
          }
          classPerformance[student.class].sum += result.percentage;
          classPerformance[student.class].count += 1;
        }
      });

      // Calculate averages for classes
      Object.keys(classPerformance).forEach((cls) => {
        classPerformance[cls].average =
          classPerformance[cls].count > 0
            ? classPerformance[cls].sum / classPerformance[cls].count
            : 0;
      });

      setAnalytics({
        totalStudents: students.length,
        totalResults: results.length,
        passCount,
        failCount,
        averagePercentage,
        gradeDistribution,
        classPerformance,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }

  const passRate =
    analytics.totalResults > 0
      ? ((analytics.passCount / analytics.totalResults) * 100).toFixed(1)
      : 0;

  return (
    <div>
      <h2 style={styles.title}>Performance Analytics</h2>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎓</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{analytics.totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{analytics.passCount}</div>
            <div style={styles.statLabel}>Passed</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{analytics.failCount}</div>
            <div style={styles.statLabel}>Failed</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{passRate}%</div>
            <div style={styles.statLabel}>Pass Rate</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📈</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>
              {analytics.averagePercentage.toFixed(1)}%
            </div>
            <div style={styles.statLabel}>Average Percentage</div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Grade Distribution</h3>
          <div style={styles.gradeList}>
            {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
              <div key={grade} style={styles.gradeItem}>
                <span style={styles.gradeLabel}>Grade {grade}:</span>
                <span style={styles.gradeCount}>{count} students</span>
              </div>
            ))}
            {Object.keys(analytics.gradeDistribution).length === 0 && (
              <p style={styles.noData}>No data available</p>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Class-wise Performance</h3>
          <div style={styles.classList}>
            {Object.entries(analytics.classPerformance).map(([className, data]) => (
              <div key={className} style={styles.classItem}>
                <div style={styles.classHeader}>
                  <span style={styles.className}>Class {className}</span>
                  <span style={styles.classAverage}>
                    {data.average.toFixed(1)}% avg
                  </span>
                </div>
                <div style={styles.classBarContainer}>
                  <div
                    style={{
                      ...styles.classBar,
                      width: `${Math.min(data.average, 100)}%`,
                      backgroundColor:
                        data.average >= 80
                          ? '#27ae60'
                          : data.average >= 60
                          ? '#3498db'
                          : data.average >= 40
                          ? '#f39c12'
                          : '#e74c3c',
                    }}
                  />
                </div>
                <div style={styles.classStats}>
                  {data.count} result{data.count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
            {Object.keys(analytics.classPerformance).length === 0 && (
              <p style={styles.noData}>No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statIcon: {
    fontSize: '40px',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '5px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c3e50',
  },
  gradeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  gradeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  gradeLabel: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  gradeCount: {
    color: '#7f8c8d',
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  classItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  className: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  classAverage: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  classBarContainer: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  classBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  classStats: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  noData: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default PrincipalAnalytics;
