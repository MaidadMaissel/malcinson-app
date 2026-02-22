import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function EmployeeDashboard() {
    const { user } = useContext(AuthContext);
    const [owedData, setOwedData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get(`/payments/owed/${user.phone}`);
            setOwedData(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">סיכום אישי - {user.name}</h1>

            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-card-title">סה"כ לתשלום (עבודה)</div>
                    <div className="summary-card-value">₪{owedData?.unpaid_labor?.toLocaleString() || 0}</div>
                </div>
                <div className="summary-card warning">
                    <div className="summary-card-title">הוצאות להחזר</div>
                    <div className="summary-card-value">₪{owedData?.unpaid_expenses?.toLocaleString() || 0}</div>
                </div>
                <div className="summary-card success">
                    <div className="summary-card-title">סה"כ חוב החברה אליך</div>
                    <div className="summary-card-value">₪{owedData?.total_owed?.toLocaleString() || 0}</div>
                </div>
            </div>

            <div className="grid grid-cols-2">
                <Link to="/log-hours" className="card" style={{ display: 'block', textAlign: 'center', background: '#f8fafc' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⏱️</span>
                    <h2 className="text-xl font-bold text-primary">דיווח שעות עבודה</h2>
                    <p className="text-muted">הזן שעות עבודה יומיות לפי פרויקט</p>
                </Link>
                <Link to="/log-expense" className="card" style={{ display: 'block', textAlign: 'center', background: '#f8fafc' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🧾</span>
                    <h2 className="text-xl font-bold text-primary">דיווח הוצאה</h2>
                    <p className="text-muted">העלה קבלות עבור רכישות שביצעת</p>
                </Link>
            </div>
        </div>
    );
}

export default EmployeeDashboard;
