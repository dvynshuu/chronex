import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';

// Timer + tasks + stats state, all managed via useReducer and persisted to localStorage.

const STORAGE_KEY = 'chronex_focus_engine_v1';

const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const emptyDay = () => ({ focusMinutes: 0, sessionsCompleted: 0 });

const defaultConfig = {
    focusDurationMs: 25 * 60 * 1000,
    shortBreakDurationMs: 5 * 60 * 1000,
    longBreakDurationMs: 15 * 60 * 1000,
    longBreakEvery: 4,
    autoStartNextSession: false,
    autoStartBreaks: true,
    soundEnabled: true,
    soundVolume: 0.4
};

const defaultStats = {
    currentDay: todayKey(),
    today: emptyDay(),
    streak: 0,
    history: {}
};

const initialState = {
    timer: {
        mode: 'idle', // 'focus' | 'shortBreak' | 'longBreak'
        isRunning: false,
        sessionCount: 0,
        phaseStartTimestamp: null,
        phaseEndTimestamp: null,
        lastKnownRemainingMs: defaultConfig.focusDurationMs,
        activeTaskId: null
    },
    config: defaultConfig,
    tasks: [],
    stats: defaultStats,
    ui: {
        showOffHoursWarning: false,
        isInFocusVisual: false
    }
};

const FocusContext = createContext(null);

const ensureStatsForToday = (stats) => {
    const today = todayKey();
    if (!stats || stats.currentDay === today) return stats || defaultStats;

    const prevDay = stats.currentDay;
    const yesterday = (() => {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    })();

    const newHistory = { ...(stats.history || {}), [prevDay]: stats.today || emptyDay() };
    const hadPrev = (newHistory[prevDay]?.sessionsCompleted) || 0;
    const hadYesterday = (newHistory[yesterday]?.sessionsCompleted) || 0;

    const newStreak = hadPrev > 0 ? (hadYesterday > 0 ? (stats.streak || 0) + 1 : 1) : (stats.streak || 0);

    return {
        currentDay: today,
        today: emptyDay(),
        streak: newStreak,
        history: newHistory
    };
};

const getPhaseDuration = (state, mode) => {
    if (mode === 'focus' || mode === 'idle') return state.config.focusDurationMs;
    if (mode === 'shortBreak') return state.config.shortBreakDurationMs;
    if (mode === 'longBreak') return state.config.longBreakDurationMs;
    return state.config.focusDurationMs;
};

