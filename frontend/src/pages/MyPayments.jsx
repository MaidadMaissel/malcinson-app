import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function MyPayments() {
    const { user } = useContext(AuthContext);
    const [payments, setPayments] = useState([]);
    const [owedData, setOwedData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [payRes, owedRes] = await Promise.all([
                api.get(`/payments?phone=${user.phone}`),
                api.get(`/payments/owed/${user.phone}`)
            ]);
            setPayments(payRes.data);
            setOwedData(owedRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">תשלומים והיסטוריה</h1>

            <div className="card mb-4" style={{ background: 'var(--primary)', color: 'white' }}>
                <h2 className="text-xl mb-2" style={{ color: 'white' }}>יתרה נוכחית לתשלום:</h2>
                <div className="text-3xl font-bold">₪{owedData?.total_owed?.toLocaleString() || 0}</div>
                <p className="mt-2 text-sm opacity-90">סך הכל שולם בהיסטוריה: ₪{owedData?.total_paid?.toLocaleString() || 0}</p>
            </div>

            <div className="card">
                <h2 className="card-header">היסטוריית תשלומים מהחברה</h2>
                {payments.length === 0 ? (
                    <p className="text-muted">אין היסטוריית תשלומים עדיין.</p>
                ) : (
                    <div className="table-container">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>תאריך תשלום</th>
                                    <th>סכום</th>
                                    <th>הערות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td dir="ltr" style={{ textAlign: 'right' }}>{new Date(p.paid_at).toLocaleString('he-IL')}</td>
                                        <td className="font-bold text-success">₪{p.amount?.toLocaleString()}</td>
                                        <td>{p.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyPayments;
