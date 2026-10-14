import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const API_URL = 'http://localhost:5000';

function ProfilePage({ role = 'user' }) {
  const navigate = useNavigate();

  const isOfficer = ['officer', 'admin'].includes(role);

  const tokenKey = isOfficer ? 'officerToken' : 'userToken';
  const userKey = isOfficer ? 'officerUser' : 'userAccount';

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    counterNumber: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = localStorage.getItem(tokenKey);

      if (!token) {
        navigate(isOfficer ? '/officer-login' : '/login', {
          replace: true,
        });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || 'Unable to load profile.'
          );
        }

        const user = data.user || data;

        if (active) {
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || '',
            counterNumber:
              user.counterNumber ?? user.counter_number ?? null,
          });
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your profile.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate, tokenKey, isOfficer]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem(tokenKey);

      if (!token) {
        navigate(isOfficer ? '/officer-login' : '/login', {
          replace: true,
        });
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Unable to update profile.'
        );
      }

      const savedUser = JSON.parse(
        localStorage.getItem(userKey) || '{}'
      );

      const updatedUser = data.user || {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      };

      const mergedUser = {
        ...savedUser,
        ...updatedUser,
      };

      localStorage.setItem(userKey, JSON.stringify(mergedUser));

      setProfile((previous) => ({
        ...previous,
        name: mergedUser.name || previous.name,
        email: mergedUser.email || previous.email,
        phone: mergedUser.phone || '',
        role: mergedUser.role || previous.role,
        counterNumber:
          mergedUser.counterNumber ??
          mergedUser.counter_number ??
          previous.counterNumber,
      }));

      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    if (isOfficer) {
      localStorage.removeItem('officerToken');
      localStorage.removeItem('officerUser');

      navigate('/officer-login', { replace: true });
    } else {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userAccount');

      navigate('/login', { replace: true });
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card profile-card">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(isOfficer ? '/officer' : '/user')
          }
        >
          ← Back to Dashboard
        </button>

        <div className="auth-icon">👤</div>

        <h1>My Profile</h1>

        <p className="auth-subtitle">
          Manage your account details
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Full Name</label>

          <input
            id="profile-name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="profile-email">Email Address</label>

          <input
            id="profile-email"
            name="email"
            type="email"
            value={profile.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="profile-phone">Phone Number</label>

          <input
            id="profile-phone"
            name="phone"
            type="tel"
            value={profile.phone}
            onChange={handleChange}
          />

          <label htmlFor="profile-role">Account Role</label>

          <input
            id="profile-role"
            value={profile.role}
            readOnly
          />

          {isOfficer && (
            <>
              <label htmlFor="profile-counter">
                Assigned Counter
              </label>

              <input
                id="profile-counter"
                value={
                  profile.counterNumber ?? 'All counters (admin)'
                }
                readOnly
              />
            </>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <button
          type="button"
          className="auth-button logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;