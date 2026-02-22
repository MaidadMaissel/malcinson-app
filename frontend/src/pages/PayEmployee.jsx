import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

function PayEmployee() {
    const { phone } = useParams();
    const navigate = useNavigate();
    const [owedData, setOwedData] = useState(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/payments/owed/${phone}`).then(res => {
            setOwedData(res.data);
            // default payment amount prepopulated to the total owed
            if (res.data.total_owed > 0) {
                setAmount(res.data.total_owed);
            }
        });
    }, [phone]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Mark hours and expenses as paid (if paying full amount, assume all are paid - for simplicity)
            await api.post('/payments', { phone, amount, note });
            // To keep things simple based on requirement, pay-all marks all open hours as paid
            await api.put(`/work-hours/pay-all/${phone}`);
            await alert('התשלום נרשם ודווח בהצלחה!');
            navigate('/manager');
        } catch (err) {
            alert('שגיאה בתשלום: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!owedData) return <div>טוען...</div>;

    return (
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h1 className="card-header">ביצוע תשלום לעובד</h1>

            <div className="mb-4 text-center">
                <p className="text-muted">סך חוב פתוח של החברה:</p>
                <div className="text-4xl font-bold text-danger">₪{owedData.total_owed?.toLocaleString()}</div>
                <div className="text-sm mt-2 text-muted">
                    שעות עבודה (₪{owedData.unpaid_labor}) + הוצאות שהעובד שילם (₪{owedData.unpaid_expenses})
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">סכום תשלום בפועל (₪)</label>
                    <input
                        type="number"
                        className="form-input"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        min="1"
                        step="0.01"
                        style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">הערות על התשלום (מזומן / צ'ק / העברה / מקדמה)</label>
                    <input
                        type="text"
                        className="form-input"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="לדוגמה: מזומן חודש אפריל"
                    />
                </div>

                <button type="submit" disabled={loading} className="btn btn-success" style={{ width: '100%', marginTop: '1rem', fontSize: '1.25rem' }}>
                    {loading ? 'מבצע...' : 'אשר תשלום ועדכן מערכת'}
                </button>
            </form>
        </div>
    );
}

export default PayEmployee;
