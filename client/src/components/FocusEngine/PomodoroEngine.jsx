import React, { useMemo, useRef, useEffect } from 'react';
import { useFocusContext, useRafNow, isOffHoursNow } from './FocusContext';

const formatTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const PomodoroEngine = () => {
    const { state, dispatch } = useFocusContext();
    const now = useRafNow();
    const audioRef = useRef(null);

    const { timer, config, tasks } = state;

    const remainingMs = useMemo(() => {
        if (timer.phaseEndTimestamp && timer.isRunning) {
            return Math.max(0, timer.phaseEndTimestamp - now);
        }
        return timer.lastKnownRemainingMs;
    }, [timer.phaseEndTimestamp, timer.isRunning, timer.lastKnownRemainingMs, now]);

    const totalMs = useMemo(() => {
        if (timer.phaseEndTimestamp && timer.phaseStartTimestamp) {
            return timer.phaseEndTimestamp - timer.phaseStartTimestamp;
        }
        if (timer.mode === 'focus' || timer.mode === 'idle') return config.focusDurationMs;
        if (timer.mode === 'shortBreak') return config.shortBreakDurationMs;
        if (timer.mode === 'longBreak') return config.longBreakDurationMs;
        return config.focusDurationMs;
    }, [timer.phaseEndTimestamp, timer.phaseStartTimestamp, timer.mode, config]);

    const progress = useMemo(() => {
        if (!totalMs) return 0;
        const done = totalMs - remainingMs;
        return Math.min(1, Math.max(0, done / totalMs));
    }, [totalMs, remainingMs]);

    // Tick + auto-completion with timestamp-based math
    useEffect(() => {
        if (timer.isRunning && timer.phaseEndTimestamp) {
            if (now >= timer.phaseEndTimestamp) {
                dispatch({ type: 'TIMER_COMPLETE_PHASE', payload: { now } });
                if (config.soundEnabled && audioRef.current) {
                    try {
                        audioRef.current.currentTime = 0;
                        audioRef.current.volume = config.soundVolume;
                        audioRef.current.play().catch(() => {});
                    } catch {
                        // ignore
                    }
                }
            } else {
                dispatch({ type: 'TIMER_TICK', payload: { now } });
            }
        }
    }, [now, timer.isRunning, timer.phaseEndTimestamp, dispatch, config.soundEnabled, config.soundVolume]);

    const handleStartPause = () => {
        const currentNow = Date.now();
        if (timer.isRunning) {
            dispatch({ type: 'TIMER_PAUSE', payload: { now: currentNow } });
        } else {
            if (isOffHoursNow()) {
                // kept subtle; surfaced via GlobalAwareness banner
            }
            dispatch({ type: 'TIMER_START', payload: { now: currentNow } });
        }
    };

    const handleReset = () => {
        dispatch({ type: 'TIMER_RESET' });
    };

    const handleModeChange = (mode) => {
        const nowTs = Date.now();
        dispatch({ type: 'TIMER_START', payload: { mode, now: nowTs } });
    };

    const activeTask =
        timer.activeTaskId != null
            ? tasks.find((t) => t.id === timer.activeTaskId) || null
            : null;

    const circumference = 2 * Math.PI * 80;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div
            className={`ce-panel ce-timer-panel ${
                state.ui.isInFocusVisual && timer.mode === 'focus'
                    ? 'ce-focus-mode'
                    : timer.mode === 'shortBreak' || timer.mode === 'longBreak'
                    ? 'ce-break-mode'
                    : ''
            }`}
        >
            <div className="ce-timer-header">
                <div className="ce-timer-modes">
                    <button
                        className={`ce-mode-chip ${
                            timer.mode === 'focus' || timer.mode === 'idle' ? 'is-active' : ''
                        }`}
                        type="button"
                        onClick={() => handleModeChange('focus')}
                    >
                        Focus
                    </button>
                    <button
                        className={`ce-mode-chip ${
                            timer.mode === 'shortBreak' ? 'is-active' : ''
                        }`}
                        type="button"
                        onClick={() => handleModeChange('shortBreak')}
                    >
                        Short break
                    </button>
                    <button
                        className={`ce-mode-chip ${
                            timer.mode === 'longBreak' ? 'is-active' : ''
                        }`}
                        type="button"
                        onClick={() => handleModeChange('longBreak')}
                    >
                        Long break
                    </button>
                </div>
                <div className="ce-session-meta">
                    <span className="ce-session-label">
                        {timer.mode === 'focus'
                            ? 'In focus'
                            : timer.mode === 'shortBreak'
                            ? 'Short break'
                            : timer.mode === 'longBreak'
                            ? 'Long break'
                            : 'Idle'}
                    </span>
                    <span className="ce-session-count">
                        Cycle: {timer.sessionCount} / {config.longBreakEvery}
                    </span>
                </div>
            </div>

            <div className="ce-timer-core">
                <div className="ce-timer-circle">
                    <svg className="ce-timer-svg" viewBox="0 0 200 200">
                        <defs>
                            <radialGradient id="ceFocusGlow" cx="50%" cy="50%" r="65%">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                                <stop offset="70%" stopColor="#020617" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <circle
                            className="ce-timer-track"
                            cx="100"
                            cy="100"
                            r="80"
                            strokeWidth="2"
                        />
                        <circle
                            className="ce-timer-progress"
                            cx="100"
                            cy="100"
                            r="80"
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                        />
                    </svg>
                    <div className="ce-timer-center">
                        <div className="ce-timer-time">{formatTime(remainingMs)}</div>
                        <div className="ce-timer-sub">
                            {timer.mode === 'focus' ? 'Deep work' : 'Recovery'}
                        </div>
                    </div>
                </div>
                <div className="ce-timer-controls">
                    <button className="ce-primary-btn" type="button" onClick={handleStartPause}>
                        {timer.isRunning ? 'Pause' : timer.mode === 'idle' ? 'Start focus' : 'Resume'}
                    </button>
                    <button className="ce-ghost-btn" type="button" onClick={handleReset}>
                        Reset
                    </button>
                </div>

                <div className="ce-timer-config">
                    <div className="ce-config-group">
                        <label htmlFor="ce-focus-min">Focus (min)</label>
                        <input
                            id="ce-focus-min"
                            type="number"
                            min={1}
                            value={Math.round(config.focusDurationMs / 60000)}
                            onChange={(e) =>
                                dispatch({
                                    type: 'SET_CONFIG',
                                    payload: { focusDurationMs: Number(e.target.value) * 60000 }
                                })
                            }
                        />
                    </div>
                    <div className="ce-config-group">
                        <label htmlFor="ce-short-min">Short break (min)</label>
                        <input
                            id="ce-short-min"
                            type="number"
                            min={1}
                            value={Math.round(config.shortBreakDurationMs / 60000)}
                            onChange={(e) =>
                                dispatch({
                                    type: 'SET_CONFIG',
                                    payload: { shortBreakDurationMs: Number(e.target.value) * 60000 }
                                })
                            }
                        />
                    </div>
                    <div className="ce-config-group">
                        <label htmlFor="ce-long-min">Long break (min)</label>
                        <input
                            id="ce-long-min"
                            type="number"
                            min={1}
                            value={Math.round(config.longBreakDurationMs / 60000)}
                            onChange={(e) =>
                                dispatch({
                                    type: 'SET_CONFIG',
                                    payload: { longBreakDurationMs: Number(e.target.value) * 60000 }
                                })
                            }
                        />
                    </div>
                    <div className="ce-config-group">
                        <label htmlFor="ce-long-every">Sessions per long break</label>
                        <input
                            id="ce-long-every"
                            type="number"
                            min={2}
                            max={8}
                            value={config.longBreakEvery}
                            onChange={(e) =>
                                dispatch({
                                    type: 'SET_CONFIG',
                                    payload: { longBreakEvery: Number(e.target.value) || 4 }
                                })
                            }
                        />
                    </div>
                    <div className="ce-config-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.autoStartBreaks}
                                onChange={(e) =>
                                    dispatch({
                                        type: 'SET_CONFIG',
                                        payload: { autoStartBreaks: e.target.checked }
                                    })
                                }
                            />
                            Auto-start breaks
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={config.autoStartNextSession}
                                onChange={(e) =>
                                    dispatch({
                                        type: 'SET_CONFIG',
                                        payload: { autoStartNextSession: e.target.checked }
                                    })
                                }
                            />
                            Auto-start next focus
                        </label>
                    </div>
                </div>

                <div className="ce-sound-row">
                    <label className="ce-sound-label">
                        <input
                            type="checkbox"
                            checked={config.soundEnabled}
                            onChange={(e) =>
                                dispatch({
                                    type: 'SET_CONFIG',
                                    payload: { soundEnabled: e.target.checked }
                                })
                            }
                        />
                        Soft bell at session end
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={config.soundVolume}
                        onChange={(e) =>
                            dispatch({
                                type: 'SET_CONFIG',
                                payload: { soundVolume: Number(e.target.value) }
                            })
                        }
                    />
                </div>
            </div>

            <div className="ce-active-task-strip">
                {activeTask ? (
                    <>
                        <div className="ce-active-task-title">
                            Linked to: <span>{activeTask.title}</span>
                        </div>
                        <div className="ce-active-task-progress">
                            <div className="ce-active-task-ring">
                                <div
                                    className="ce-active-task-ring-inner"
                                    style={{
                                        background: `conic-gradient(#22c55e ${
                                            ((activeTask.completedPomodoros || 0) /
                                                Math.max(1, activeTask.estimatedPomodoros || 1)) *
                                            360
                                        }deg, rgba(15,23,42,1) 0deg)`
                                    }}
                                />
                            </div>
                            <span>
                                {activeTask.completedPomodoros} /{' '}
                                {activeTask.estimatedPomodoros || '∞'} pomodoros
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="ce-active-task-empty">
                        No active task. Timer runs in generic mode.
                    </div>
                )}
            </div>

            {/* Provide your own bell asset at /sounds/chronex-focus-bell.mp3 */}
            <audio
                ref={audioRef}
                src="/sounds/chronex-focus-bell.mp3"
                preload="auto"
            />
        </div>
    );
};

export default PomodoroEngine;

