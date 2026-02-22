import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AddProject() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        project_name: '',
        client_name: '',
        client_phone: '',
        client_address: '',
        client_email: '',
        contract_price: '',
        target_cost: '',
        target_date: '',
        project_location: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/projects', formData);
            navigate('/manager');
        } catch (err) {
            setError(err.response?.data?.error || 'אירעה שגיאה ביצירת הפרויקט');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="card-header">פתיחת פרויקט חדש</h1>

            {error && <div className="text-danger mb-4 font-bold">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2">
                    {/* Project Details */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-primary">פרטי הפרויקט</h2>

                        <div className="form-group">
                            <label className="form-label">שם הפרויקט *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.project_name}
                                onChange={e => setFormData({ ...formData, project_name: e.target.value })}
                                required
                                placeholder="לדוגמה: שיפוץ דירה תל אביב"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">מיקום / כתובת הפרויקט</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.project_location}
                                onChange={e => setFormData({ ...formData, project_location: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">תאריך יעד צפוי לסיום</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.target_date}
                                onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">הסכם התקשרות (₪) - החוזה מול הלקוח</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.contract_price}
                                onChange={e => setFormData({ ...formData, contract_price: e.target.value })}
                                min="0"
                                step="1"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">עלות יעד משוערת לביצוע (₪)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.target_cost}
                                onChange={e => setFormData({ ...formData, target_cost: e.target.value })}
                                min="0"
                                step="1"
                            />
                        </div>
                    </div>

                    {/* Client Details */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-primary">פרטי הלקוח</h2>

                        <div className="form-group">
                            <label className="form-label">שם איש קשר / לקוח</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.client_name}
                                onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">טלפון לקוח</label>
                            <input
                                type="tel"
                                className="form-input"
                                dir="ltr"
                                value={formData.client_phone}
                                onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">דוא"ל לקוח</label>
                            <input
                                type="email"
                                className="form-input"
                                dir="ltr"
                                value={formData.client_email}
                                onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">כתובת לקוח (לחיוב)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.client_address}
                                onChange={e => setFormData({ ...formData, client_address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                        {loading ? 'יוצר...' : 'צור פרויקט חדש'}
                    </button>
                    <button type="button" onClick={() => navigate('/manager')} className="btn btn-secondary">
                        ביטול חזרה לראשי
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddProject;