function reducer(state, action) {
    switch (action.type) {
        case 'LOAD_STATE':
            return action.payload;
        case 'SET_CONFIG':
            return {
                ...state,
                config: { ...state.config, ...action.payload }
            };
        case 'TIMER_START': {
            const now = action.payload.now;
            const requestedMode = action.payload.mode;
            const nextMode =
                requestedMode && requestedMode !== 'idle'
                    ? requestedMode
                    : state.timer.mode === 'idle'
                    ? 'focus'
                    : state.timer.mode;

            const durationMs = getPhaseDuration(state, nextMode);
            const startTs = now;
            const endTs = startTs + durationMs;

            return {
                ...state,
                timer: {
                    ...state.timer,
                    mode: nextMode,
                    isRunning: true,
                    phaseStartTimestamp: startTs,
                    phaseEndTimestamp: endTs,
                    lastKnownRemainingMs: durationMs
                },
                ui: {
                    ...state.ui,
                    isInFocusVisual: nextMode === 'focus'
                }
            };
        }
        case 'TIMER_TICK': {
            if (!state.timer.phaseEndTimestamp || !state.timer.isRunning) return state;
            const now = action.payload.now;
            const remaining = Math.max(0, state.timer.phaseEndTimestamp - now);
            return {
                ...state,
                timer: {
                    ...state.timer,
                    lastKnownRemainingMs: remaining
                }
            };
        }
        case 'TIMER_PAUSE': {
            if (!state.timer.isRunning || !state.timer.phaseEndTimestamp || !state.timer.phaseStartTimestamp) {
                return state;
            }
            const now = action.payload.now;
            const remaining = Math.max(0, state.timer.phaseEndTimestamp - now);
            return {
                ...state,
                timer: {
                    ...state.timer,
                    isRunning: false,
                    phaseStartTimestamp: null,
                    phaseEndTimestamp: null,
                    lastKnownRemainingMs: remaining
                },
                ui: {
                    ...state.ui,
                    isInFocusVisual: false
                }
            };
        }
        case 'TIMER_RESET': {
            return {
                ...state,
                timer: {
                    ...state.timer,
                    mode: 'idle',
                    isRunning: false,
                    phaseStartTimestamp: null,
                    phaseEndTimestamp: null,
                    sessionCount: 0,
                    lastKnownRemainingMs: state.config.focusDurationMs
                },
                ui: {
                    ...state.ui,
                    isInFocusVisual: false
                }
            };
        }
        case 'TIMER_COMPLETE_PHASE': {
            if (!state.timer.phaseStartTimestamp || !state.timer.phaseEndTimestamp) return state;

            const now = action.payload.now;
            let nextState = {
                ...state,
                timer: {
                    ...state.timer,
                    isRunning: false,
                    phaseStartTimestamp: null,
                    phaseEndTimestamp: null
                }
            };

            const currentMode = state.timer.mode;

            // Stats + task linkage when a focus phase completes
            if (currentMode === 'focus') {
                const durationMs = state.timer.phaseEndTimestamp - state.timer.phaseStartTimestamp;
                const minutes = Math.round(durationMs / 60000);
                const reconciledStats = ensureStatsForToday(nextState.stats);

                const newToday = {
                    focusMinutes: reconciledStats.today.focusMinutes + minutes,
                    sessionsCompleted: reconciledStats.today.sessionsCompleted + 1
                };

                const newStats = {
                    ...reconciledStats,
                    today: newToday
                };

                nextState = {
                    ...nextState,
                    stats: newStats
                };

                if (state.timer.activeTaskId) {
                    nextState = {
                        ...nextState,
                        tasks: nextState.tasks.map((t) =>
                            t.id === state.timer.activeTaskId
                                ? {
                                      ...t,
                                      completedPomodoros: (t.completedPomodoros || 0) + 1
                                  }
                                : t
                        )
                    };
                }

                nextState.timer.sessionCount = state.timer.sessionCount + 1;
            }

            // Phase transitions
            let nextMode = 'idle';
            if (currentMode === 'focus') {
                if (state.timer.sessionCount + 1 >= state.config.longBreakEvery) {
                    nextMode = 'longBreak';
                    nextState.timer.sessionCount = 0;
                } else {
                    nextMode = 'shortBreak';
                }
            } else if (currentMode === 'shortBreak' || currentMode === 'longBreak') {
                nextMode = 'focus';
            }

            const autoStart =
                (currentMode === 'focus' && state.config.autoStartBreaks) ||
                ((currentMode === 'shortBreak' || currentMode === 'longBreak') &&
                    state.config.autoStartNextSession);

            if (autoStart && nextMode !== 'idle') {
                const durationMs = getPhaseDuration(nextState, nextMode);
                const startTs = now;
                const endTs = startTs + durationMs;
                nextState = {
                    ...nextState,
                    timer: {
                        ...nextState.timer,
                        mode: nextMode,
                        isRunning: true,
                        phaseStartTimestamp: startTs,
                        phaseEndTimestamp: endTs,
                        lastKnownRemainingMs: durationMs
                    },
                    ui: {
                        ...nextState.ui,
                        isInFocusVisual: nextMode === 'focus'
                    }
                };
            } else {
                nextState = {
                    ...nextState,
                    timer: {
                        ...nextState.timer,
                        mode: nextMode,
                        isRunning: false,
                        phaseStartTimestamp: null,
                        phaseEndTimestamp: null,
                        lastKnownRemainingMs: getPhaseDuration(nextState, nextMode || 'focus')
                    },
                    ui: {
                        ...nextState.ui,
                        isInFocusVisual: false
                    }
                };
            }

            return nextState;
        }
        case 'SET_ACTIVE_TASK':
            return {
                ...state,
                timer: {
                    ...state.timer,
                    activeTaskId: action.payload.taskId
                }
            };
        case 'ADD_TASK':
            return {
                ...state,
                tasks: [...state.tasks, action.payload]
            };
        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map((t) =>
                    t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
                )
            };
        case 'DELETE_TASK': {
            const tasks = state.tasks.filter((t) => t.id !== action.payload.id);
            const activeTaskId =
                state.timer.activeTaskId === action.payload.id ? null : state.timer.activeTaskId;
            return {
                ...state,
                tasks,
                timer: {
                    ...state.timer,
                    activeTaskId
                }
            };
        }
        case 'REORDER_TASKS': {
            const { sourceIndex, destIndex } = action.payload;
            if (
                sourceIndex === destIndex ||
                sourceIndex < 0 ||
                destIndex < 0 ||
                sourceIndex >= state.tasks.length ||
                destIndex >= state.tasks.length
            ) {
                return state;
            }
            const tasks = [...state.tasks];
            const [moved] = tasks.splice(sourceIndex, 1);
            tasks.splice(destIndex, 0, moved);
            return { ...state, tasks };
        }
        case 'DISMISS_OFF_HOURS_WARNING':
            return {
                ...state,
                ui: { ...state.ui, showOffHoursWarning: false }
            };
        default:
            return state;
    }
}

