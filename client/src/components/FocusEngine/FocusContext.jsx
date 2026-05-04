import React from 'react';
import { useFocusStore } from '../../store/useStore';

/**
 * LEGACY BRIDGE: Bridges the legacy FocusContext/useFocusContext to the new Zustand useFocusStore.
 * This ensures that components still using the old hook/provider pattern don't crash.
 */

export const FocusProvider = ({ children }) => {
    return <>{children}</>;
};

export const useFocusContext = () => {
    const store = useFocusStore();
    
    // Bridge state and a shim for the legacy dispatch
    return {
        state: {
            timer: store.timer,
            config: store.config,
            tasks: store.tasks,
            stats: store.stats,
            ui: store.ui
        },
        // Shim dispatch to call store actions where possible
        dispatch: (action) => {
            console.warn(`Legacy dispatch called: ${action.type}. Please migrate to direct store actions.`);
            switch (action.type) {
                case 'TIMER_START': store.startTimer(action.payload?.mode); break;
                case 'TIMER_PAUSE': store.pauseTimer(); break;
                case 'TIMER_RESET': store.resetTimer(); break;
                case 'SET_ACTIVE_TASK': store.setActiveTask(action.payload.taskId); break;
                case 'SET_CONFIG': store.setConfig(action.payload); break;
                case 'ADD_TASK': store.addTask(action.payload); break;
                case 'UPDATE_TASK': store.updateTask(action.payload.id, action.payload.updates); break;
                case 'DELETE_TASK': store.deleteTask(action.payload.id); break;
                case 'DISMISS_OFF_HOURS_WARNING': store.dismissWarning(); break;
                default: 
                    console.error(`Unhandled legacy action: ${action.type}`);
            }
        }
    };
};

// Utils that were exported from FocusContext
export const isOffHoursNow = () => {
    const d = new Date();
    const hour = d.getHours();
    return hour < 6 || hour >= 22;
};

// export useRafNow shim if needed, but it's better if components use their own or the store's logic
export const useRafNow = () => {
    const [now, setNow] = React.useState(() => Date.now());
    React.useEffect(() => {
        let handle;
        const loop = () => {
            setNow(Date.now());
            handle = requestAnimationFrame(loop);
        };
        handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    }, []);
    return now;
};

const FocusContext = {
    Provider: FocusProvider
};

export default FocusContext;
