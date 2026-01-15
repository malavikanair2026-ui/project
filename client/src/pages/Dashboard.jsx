import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplay = (role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.welcome}>Welcome, {user?.name}!</span>
          <span style={styles.role}>Role: {getRoleDisplay(user?.role)}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <h2>Student Result Analyzer</h2>
          <p>You are logged in as: <strong>{getRoleDisplay(user?.role)}</strong></p>
          <p>Email: {user?.email}</p>
          {user?.role === 'admin' && (
            <div style={styles.adminLink}>
              <a href="/admin/dashboard" style={styles.link}>
                Go to Admin Dashboard →
              </a>
            </div>
          )}
          {user?.role === 'teacher' && (
            <div style={styles.teacherLink}>
              <a href="/teacher/dashboard" style={styles.link}>
                Go to Teacher Dashboard →
              </a>
            </div>
          )}
          {user?.role === 'student' && (
            <div style={styles.studentLink}>
              <a href="/student/dashboard" style={styles.link}>
                Go to Student Portal →
              </a>
            </div>
          )}
          {user?.role === 'principal' && (
            <div style={styles.principalLink}>
              <a href="/principal/dashboard" style={styles.link}>
                Go to Principal Dashboard →
              </a>
            </div>
          )}
          {user?.role === 'staff' && (
            <div style={styles.staffLink}>
              <a href="/staff/dashboard" style={styles.link}>
                Go to Staff Dashboard →
              </a>
            </div>
          )}
          <p style={styles.note}>
            Dashboard content will be customized based on your role in the next phases.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  welcome: {
    color: '#666',
  },
  role: {
    color: '#007bff',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  note: {
    marginTop: '20px',
    color: '#666',
    fontStyle: 'italic',
  },
  adminLink: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
  },
  teacherLink: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff3e0',
    borderRadius: '4px',
  },
  studentLink: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
  },
  principalLink: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f3e5f5',
    borderRadius: '4px',
  },
  staffLink: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e1f5fe',
    borderRadius: '4px',
  },
  link: {
    color: '#27ae60',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
  },
};

export default Dashboard;
