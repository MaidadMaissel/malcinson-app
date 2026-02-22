import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

function AddEmployee() {
    const { phone } = useParams();
    const navigate = useNavigate();
    const isEdit = !!phone;

    const [levels, setLevels] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        level_id: '',
        is_manager: false
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, [phone]);

    const fetchData = async () => {
        try {
            const levRes = await api.get('/employees/levels');
            setLevels(levRes.data);
            if (levRes.data.length > 0 && !isEdit) {
                setFormData(f => ({ ...f, level_id: levRes.data[0].level_id }));
            }

            if (isEdit) {
                const empRes = await api.get('/employees');
                const emp = empRes.data.find(e => e.phone === phone);
                if (emp) {
                    setFormData({
                        name: emp.name,
                        phone: emp.phone,
                        level_id: emp.level_id || '',
                        is_manager: emp.is_manager
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isEdit) {
                await api.put(`/employees/${phone}`, formData);
            } else {
                await api.post('/employees', formData);
            }
            navigate('/employees');
        } catch (err) {
            setError(err.response?.data?.error || 'אירעה שגיאה בשמירת פרטי העובד');
        }
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="card-header">{isEdit ? 'עריכת עובד' : 'הוספת עובד חדש'}</h1>

            {error && <div className="text-danger mb-4 font-bold">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">שם מלא</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">מספר טלפון</label>
                    <input
                        type="tel"
                        className="form-input"
                        dir="ltr"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        required
                        disabled={isEdit}
                    />
                    {isEdit && <small className="text-muted">לא ניתן לשנות מספר טלפון (זהו המזהה הראשי של העובד).</small>}
                </div>

                <div className="form-group">
                    <label className="form-label">רמת עובד (קובע שכר שעתי)</label>
                    <select
                        className="form-select"
                        value={formData.level_id}
                        onChange={e => setFormData({ ...formData, level_id: e.target.value })}
                    >
                        {levels.map(l => (
                            <option key={l.level_id} value={l.level_id}>{l.level_name} (₪{l.hourly_rate} לשעה)</option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <input
                        type="checkbox"
                        id="is_manager"
                        checked={formData.is_manager}
                        onChange={e => setFormData({ ...formData, is_manager: e.target.checked })}
                        style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                    <label htmlFor="is_manager" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                        האם מנהל? (נותן גישה לכלל נתוני המערכת)
                    </label>
                </div>

                <div className="flex gap-4 mt-4 mt-4">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEdit ? 'שמור שינויים' : 'הוסף עובד'}</button>
                    <button type="button" onClick={() => navigate('/employees')} className="btn btn-secondary">ביטול</button>
                </div>
            </form>
        </div>
    );
}

export default AddEmployee;
