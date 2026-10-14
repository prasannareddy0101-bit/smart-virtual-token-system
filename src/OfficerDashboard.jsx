import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { playNotificationSound } from './utils/notificationSound';
import LogoutButton from './LogoutButton';

function OfficerDashboard() {
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [counterNumber, setCounterNumber] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://192.168.0.5:5000';

  // =========================
  // AUTHENTICATION HEADERS
  // =========================

const getAuthHeaders = () => {
  const token = localStorage.getItem('officerToken');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

  // =========================
  // LOAD QUEUE
  // =========================

  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/queue`);

      if (!response.ok) {
        throw new Error('Backend error');
      }

      const data = await response.json();
      setQueue(data);
    } catch (error) {
      console.error('Could not load queue:', error);
    }
  }, []);

  // =========================
  // CALL NEXT
  // =========================

  const callNext = async () => {
    try {
      setMessage('');
      setLoading(true);

      const response = await fetch(`${API_URL}/queue/next`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          counterNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Could not call next token');
        return;
      }

      setMessage(
        data.message ||
          `${data.token} called at Counter ${counterNumber}`
      );

      playNotificationSound();
      await loadQueue();
    } catch (error) {
      console.error('Could not call next token:', error);
      setMessage('Could not connect to backend');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // COMPLETE CURRENT TOKEN
  // =========================

  const completeCurrent = async () => {
    try {
      setMessage('');
      setLoading(true);

      const response = await fetch(`${API_URL}/queue/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          counterNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Could not complete token');
        return;
      }

      setMessage(
        data.message ||
          `${data.token} completed at Counter ${counterNumber}`
      );

      await loadQueue();
    } catch (error) {
      console.error('Could not complete token:', error);
      setMessage('Could not connect to backend');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // =========================
  // SOCKET.IO LIVE UPDATES
  // =========================

  useEffect(() => {
    const socket = io(API_URL);

    socket.on('connect', () => {
      console.log('Officer connected:', socket.id);
    });

    socket.on('queueUpdated', () => {
      console.log('Queue updated!');
      loadQueue();
    });

    socket.on('disconnect', () => {
      console.log('Officer disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [loadQueue]);

  // =========================
  // CURRENTLY SERVING
  // =========================

  const currentToken = queue.find(
    (person) =>
      person.status === 'Called' &&
      Number(person.counterNumber) === counterNumber
  );

  // =========================
  // QUEUE COUNTS
  // =========================

  const waitingCount = queue.filter(
    (person) => person.status === 'Waiting'
  ).length;

  const totalTokens = queue.length;

  const currentlyServingCount = queue.filter(
    (person) => person.status === 'Called'
  ).length;

  const completedCount = queue.filter(
    (person) => person.status === 'Completed'
  ).length;

  // =========================
  // ANALYTICS DATA
  // =========================

  const analytics = [
    {
      label: 'TOTAL TOKENS',
      value: totalTokens,
      color: '#2563eb',
    },
    {
      label: 'WAITING',
      value: waitingCount,
      color: '#d97706',
    },
    {
      label: 'CURRENTLY SERVING',
      value: currentlyServingCount,
      color: '#7c3aed',
    },
    {
      label: 'COMPLETED',
      value: completedCount,
      color: '#16a34a',
    },
  ];

  const chartMax = Math.max(totalTokens, 1);

  // =========================
  // WAITING QUEUE
  // =========================

  const waitingQueue = queue.filter(
    (person) => person.status === 'Waiting'
  );

  // =========================
  // RECENT COMPLETED TOKENS
  // =========================

  const completedQueue = queue
    .filter((person) => person.status === 'Completed')
    .slice()
    .reverse()
    .slice(0, 5);

  // =========================
  // DASHBOARD UI
  // =========================

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <header style={styles.header}>
        <div style={styles.headerMain}>
          <div>
            <h1 style={styles.title}>Officer Dashboard</h1>

            <p style={styles.subtitle}>
              Smart Virtual Token Management
            </p>
          </div>

          <div style={styles.onlineBadge}>
            <span style={styles.onlineDot}>●</span>
            System Online
          </div>
        </div>

        {/* PROFILE AND LOGOUT BUTTONS */}

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.profileButton}
            onClick={() => navigate('/officer-profile')}
          >
            My Profile
          </button>

          <LogoutButton role="officer" />
        </div>
      </header>

      {/* COUNTER SELECTOR */}

      <div style={styles.counterCard}>
        <div>
          <p style={styles.counterLabel}>SELECT COUNTER</p>

          <h2 style={styles.counterHeading}>
            Officer Counter
          </h2>
        </div>

        <select
          value={counterNumber}
          onChange={(e) =>
            setCounterNumber(Number(e.target.value))
          }
          style={styles.counterSelect}
        >
          <option value={1}>Counter 1</option>
          <option value={2}>Counter 2</option>
          <option value={3}>Counter 3</option>
        </select>
      </div>

      {/* QUEUE ANALYTICS */}

      <section style={styles.analyticsSection}>
        <div style={styles.analyticsHeadingRow}>
          <div>
            <h2 style={styles.sectionTitle}>
              Queue Analytics
            </h2>

            <p style={styles.sectionSubtitle}>
              Live statistics calculated from all token records
            </p>
          </div>

          <span style={styles.livePill}>
            ● LIVE DATA
          </span>
        </div>

        {/* ANALYTICS CARDS */}

        <div style={styles.analyticsGrid}>
          {analytics.map((item) => (
            <div
              style={styles.statCard}
              key={item.label}
            >
              <div
                style={{
                  ...styles.statAccent,
                  background: item.color,
                }}
              />

              <p style={styles.statLabel}>
                {item.label}
              </p>

              <h2 style={styles.statValue}>
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* BAR CHART */}

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>
            Token Status Overview
          </h3>

          <p style={styles.chartSubtitle}>
            Number of tokens in each status
          </p>

          {analytics.slice(1).map((item) => (
            <div
              style={styles.chartRow}
              key={`chart-${item.label}`}
            >
              <div style={styles.chartLabel}>
                {item.label}
              </div>

              <div style={styles.chartTrack}>
                <div
                  style={{
                    ...styles.chartBar,
                    width: `${(item.value / chartMax) * 100}%`,
                    background: item.color,
                  }}
                />
              </div>

              <strong style={styles.chartValue}>
                {item.value}
              </strong>
            </div>
          ))}

          <p style={styles.chartFootnote}>
            Statistics update automatically when the queue changes.
          </p>
        </div>
      </section>

      {/* COUNTER STATISTICS */}

      <div style={styles.counterStatsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            CURRENTLY SERVING
          </p>

          <h2 style={styles.statValue}>
            {currentToken ? currentToken.token : '—'}
          </h2>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>WAITING</p>

          <h2 style={styles.statValue}>
            {waitingCount}
          </h2>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>COMPLETED</p>

          <h2 style={styles.statValue}>
            {completedCount}
          </h2>
        </div>
      </div>

      {/* CURRENT TOKEN */}

      <div style={styles.currentCard}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionLabel}>
              CURRENTLY SERVING
            </p>

            <h2 style={styles.currentToken}>
              {currentToken ? currentToken.token : 'No Token'}
            </h2>

            {currentToken && (
              <p style={styles.serviceText}>
                {currentToken.service}
              </p>
            )}
          </div>

          <div style={styles.counterBadge}>
            COUNTER {counterNumber}
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button
            onClick={callNext}
            style={{
              ...styles.callButton,
              opacity: loading ? 0.6 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'PLEASE WAIT...' : 'CALL NEXT'}
          </button>

          <button
            onClick={completeCurrent}
            style={{
              ...styles.completeButton,
              opacity: loading ? 0.6 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'PLEASE WAIT...' : 'COMPLETE'}
          </button>
        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}
      </div>

      {/* WAITING QUEUE */}

      <div style={styles.sectionCard}>
        <div style={styles.sectionTop}>
          <div>
            <h2 style={styles.sectionTitle}>
              Waiting Queue
            </h2>

            <p style={styles.sectionSubtitle}>
              Customers waiting for service
            </p>
          </div>

          <div style={styles.queueCount}>
            {waitingCount}
          </div>
        </div>

        {waitingQueue.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✓</div>

            <h3>No one is waiting</h3>

            <p>The queue is currently empty.</p>
          </div>
        ) : (
          <div>
            {waitingQueue.map((person, index) => (
              <div
                key={person.id}
                style={styles.queueRow}
              >
                <div style={styles.position}>
                  #{index + 1}
                </div>

                <div style={styles.queueToken}>
                  {person.token}
                </div>

                <div style={styles.queueService}>
                  {person.service}
                </div>

                <div style={styles.waitingBadge}>
                  Waiting
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT COMPLETED TOKENS */}

      <div style={styles.sectionCard}>
        <div style={styles.sectionTop}>
          <div>
            <h2 style={styles.sectionTitle}>
              Recent Completed Tokens
            </h2>

            <p style={styles.sectionSubtitle}>
              Recently served customers
            </p>
          </div>
        </div>

        {completedQueue.length === 0 ? (
          <p style={styles.noCompleted}>
            No completed tokens yet.
          </p>
        ) : (
          completedQueue.map((person) => (
            <div
              key={person.id}
              style={styles.completedRow}
            >
              <div>
                <strong style={styles.completedToken}>
                  {person.token}
                </strong>

                <span style={styles.completedService}>
                  {person.service}
                </span>
              </div>

              <div style={styles.completedBadge}>
                Completed
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '35px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#111827',
    boxSizing: 'border-box',
  },

  header: {
    maxWidth: '1100px',
    margin: '0 auto 25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },

  headerMain: {
    flex: '1 1 350px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },

  headerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },

  profileButton: {
    padding: '10px 18px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },

  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: '6px',
    color: '#6b7280',
  },

  onlineBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '9px 15px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },

  onlineDot: {
    marginRight: '6px',
  },

  counterCard: {
    maxWidth: '1100px',
    margin: '0 auto 25px',
    background: '#ffffff',
    padding: '20px 25px',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
    boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
  },

  counterLabel: {
    margin: 0,
    fontSize: '11px',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '1px',
  },

  counterHeading: {
    margin: '5px 0 0',
    fontSize: '20px',
  },

  counterSelect: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#111827',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  analyticsSection: {
    maxWidth: '1100px',
    margin: '0 auto 25px',
  },

  analyticsHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },

  livePill: {
    background: '#dcfce7',
    color: '#166534',
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },

  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },

  counterStatsGrid: {
    maxWidth: '1100px',
    margin: '0 auto 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '15px',
  },

  statCard: {
    position: 'relative',
    overflow: 'hidden',
    background: '#ffffff',
    padding: '22px',
    borderRadius: '14px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
  },

  statAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '5px',
  },

  statLabel: {
    margin: 0,
    fontSize: '11px',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '0.8px',
  },

  statValue: {
    margin: '10px 0 0',
    fontSize: '28px',
    color: '#111827',
    overflowWrap: 'anywhere',
  },

  chartCard: {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '14px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
  },

  chartTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#111827',
  },

  chartSubtitle: {
    margin: '6px 0 22px',
    color: '#6b7280',
    fontSize: '14px',
  },

  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(115px, 180px) minmax(40px, 1fr) 35px',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },

  chartLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#4b5563',
    overflowWrap: 'anywhere',
  },

  chartTrack: {
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
  },

  chartBar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },

  chartValue: {
    textAlign: 'right',
    color: '#111827',
  },

  chartFootnote: {
    margin: '20px 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },

  currentCard: {
    maxWidth: '1100px',
    margin: '0 auto 20px',
    background: '#ffffff',
    padding: '28px',
    borderRadius: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
    boxSizing: 'border-box',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },

  sectionLabel: {
    margin: 0,
    fontSize: '12px',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '1px',
  },

  currentToken: {
    margin: '8px 0 0',
    fontSize: '42px',
    color: '#111827',
  },

  serviceText: {
    margin: '5px 0 0',
    color: '#4b5563',
    fontSize: '16px',
  },

  counterBadge: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '10px 16px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '13px',
  },

  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '25px',
    flexWrap: 'wrap',
  },

  callButton: {
    padding: '13px 25px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer',
  },

  completeButton: {
    padding: '13px 25px',
    border: 'none',
    borderRadius: '8px',
    background: '#16a34a',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer',
  },

  message: {
    marginTop: '18px',
    padding: '12px 15px',
    borderRadius: '8px',
    background: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: '600',
  },

  sectionCard: {
    maxWidth: '1100px',
    margin: '0 auto 20px',
    background: '#ffffff',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
  },

  sectionTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '21px',
    color: '#111827',
  },

  sectionSubtitle: {
    margin: '5px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },

  queueCount: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },

  queueRow: {
    display: 'grid',
    gridTemplateColumns: '45px minmax(70px, 100px) minmax(100px, 1fr) 100px',
    alignItems: 'center',
    gap: '10px',
    padding: '15px 10px',
    borderTop: '1px solid #e5e7eb',
  },

  position: {
    color: '#6b7280',
    fontWeight: '600',
  },

  queueToken: {
    fontWeight: '700',
    fontSize: '17px',
  },

  queueService: {
    color: '#4b5563',
    overflowWrap: 'anywhere',
  },

  waitingBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '6px 10px',
    borderRadius: '15px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },

  emptyState: {
    textAlign: 'center',
    padding: '30px',
    color: '#6b7280',
  },

  emptyIcon: {
    width: '45px',
    height: '45px',
    margin: '0 auto 10px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '20px',
  },

  completedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    padding: '14px 5px',
    borderTop: '1px solid #e5e7eb',
    flexWrap: 'wrap',
  },

  completedToken: {
    fontSize: '16px',
  },

  completedService: {
    marginLeft: '15px',
    color: '#6b7280',
  },

  completedBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '6px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: '700',
  },

  noCompleted: {
    color: '#6b7280',
  },
};

export default OfficerDashboard;