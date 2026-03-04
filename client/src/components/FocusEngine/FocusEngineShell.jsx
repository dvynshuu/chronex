import React from 'react';
import { FocusProvider } from './FocusContext';
import PomodoroEngine from './PomodoroEngine';
import TaskManager from './TaskManager';
import GlobalAwareness from './GlobalAwareness';
import FocusStats from './FocusStats';
import './FocusEngine.css';

const FocusEngineShell = () => {
    return (
        <FocusProvider>
            <section className="dashboard__focus-section glass-panel">
                <div className="dashboard__focus-header">
                    <div>
                        <p className="dashboard__focus-kicker">Chronex Focus Engine</p>
                        <h3 className="dashboard__focus-title">
                            Deep work, in sync with global time.
                        </h3>
                    </div>
                    <div className="dashboard__focus-status">
                        <span className="status-pill">
                            <span className="status-pill__dot" />
                            Focus-ready
                        </span>
                    </div>
                </div>

                <div className="dashboard__focus-grid">
                    <div className="dashboard__focus-column">
                        <PomodoroEngine />
                        <FocusStats />
                    </div>
                    <div className="dashboard__focus-column">
                        <TaskManager />
                        <GlobalAwareness />
                    </div>
                </div>
            </section>
        </FocusProvider>
    );
};

export default FocusEngineShell;

