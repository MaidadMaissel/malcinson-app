import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function LogHours() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);

    // Default to today
    const [formData, setFormData] = useState({
        project_id: '',
        work_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data.filter(p => p.is_active));
            if (res.data.length > 0) setFormData(f => ({ ...f, project_id: res.data[0].project_id }));
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/work-hours', formData);
            alert('שעות עבודה נשמרו בהצלחה!');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'שגיאה בשמירת שעות עבודה');
        }
    };

    return (
        <div className="card">
            <h1 className="card-header">דיווח שעות עבודה - {user.name}</h1>
            {error && <div className="text-danger mb-4 font-bold">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">פרויקט</label>
                    <select
                        className="form-select"
                        value={formData.project_id}
                        onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                        required
                    >
                        <option value="">-- בחר פרויקט --</option>
                        {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">תאריך עבודה</label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.work_date}
                        onChange={e => setFormData({ ...formData, work_date: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className="form-label">שעת התחלה</label>
                        <input
                            type="time"
                            className="form-input"
                            value={formData.start_time}
                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">שעת סיום</label>
                        <input
                            type="time"
                            className="form-input"
                            value={formData.end_time}
                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>שמור שעות</button>
            </form>
        </div>
    );
}

export default LogHours;
