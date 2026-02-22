import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(name, phone);
            if (user.is_manager) navigate('/manager');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'שגיאה בהתחברות');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="text-3xl text-primary font-bold">מלכינסון</h1>
                    <p className="text-muted">מערכת ניהול עבודה והוצאות</p>
                </div>

                {error && <div style={{ padding: '1rem', background: 'var(--danger)', color: 'white', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">שם מלא</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="לדוגמה: ישראל ישראלי"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">מספר טלפון</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                            dir="ltr"
                            placeholder="050-0000000"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        התחבר למערכת
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