export const FocusProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const isHydratedRef = useRef(false);

    // Initial load from localStorage
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                isHydratedRef.current = true;
                return;
            }
            const parsed = JSON.parse(raw);
            const reconciledStats = ensureStatsForToday(parsed.stats || defaultStats);
            const now = Date.now();
            let timer = parsed.timer || initialState.timer;

            if (timer.phaseEndTimestamp && timer.phaseStartTimestamp) {
                if (now >= timer.phaseEndTimestamp) {
                    // phase already complete, keep mode but reset timing
                    timer = {
                        ...timer,
                        isRunning: false,
                        phaseStartTimestamp: null,
                        phaseEndTimestamp: null,
                        lastKnownRemainingMs: getPhaseDuration(
                            { ...parsed, stats: reconciledStats },
                            timer.mode
                        )
                    };
                } else {
                    const remaining = Math.max(0, timer.phaseEndTimestamp - now);
                    timer = {
                        ...timer,
                        lastKnownRemainingMs: remaining
                    };
                }
            }

            dispatch({
                type: 'LOAD_STATE',
                payload: {
                    ...initialState,
                    ...parsed,
                    stats: reconciledStats,
                    timer
                }
            });
        } catch {
            // ignore
        } finally {
            isHydratedRef.current = true;
        }
    }, []);

    // Persist entire slice to localStorage
    useEffect(() => {
        if (!isHydratedRef.current) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore
        }
    }, [state]);

    return <FocusContext.Provider value={{ state, dispatch }}>{children}</FocusContext.Provider>;
};

export const useFocusContext = () => {
    const ctx = useContext(FocusContext);
    if (!ctx) {
        throw new Error('useFocusContext must be used within FocusProvider');
    }
    return ctx;
};

// requestAnimationFrame-driven "now" value, scoped to timer UI
export const useRafNow = () => {
    const [now, setNow] = React.useState(() => Date.now());
    const frameRef = useRef(null);

    const loop = useCallback(() => {
        setNow(Date.now());
        frameRef.current = window.requestAnimationFrame(loop);
    }, []);

    useEffect(() => {
        frameRef.current = window.requestAnimationFrame(loop);
        return () => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
            }
        };
    }, [loop]);

    return now;
};

export const isOffHoursNow = () => {
    const d = new Date();
    const hour = d.getHours();
    return hour < 6 || hour >= 22;
};

