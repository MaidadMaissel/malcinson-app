import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ManagerDashboard() {
    const [projects, setProjects] = useState([]);
    const [owedAll, setOwedAll] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projRes, owedRes] = await Promise.all([
                api.get('/projects'),
                api.get('/payments/owed-all')
            ]);
            setProjects(projRes.data);
            setOwedAll(owedRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <div className="card-header">
                <h1 className="text-2xl font-bold mb-0">לוח בקרה למנהל</h1>
            </div>

            <div className="grid grid-cols-2">
                {/* Projects List */}
                <div className="card">
                    <div className="card-header">
                        <span>פרויקטים פעילים</span>
                        <div className="flex gap-2 items-center">
                            <span className="badge badge-primary">{projects.filter(p => p.is_active).length}</span>
                            <Link to="/projects/add" className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>+ הוסף</Link>
                        </div>
                    </div>
                    <div className="flex-col gap-4">
                        {projects.map(p => (
                            <Link key={p.project_id} to={`/project/${p.project_id}`} className="card" style={{ marginBottom: 0, padding: '1rem', border: '1px solid var(--border)' }}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg">{p.project_name}</span>
                                    <span className={p.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                                        {p.is_active ? 'פעיל' : 'הסתיים'}
                                    </span>
                                </div>
                                <div className="text-muted text-sm flex justify-between">
                                    <span>לקוח: {p.client_name || 'לא צוין'}</span>
                                    <span>חוזה: ₪{p.contract_price?.toLocaleString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Financial Overview - Owed to Employees */}
                <div className="card">
                    <div className="card-header">
                        <span>חובות פתוחים לעובדים</span>
                        <span className="badge badge-warning">₪{owedAll.reduce((sum, e) => sum + e.total_owed, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex-col gap-4">
                        {owedAll.filter(e => e.total_owed > 0).map(e => (
                            <div key={e.phone} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <div className="font-bold">{e.name}</div>
                                    <div className="text-sm text-muted">עבודה: ₪{e.unpaid_labor} | הוצאות: ₪{e.unpaid_expenses}</div>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-danger">₪{e.total_owed?.toLocaleString()}</div>
                                    <Link to={`/pay-employee/${e.phone}`} className="text-primary text-sm">שלם עכשיו</Link>
                                </div>
                            </div>
                        ))}
                        {owedAll.filter(e => e.total_owed > 0).length === 0 && (
                            <div className="text-success text-center py-4 font-bold">אין חובות פתוחים לעובדים! דרך צלחה.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManagerDashboard;
