import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function EmployeesList() {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (phone) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
            await api.delete(`/employees/${phone}`);
            fetchEmployees();
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h1 className="text-2xl font-bold mb-0">ניהול עובדים</h1>
                <Link to="/employees/add" className="btn btn-success">+ הוסף עובד חדש</Link>
            </div>

            <div className="table-container mt-4">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>שם העובד</th>
                            <th>טלפון</th>
                            <th>רמה מתשובצת</th>
                            <th>שכר שעתי</th>
                            <th>תפקיד במערכת</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.phone}>
                                <td className="font-bold">{emp.name}</td>
                                <td dir="ltr" style={{ textAlign: 'right' }}>{emp.phone}</td>
                                <td>{emp.level_name || '-'}</td>
                                <td>{emp.hourly_rate ? `₪${emp.hourly_rate}` : '-'}</td>
                                <td>
                                    <span className={emp.is_manager ? 'badge badge-primary' : 'badge'} style={{ background: emp.is_manager ? '' : '#e2e8f0', color: emp.is_manager ? '' : '#475569' }}>
                                        {emp.is_manager ? 'מנהל רשת' : 'עובד שטח'}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Link to={`/employees/edit/${emp.phone}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>ערוך</Link>
                                        <button onClick={() => handleDelete(emp.phone)} className="btn btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>מחק</button>
                                        <Link to={`/pay-employee/${emp.phone}`} className="text-primary text-sm font-bold mr-2 align-self-center">שלם משכורת</Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EmployeesList;
