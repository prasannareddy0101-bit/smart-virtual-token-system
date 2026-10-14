import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AuthPage.css';

const API_URL = 'http://localhost:5000';

function AuthPage({ mode = 'login', role = 'user' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = mode === 'register';
  const isOfficer = role === 'officer';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter your email address and password.');
      return;
    }

    if (isRegister && !formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (isRegister && formData.password.length < 6) {
      setError('Your password must contain at least 6 characters.');
      return;
    }

    let endpoint;

    if (isRegister) {
      endpoint = '/auth/register';
    } else if (isOfficer) {
      endpoint = '/auth/officer-login';
    } else {
      endpoint = '/auth/login';
    }

    const payload = isRegister
      ? {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        }
      : {
          email: formData.email.trim(),
          password: formData.password,
        };

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            (isRegister
              ? 'Unable to create your account.'
              : 'Invalid email address or password.')
        );
      }

      if (isRegister) {
        setSuccess('Your account has been created successfully!');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1000);

        return;
      }

      if (!data.token || !data.user) {
        throw new Error('The server returned an invalid login response.');
      }

      // Save the authenticated session.
      if (data.user.role === 'officer' || data.user.role === 'admin') {
  localStorage.setItem('officerToken', data.token);
  localStorage.setItem('officerUser', JSON.stringify(data.user));
} else {
  localStorage.setItem('userToken', data.token);
  localStorage.setItem('userAccount', JSON.stringify(data.user));
}

      // Redirect according to the authenticated role.
      if (
        data.user.role === 'officer' ||
        data.user.role === 'admin'
      ) {
        navigate('/officer', { replace: true });
      } else {
        navigate('/user', { replace: true });
      }
    } catch (err) {
      setError(
        err.message ||
          'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* LEFT BRANDING PANEL */}

      <aside className="auth-brand-panel">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">Q</span>

          <span className="auth-brand-name">
            Queue<span>Smart</span>
          </span>
        </Link>

        <div className="auth-brand-content">
          <div className="auth-eyebrow">
            SMART VIRTUAL TOKEN SYSTEM
          </div>

          <h1>
            Your time
            <br />
            matters<span>.</span>
          </h1>

          <p>
            Skip long queues. Track your token in real time.
            Access essential services with a simpler,
            smarter queue experience.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-check">✓</span>

              <div>
                <strong>Real-time queue tracking</strong>
                <small>Know when your turn is approaching.</small>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-check">✓</span>

              <div>
                <strong>Simple digital access</strong>
                <small>Manage your token from one place.</small>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-check">✓</span>

              <div>
                <strong>Organized service counters</strong>
                <small>A clearer and smoother queue experience.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span className="auth-footer-dot" />
          A smarter way to manage waiting time
        </div>

        <div className="auth-decoration auth-decoration-one" />
        <div className="auth-decoration auth-decoration-two" />
      </aside>

      {/* RIGHT AUTHENTICATION PANEL */}

      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-icon">Q</span>

            <span className="auth-brand-name">
              Queue<span>Smart</span>
            </span>
          </Link>
        </div>

        <div className="auth-form-container">
          <div className="auth-top-note">
            <span className="auth-secure-icon">▣</span>
            Secure account access
          </div>

          <div className="auth-form-heading">
            <div className="auth-role-label">
              <span className="auth-role-dot" />

              {isOfficer
                ? 'OFFICER PORTAL'
                : isRegister
                  ? 'CREATE YOUR ACCOUNT'
                  : 'USER PORTAL'}
            </div>

            <h2>
              {isOfficer
                ? 'Welcome back, officer'
                : isRegister
                  ? 'Create your account'
                  : 'Welcome back'}
            </h2>

            <p>
              {isOfficer
                ? 'Sign in to manage service counters and monitor the queue.'
                : isRegister
                  ? 'Join us for a simpler and more convenient service experience.'
                  : 'Sign in to access your tokens and track your queue status.'}
            </p>
          </div>

          {/* LOGIN / REGISTRATION FORM */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="name">Full name</label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">♙</span>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="phone">
                  Phone number <span className="auth-optional">(optional)</span>
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">☎</span>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon">▣</span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    isRegister
                      ? 'Create a strong password'
                      : 'Enter your password'
                  }
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  minLength={isRegister ? 6 : undefined}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {isRegister && (
                <small className="auth-field-hint">
                  Use at least 6 characters.
                </small>
              )}
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            {success && (
              <div
                className="auth-alert auth-alert-success"
                role="status"
              >
                <span>✓</span>
                {success}
              </div>
            )}

            <button
              className="auth-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create account'
                  : isOfficer
                    ? 'Sign in to officer portal'
                    : 'Sign in to your account'}

              {!loading && (
                <span className="auth-submit-arrow">→</span>
              )}
            </button>
          </form>

          {/* FOOTER LINKS */}

          {!isOfficer && (
            <div className="auth-switch-link">
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}

              {' '}

              {isRegister ? (
                <Link to="/login">Sign in</Link>
              ) : (
                <Link to="/register">Create one</Link>
              )}
            </div>
          )}

          {isOfficer && (
            <div className="auth-officer-note">
              Officer access is restricted to authorized accounts.
              Contact your administrator if you need account assistance.
            </div>
          )}

          <div className="auth-divider">
            <span />
            <small>SMART VIRTUAL TOKEN SYSTEM</small>
            <span />
          </div>

          <Link to="/" className="auth-back-link">
            <span>←</span> Back to home
          </Link>

          <div className="auth-legal-note">
            Secure access · Queue management · Real-time updates
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthPage;