import { useEffect, useState } from 'react';
import { classesAPI, resultsAPI, marksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myClasses: 0,
    subjectsAssigned: 0,
    studentsCovered: 0,
    resultsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [classesRes, resultsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        resultsAPI.getAll(),
      ]);

      const classes = classesRes.data;
      const results = resultsRes.data;

      const subjectsAssigned = classes.reduce(
        (count, cls) =>
          count + (cls.subjects?.filter((s) => String(s.teacher?._id || s.teacher) === user?._id).length || 0),
        0
      );

      const studentsCovered = new Set();
      classes.forEach((cls) => {
        // If student-class mapping existed we'd use it; for demo use subject assignments count
        if (cls.subjects?.some((s) => String(s.teacher?._id || s.teacher) === user?._id)) {
          studentsCovered.add(cls.class_name);
        }
      });

      const resultsCount = results.filter(
        (r) => r.approved_by && String(r.approved_by) === String(user?._id)
      ).length;

      setStats({
        myClasses: classes.length,
        subjectsAssigned,
        studentsCovered: studentsCovered.size,
        resultsCount,
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <h2 style={styles.title}>Teacher Dashboard</h2>
      <div style={styles.grid}>
        <StatCard icon="🏫" label="My Classes" value={stats.myClasses} />
        <StatCard icon="📚" label="Subjects Assigned" value={stats.subjectsAssigned} />
        <StatCard icon="👥" label="Classes Covered" value={stats.studentsCovered} />
        <StatCard icon="✅" label="Results Approved" value={stats.resultsCount} />
      </div>
      <p style={styles.note}>Use the sidebar to manage classes and enter marks.</p>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div style={styles.statCard}>
    <div style={styles.statIcon}>{icon}</div>
    <div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const styles = {
  title: {
    fontSize: '26px',
    marginBottom: '20px',
    color: '#1f2a44',
  },
  grid: {
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
    gap: '14px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2a44',
  },
  statLabel: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  note: {
    marginTop: '10px',
    color: '#6c757d',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
  },
};

export default TeacherDashboard;
