import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- SETTINGS STORE ---
export const useSettingsStore = create()(
    persist(
        (set) => ({
            theme: 'dark',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeFormat: '24H',
            mapProjection: 'equalEarth',
            notifications: true,
            compactMode: false,
            
            setTheme: (theme) => set({ theme }),
            setTimezone: (timezone) => set({ timezone }),
            setTimeFormat: (timeFormat) => set({ timeFormat }),
            setMapProjection: (mapProjection) => set({ mapProjection }),
            setNotifications: (notifications) => set({ notifications }),
            toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
        }),
        { name: 'chronex-settings' }
    )
);

// --- FOCUS STORE ---
const defaultFocusConfig = {
    focusDurationMs: 25 * 60 * 1000,
    shortBreakDurationMs: 5 * 60 * 1000,
    longBreakDurationMs: 15 * 60 * 1000,
    longBreakEvery: 4,
    autoStartNextSession: false,
    autoStartBreaks: true,
    soundEnabled: true,
    soundVolume: 0.4
};

const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useFocusStore = create()(
    persist(
        (set, get) => ({
            timer: {
                mode: 'idle',
                isRunning: false,
                sessionCount: 0,
                phaseStartTimestamp: null,
                phaseEndTimestamp: null,
                lastKnownRemainingMs: defaultFocusConfig.focusDurationMs,
                activeTaskId: null
            },
            config: defaultFocusConfig,
            tasks: [],
            stats: {
                currentDay: todayKey(),
                today: { focusMinutes: 0, sessionsCompleted: 0 },
                streak: 0,
                history: {}
            },
            ui: {
                showOffHoursWarning: false,
                isInFocusVisual: false
            },

            // Actions
            startTimer: (mode = 'focus') => {
                const now = Date.now();
                const config = get().config;
                const duration = mode === 'shortBreak' ? config.shortBreakDurationMs : 
                                mode === 'longBreak' ? config.longBreakDurationMs : 
                                config.focusDurationMs;
                
                set((state) => ({
                    timer: {
                        ...state.timer,
                        mode,
                        isRunning: true,
                        phaseStartTimestamp: now,
                        phaseEndTimestamp: now + duration,
                        lastKnownRemainingMs: duration
                    },
                    ui: { ...state.ui, isInFocusVisual: mode === 'focus' }
                }));
            },

            pauseTimer: () => {
                const now = Date.now();
                const { phaseEndTimestamp, isRunning } = get().timer;
                if (!isRunning || !phaseEndTimestamp) return;

                const remaining = Math.max(0, phaseEndTimestamp - now);
                set((state) => ({
                    timer: {
                        ...state.timer,
                        isRunning: false,
                        phaseStartTimestamp: null,
                        phaseEndTimestamp: null,
                        lastKnownRemainingMs: remaining
                    },
                    ui: { ...state.ui, isInFocusVisual: false }
                }));
            },

            resetTimer: () => set((state) => ({
                timer: {
                    ...state.timer,
                    mode: 'idle',
                    isRunning: false,
                    phaseStartTimestamp: null,
                    phaseEndTimestamp: null,
                    sessionCount: 0,
                    lastKnownRemainingMs: state.config.focusDurationMs
                },
                ui: { ...state.ui, isInFocusVisual: false }
            })),

            completePhase: () => {
                const { mode, phaseStartTimestamp, phaseEndTimestamp, sessionCount, activeTaskId } = get().timer;
                const { config, stats, tasks } = get();
                const now = Date.now();

                let newStats = { ...stats };
                let newTasks = [...tasks];
                let nextSessionCount = sessionCount;

                if (mode === 'focus' && phaseStartTimestamp && phaseEndTimestamp) {
                    const minutes = Math.round((phaseEndTimestamp - phaseStartTimestamp) / 60000);
                    newStats.today.focusMinutes += minutes;
                    newStats.today.sessionsCompleted += 1;
                    nextSessionCount += 1;

                    if (activeTaskId) {
                        newTasks = tasks.map(t => t.id === activeTaskId ? 
                            { ...t, completedPomodoros: (t.completedPomodoros || 0) + 1 } : t
                        );
                    }
                }

                // Determine next mode
                let nextMode = 'idle';
                if (mode === 'focus') {
                    nextMode = nextSessionCount >= config.longBreakEvery ? 'longBreak' : 'shortBreak';
                    if (nextMode === 'longBreak') nextSessionCount = 0;
                } else {
                    nextMode = 'focus';
                }

                const autoStart = (mode === 'focus' && config.autoStartBreaks) || 
                                 (mode !== 'focus' && config.autoStartNextSession);

                if (autoStart) {
                    const duration = nextMode === 'shortBreak' ? config.shortBreakDurationMs : 
                                    nextMode === 'longBreak' ? config.longBreakDurationMs : 
                                    config.focusDurationMs;
                    set({
                        timer: {
                            mode: nextMode,
                            isRunning: true,
                            sessionCount: nextSessionCount,
                            phaseStartTimestamp: now,
                            phaseEndTimestamp: now + duration,
                            lastKnownRemainingMs: duration,
                            activeTaskId
                        },
                        stats: newStats,
                        tasks: newTasks,
                        ui: { ...get().ui, isInFocusVisual: nextMode === 'focus' }
                    });
                } else {
                    set({
                        timer: {
                            mode: nextMode,
                            isRunning: false,
                            sessionCount: nextSessionCount,
                            phaseStartTimestamp: null,
                            phaseEndTimestamp: null,
                            lastKnownRemainingMs: nextMode === 'shortBreak' ? config.shortBreakDurationMs : 
                                                nextMode === 'longBreak' ? config.longBreakDurationMs : 
                                                config.focusDurationMs,
                            activeTaskId
                        },
                        stats: newStats,
                        tasks: newTasks,
                        ui: { ...get().ui, isInFocusVisual: false }
                    });
                }
            },

            addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
            updateTask: (id, updates) => set((state) => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
            })),
            deleteTask: (id) => set((state) => ({
                tasks: state.tasks.filter(t => t.id !== id),
                timer: { ...state.timer, activeTaskId: state.timer.activeTaskId === id ? null : state.timer.activeTaskId }
            })),
            setActiveTask: (taskId) => set((state) => ({ timer: { ...state.timer, activeTaskId: taskId } })),
            reorderTasks: (sourceIndex, destIndex) => set((state) => {
                const tasks = [...state.tasks];
                const [moved] = tasks.splice(sourceIndex, 1);
                tasks.splice(destIndex, 0, moved);
                return { tasks };
            }),
            setConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),
            dismissWarning: () => set((state) => ({ ui: { ...state.ui, showOffHoursWarning: false } }))
        }),
        { name: 'chronex-focus-engine' }
    )
);
