import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import StageTracker from '../components/StageTracker';

function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);

    // UI states
    const [isEditingStage, setIsEditingStage] = useState(false);
    const [isEditingWorkers, setIsEditingWorkers] = useState(false);

    // Workers state
    const [allEmployees, setAllEmployees] = useState([]);
    const [selectedWorkerPhones, setSelectedWorkerPhones] = useState([]);
    const [savingWorkers, setSavingWorkers] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [projRes, sumRes, expRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/projects/${id}/summary`),
                api.get(`/expenses?project_id=${id}`)
            ]);
            setProject(projRes.data);
            setSummary(sumRes.data);
            setExpenses(expRes.data);
            setSelectedWorkerPhones((projRes.data.workers || []).map(w => w.phone));
        } catch (e) {
            console.error(e);
        }
    };

    const advanceStage = async (stageKey) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await api.put(`/projects/${id}`, { ...project, [stageKey]: today });
            setIsEditingStage(false);
            fetchData();
        } catch (e) {
            alert('Unable to advance stage');
        }
    };

    const handleEditWorkersClick = async () => {
        if (!isEditingWorkers) {
            try {
                const res = await api.get('/employees');
                setAllEmployees(res.data);
            } catch (e) {
                console.error(e);
            }
        }
        setIsEditingWorkers(!isEditingWorkers);
    };

    const toggleWorker = (phone) => {
        if (selectedWorkerPhones.includes(phone)) {
            setSelectedWorkerPhones(selectedWorkerPhones.filter(p => p !== phone));
        } else {
            setSelectedWorkerPhones([...selectedWorkerPhones, phone]);
        }
    };

    const saveWorkers = async () => {
        setSavingWorkers(true);
        try {
            await api.post(`/projects/${id}/workers`, { phones: selectedWorkerPhones });
            setIsEditingWorkers(false);
            fetchData();
        } catch (e) {
            alert('שגיאה בשמירת עובדים מוקצים');
        } finally {
            setSavingWorkers(false);
        }
    };

    if (!project || !summary) return <div>טוען...</div>;

    const isProfitable = project.contract_price >= summary.actual_cost;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold">{project.project_name}</h1>
                    <p className="text-muted">{project.project_location} | לקוח: {project.client_name} ({project.client_phone})</p>
                </div>
                <div className={project.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                    {project.is_active ? 'פעיל' : 'לא פעיל / הסתיים'}
                </div>
            </div>

            <StageTracker project={project} />

            {isEditingStage && (
                <div className="card mb-4">
                    <h3 className="font-bold mb-2">קדם שלב פרויקט להיום:</h3>
                    <div className="flex gap-2">
                        {!project.contract_closed_date && <button onClick={() => advanceStage('contract_closed_date')} className="btn btn-secondary">סגירת חוזה</button>}
                        {project.contract_closed_date && !project.materials_ordered_date && <button onClick={() => advanceStage('materials_ordered_date')} className="btn btn-secondary">הזמנת חומרים</button>}
                        {project.materials_ordered_date && !project.construction_start_date && <button onClick={() => advanceStage('construction_start_date')} className="btn btn-secondary">תחילת בנייה</button>}
                        {project.construction_start_date && !project.delivery_date && <button onClick={() => advanceStage('delivery_date')} className="btn btn-success">סיום ומסירה</button>}
                        <button onClick={() => setIsEditingStage(false)} className="btn text-muted">ביטול</button>
                    </div>
                </div>
            )}
            {!isEditingStage && !project.delivery_date && (
                <button onClick={() => setIsEditingStage(true)} className="btn btn-primary mb-4">עדכן שלב פרויקט (קדם שלב)</button>
            )}

            <div className="summary-grid">
                <div className="card" style={{ marginBottom: 0 }}>
                    <div className="text-muted mb-1 text-sm font-bold">מחיר חוזה (נסגר)</div>
                    <div className="text-2xl font-bold text-primary">₪{project.contract_price?.toLocaleString()}</div>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                    <div className="text-muted mb-1 text-sm font-bold">עלויות בפועל (עבודה + ציוד)</div>
                    <div className="text-2xl font-bold text-danger">₪{summary.actual_cost?.toLocaleString()}</div>
                    <div className="text-xs text-muted mt-1">עבודה: ₪{summary.labor_cost} | הוצאות: ₪{summary.expense_total}</div>
                </div>
                <div className={`card ${isProfitable ? 'success' : 'warning'}`} style={{ marginBottom: 0, background: isProfitable ? 'var(--surface)' : '#fef3c7', border: isProfitable ? '1px solid var(--success)' : 'none' }}>
                    <div className="text-muted mb-1 text-sm font-bold">רווח משוער</div>
                    <div className={`text-2xl font-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
                        ₪{(project.contract_price - summary.actual_cost).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="card">
                    <div className="card-header items-center">
                        <h3 className="mb-0">עובדים משויכים לפרויקט</h3>
                        <button onClick={handleEditWorkersClick} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                            {isEditingWorkers ? 'ביטול' : 'נהל צוות עובדים'}
                        </button>
                    </div>

                    {isEditingWorkers ? (
                        <div className="mt-4">
                            <p className="text-muted text-sm mb-2">בחר אילו עובדים יכולים לדווח שעות לפרויקט זה (השאר ריק כדי שכולם יוכלו):</p>
                            <div className="flex-col gap-2 mb-4" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px' }}>
                                {allEmployees.map(emp => (
                                    <label key={emp.phone} className="flex gap-2 items-center" style={{ cursor: 'pointer', padding: '0.25rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedWorkerPhones.includes(emp.phone)}
                                            onChange={() => toggleWorker(emp.phone)}
                                            style={{ width: '1.2rem', height: '1.2rem' }}
                                        />
                                        <span>{emp.name} <span className="text-muted text-xs">({emp.level_name || 'ללא פרמידות'})</span></span>
                                    </label>
                                ))}
                            </div>
                            <button onClick={saveWorkers} disabled={savingWorkers} className="btn btn-primary" style={{ width: '100%' }}>
                                {savingWorkers ? 'שומר...' : 'שמור צוות מוקצה'}
                            </button>
                        </div>
                    ) : (
                        <ul className="mt-4" style={{ paddingRight: '1rem' }}>
                            {project.workers?.length > 0 ? project.workers.map(w => (
                                <li key={w.phone} className="mb-2"><b>{w.name}</b> ({w.phone})</li>
                            )) : <li className="text-muted mt-4">כל העובדים מורשים לדווח על פרויקט זה. (רשימה ריקה)</li>}
                        </ul>
                    )}
                </div>

                <div className="card">
                    <h3 className="card-header">הוצאות קשורות לפרויקט</h3>
                    {expenses.length === 0 ? <p className="text-muted">אין הוצאות</p> : (
                        <div className="flex-col gap-2">
                            {expenses.map(e => (
                                <div key={e.id} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <span className="font-bold">{e.item_description}</span>
                                        <div className="text-xs text-muted">{e.employee_name} ({new Date(e.created_at).toLocaleDateString('he-IL')})</div>
                                        {e.invoice_image && <a href={e.invoice_image} target="_blank" rel="noreferrer" className="text-xs text-primary block mt-1">צפה קבלה/חשבונית</a>}
                                    </div>
                                    <div className="font-bold text-danger">₪{e.amount}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectDetail;
