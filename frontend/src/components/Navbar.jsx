import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', textDecoration: 'none' }}>
                        מלכינסון ניהול
                    </Link>
                    <span className="badge badge-primary">{user.is_manager ? 'מנהל' : 'עובד'}</span>
                </div>

                <div className="nav-links">
                    {user.is_manager ? (
                        <>
                            <Link to="/manager" className="nav-link">פרויקטים</Link>
                            <Link to="/employees" className="nav-link">עובדים</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/" className="nav-link">ראשי</Link>
                            <Link to="/log-hours" className="nav-link">דיווח שעות</Link>
                            <Link to="/log-expense" className="nav-link">דיווח הוצאה</Link>
                            <Link to="/my-payments" className="nav-link">התשלומים שלי</Link>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '500' }}>שלום, {user.name}</span>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                        התנתק
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
