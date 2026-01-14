import { useEffect, useState } from 'react';
import { classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await classesAPI.getAll({ teacher: user?._id });
      setClasses(res.data);
    } catch (error) {
      console.error('Failed to load classes', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <h2 style={styles.title}>My Classes & Subjects</h2>
      <div style={styles.grid}>
        {classes.map((cls) => (
          <div key={cls._id} style={styles.card}>
            <div style={styles.header}>
              <h3 style={styles.className}>{cls.class_name}</h3>
              <span style={styles.classId}>ID: {cls.class_id}</span>
            </div>
            <div style={styles.body}>
              <h4 style={styles.subTitle}>Subjects</h4>
              {cls.subjects && cls.subjects.length > 0 ? (
                <ul style={styles.list}>
                  {cls.subjects
                    .filter((s) => String(s.teacher?._id || s.teacher) === user?._id)
                    .map((s, idx) => (
                      <li key={idx} style={styles.listItem}>
                        {s.subject?.subject_name || 'Unknown Subject'} (Max: {s.subject?.max_marks || '-'})
                      </li>
                    ))}
                </ul>
              ) : (
                <p style={styles.empty}>No assigned subjects</p>
              )}
            </div>
          </div>
        ))}
        {classes.length === 0 && <div style={styles.emptyCard}>No classes assigned</div>}
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '26px',
    marginBottom: '20px',
    color: '#1f2a44',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  className: {
    margin: 0,
    fontSize: '18px',
    color: '#2c3e50',
  },
  classId: {
    color: '#7f8c8d',
    fontSize: '13px',
  },
  body: {
    marginTop: '10px',
  },
  subTitle: {
    margin: '0 0 8px',
    color: '#34495e',
    fontSize: '15px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f7f7f7',
    color: '#555',
  },
  empty: {
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  emptyCard: {
    textAlign: 'center',
    color: '#95a5a6',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
  },
};

export default TeacherClasses;
