import { useNavigate } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-shell">
      {/* Navigation */}
      <header className="welcome-nav">
        <button
          className="welcome-logo"
          onClick={() => navigate('/')}
          aria-label="QueueSmart home"
        >
          <span className="welcome-logo-icon">Q</span>
          <span>
            Queue<span className="welcome-logo-accent">Smart</span>
          </span>
        </button>

        <div className="welcome-nav-actions">
          <button
            className="welcome-nav-login"
            onClick={() => navigate('/login')}
          >
            User Login
          </button>

          <button
            className="welcome-nav-officer"
            onClick={() => navigate('/officer-login')}
          >
            Officer Login
          </button>
        </div>
      </header>

      {/* Main hero section */}
      <main className="welcome-hero">
        <section className="welcome-hero-content">
          <div className="welcome-eyebrow">
            <span className="welcome-live-dot" />
            SMART VIRTUAL TOKEN SYSTEM
          </div>

          <h1>
            Your time
            <br />
            matters<span>.</span>
          </h1>

          <p className="welcome-hero-description">
            Skip long queues. Track your token in real time.
            Access essential services with a simpler, smarter
            queue management experience.
          </p>

          <div className="welcome-hero-actions">
            <button
              className="welcome-primary-button"
              onClick={() => navigate('/register')}
            >
              Get Started
              <span>→</span>
            </button>

            <button
              className="welcome-secondary-button"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>

          <div className="welcome-trust-note">
            <span>✓</span>
            Simple access · Real-time updates · Less waiting
          </div>
        </section>

        {/* Queue preview card */}
        <section
          className="welcome-preview"
          aria-label="Queue system preview"
        >
          <div className="welcome-preview-top">
            <div>
              <span className="welcome-preview-label">
                QUEUE OVERVIEW
              </span>
              <h2>Service Dashboard</h2>
            </div>

            <span className="welcome-preview-status">
              <span /> Live system
            </span>
          </div>

          <div className="welcome-token-card">
            <div>
              <span className="welcome-token-label">
                YOUR TOKEN
              </span>
              <div className="welcome-token-number">A051</div>
              <span className="welcome-token-caption">
                Sample preview
              </span>
            </div>

            <div className="welcome-token-symbol">Q</div>
          </div>

          <div className="welcome-stats">
            <div className="welcome-stat-card">
              <span className="welcome-stat-icon">◷</span>
              <span className="welcome-stat-label">
                Estimated wait
              </span>
              <strong>15 min</strong>
            </div>

            <div className="welcome-stat-card">
              <span className="welcome-stat-icon">↗</span>
              <span className="welcome-stat-label">
                Queue status
              </span>
              <strong className="welcome-waiting">
                Waiting
              </strong>
            </div>
          </div>

          <div className="welcome-progress">
            <div className="welcome-progress-heading">
              <span>Queue progress</span>
              <span>Live tracking</span>
            </div>

            <div className="welcome-progress-track">
              <div className="welcome-progress-fill" />
            </div>
          </div>

          <div className="welcome-preview-footer">
            <span className="welcome-footer-check">✓</span>
            Stay informed about your turn
          </div>
        </section>
      </main>

      {/* Feature section */}
      <section className="welcome-features">
        <div className="welcome-feature-item">
          <div className="welcome-feature-icon">◷</div>
          <div>
            <h3>Save your time</h3>
            <p>Spend less time waiting in physical queues.</p>
          </div>
        </div>

        <div className="welcome-feature-item">
          <div className="welcome-feature-icon">↗</div>
          <div>
            <h3>Track your token</h3>
            <p>Follow your queue status through your dashboard.</p>
          </div>
        </div>

        <div className="welcome-feature-item">
          <div className="welcome-feature-icon">✓</div>
          <div>
            <h3>Organized service</h3>
            <p>Make service counters easier to manage.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-page-footer">
        <span>QueueSmart</span>
        <span>Smart Virtual Token & Queue Management System</span>
      </footer>
    </div>
  );
}

export default Welcome;