import { useState, useEffect } from 'react';
import { resultsAPI, studentsAPI, subjectsAPI } from '../../services/api';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalResults: 0,
    passCount: 0,
    failCount: 0,
    averagePercentage: 0,
    gradeDistribution: {},
    topPerformers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [resultsRes, studentsRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      const results = resultsRes.data;
      const students = studentsRes.data;

      // Calculate pass/fail (assuming F is fail)
      const passCount = results.filter((r) => r.grade !== 'F').length;
      const failCount = results.filter((r) => r.grade === 'F').length;

      // Calculate average percentage
      const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
      const averagePercentage =
        results.length > 0 ? totalPercentage / results.length : 0;

      // Grade distribution
      const gradeDistribution = {};
      results.forEach((r) => {
        gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
      });

      // Top performers (top 10 by percentage)
      const topPerformers = [...results]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10)
        .map((r) => ({
          name: r.student?.name || 'Unknown',
          percentage: r.percentage,
          grade: r.grade,
        }));

      setAnalytics({
        totalStudents: students.length,
        totalResults: results.length,
        passCount,
        failCount,
        averagePercentage,
        gradeDistribution,
        topPerformers,
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
      <h2 style={styles.title}>Analytics & Reports</h2>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎓</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{analytics.totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📋</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{analytics.totalResults}</div>
            <div style={styles.statLabel}>Total Results</div>
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
          <h3 style={styles.cardTitle}>Top Performers</h3>
          <div style={styles.topPerformersList}>
            {analytics.topPerformers.length > 0 ? (
              <table style={styles.topTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPerformers.map((student, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.percentage.toFixed(2)}%</td>
                      <td>
                        <span style={styles.gradeBadge}>{student.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
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
  topPerformersList: {
    overflowX: 'auto',
  },
  topTable: {
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
  gradeBadge: {
    padding: '4px 10px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
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

export default Analytics;
