import { useNavigate } from 'react-router-dom';

function LogoutButton({ role = 'user' }) {
  const navigate = useNavigate();

  function handleLogout() {
    const confirmed = window.confirm('Are you sure you want to logout?');

    if (!confirmed) return;

    if (role === 'officer' || role === 'admin') {
      localStorage.removeItem('officerToken');
      localStorage.removeItem('officerUser');
      navigate('/officer-login', { replace: true });
    } else {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userAccount');
      navigate('/login', { replace: true });
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        padding: '10px 18px',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
      }}
    >
      Logout
    </button>
  );
}

export default LogoutButton;