import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function LogExpense() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        project_id: '',
        item_description: '',
        amount: ''
    });
    const [invoiceFile, setInvoiceFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data.filter(p => p.is_active));
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = new FormData();
            data.append('item_description', formData.item_description);
            data.append('amount', formData.amount);
            if (formData.project_id) data.append('project_id', formData.project_id);
            if (invoiceFile) data.append('invoice', invoiceFile);

            await api.post('/expenses', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('הוצאה דווחה בהצלחה!');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'שגיאה בשמירת הוצאה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h1 className="card-header">דיווח הוצאה למערכת</h1>
            {error && <div className="text-danger mb-4 font-bold">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">פרויקט (אופציונלי - קשור להוצאה ספציפית)</label>
                    <select
                        className="form-select"
                        value={formData.project_id}
                        onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                    >
                        <option value="">-- בחר פרויקט (או השאר ריק) --</option>
                        {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">תיאור הקנייה (מה קנית?)</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.item_description}
                        onChange={e => setFormData({ ...formData, item_description: e.target.value })}
                        required
                        placeholder="לדוגמה: כבלים וברגים מברזל"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">עלות ההוצאה (₪)</label>
                    <input
                        type="number"
                        className="form-input"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required
                        placeholder="0"
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">תצלום חשבונית (רשות)</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="form-input"
                        onChange={e => setInvoiceFile(e.target.files[0])}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary mt-4" style={{ width: '100%' }}>
                    {loading ? 'שומר...' : 'שמור הוצאה'}
                </button>
            </form>
        </div>
    );
}

export default LogExpense;
