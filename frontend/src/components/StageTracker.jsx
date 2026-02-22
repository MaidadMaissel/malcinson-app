import React from 'react';

const STAGES = [
    { id: 'contract_closed_date', label: 'סגירת חוזה' },
    { id: 'materials_ordered_date', label: 'הזמנת חומרים' },
    { id: 'construction_start_date', label: 'תחילת בנייה' },
    { id: 'delivery_date', label: 'מסירה' }
];

function StageTracker({ project }) {
    if (!project) return null;

    // Determine current stage index based on which dates are filled
    let currentStageIndex = -1;
    for (let i = 0; i < STAGES.length; i++) {
        if (project[STAGES[i].id]) {
            currentStageIndex = i;
        }
    }

    const progressPercent = currentStageIndex === -1 ? 0 : (currentStageIndex / (STAGES.length - 1)) * 100;

    return (
        <div className="card">
            <h3 className="card-header">שלב ההתקדמות בעבודה</h3>
            <div className="stage-tracker">
                <div className="stage-tracker-progress" style={{ width: `${100 - progressPercent}%` }}></div>
                {STAGES.map((stage, index) => {
                    const isCompleted = !!project[stage.id];
                    const isActive = index === currentStageIndex;

                    return (
                        <div key={stage.id} className={`stage ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                            <div className="stage-dot"></div>
                            <span className="stage-label">{stage.label}</span>
                            {isCompleted && <span className="text-xs text-muted" dir="ltr">{project[stage.id]}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StageTracker;
