import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for pro-level UX.
 * Ctrl+K → focus command palette (placeholder)
 * T → toggle theme
 * 1/2/3/4 → switch between Dashboard/Meetings/Team/Focus
 */
export const useKeyboardShortcuts = ({ navigate }) => {
    useEffect(() => {
        const handler = (e) => {
            // Don't trigger when typing in inputs
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            // Ctrl+K — command palette (future)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                // Could open a command palette in the future
                console.log('[Chronex] Command Palette triggered');
                return;
            }

            switch (e.key.toLowerCase()) {
                case '1':
                    navigate?.('/');
                    break;
                case '2':
                    navigate?.('/meetings');
                    break;
                case '3':
                    navigate?.('/team');
                    break;
                case '4':
                    navigate?.('/focus');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate]);
};

export default useKeyboardShortcuts;
