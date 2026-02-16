import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Homepage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>Student Result Analyzer</span>
          <nav style={styles.nav}>
            <Link to="/login" style={styles.navLink}>Login</Link>
            <Link to="/register" style={{ ...styles.navLink, ...styles.ctaNav }}>Register</Link>
          </nav>
        </div>
      </header>

      <main>
        <section style={styles.hero}>
          <h1 style={styles.heroTitle}>
            Welcome to Student Result Analyzer
          </h1>
          <p style={styles.heroSubtitle}>
            One place for results, grades, and insights. For students, teachers, and admins.
          </p>
          <div style={styles.heroActions}>
            <Link to="/login" style={styles.primaryBtn}>Sign in</Link>
            <Link to="/register" style={styles.secondaryBtn}>Create account</Link>
          </div>
        </section>

        <section style={styles.features}>
          <h2 style={styles.sectionTitle}>What you can do</h2>
          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <span style={styles.featureIcon}>📊</span>
              <h3 style={styles.featureTitle}>View results</h3>
              <p style={styles.featureText}>Students see grades and semester results in one place.</p>
            </div>
            <div style={styles.featureCard}>
              <span style={styles.featureIcon}>✏️</span>
              <h3 style={styles.featureTitle}>Enter marks</h3>
              <p style={styles.featureText}>Teachers and staff enter and manage marks easily.</p>
            </div>
            <div style={styles.featureCard}>
              <span style={styles.featureIcon}>📈</span>
              <h3 style={styles.featureTitle}>Analytics</h3>
              <p style={styles.featureText}>Admins and principals get insights and reports.</p>
            </div>
          </div>
        </section>

        <section style={styles.cta}>
          <p style={styles.ctaText}>Get started in seconds.</p>
          <Link to="/register" style={styles.primaryBtn}>Register now</Link>
        </section>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>Student Result Analyzer</p>
      </footer>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
  },
  headerInner: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: '0.05em',
  },
  nav: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  navLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.95rem',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'color 0.2s, background 0.2s',
  },
  ctaNav: {
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#f8fafc',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: '1.15rem',
    color: '#94a3b8',
    maxWidth: '480px',
    marginBottom: '32px',
    lineHeight: 1.6,
  },
  heroActions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'background 0.2s, transform 0.1s',
  },
  secondaryBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#38bdf8',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    border: '2px solid #38bdf8',
    transition: 'background 0.2s, color 0.2s',
  },
  features: {
    padding: '64px 24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '32px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.15)',
  },
  featureIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '12px',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '8px',
  },
  featureText: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: 1.5,
    margin: 0,
  },
  cta: {
    padding: '48px 24px',
    textAlign: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
  },
  ctaText: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    marginBottom: '20px',
  },
  footer: {
    padding: '20px 24px',
    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  },
};

export default Homepage;
