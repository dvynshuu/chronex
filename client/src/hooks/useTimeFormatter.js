import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import * as timeUtils from '../utils/timeUtils';

/**
 * Hook that provides time formatting functions pre-configured with the current global format.
 */
export const useTimeFormatter = () => {
    const { timeFormat } = useSettings();

    const fmtHr = useCallback((h) => {
        return timeUtils.fmtHr(h, timeFormat);
    }, [timeFormat]);

    const formatFullTime = useCallback((dt) => {
        return timeUtils.formatFullTime(dt, timeFormat);
    }, [timeFormat]);

    const formatShortTime = useCallback((dt) => {
        return timeUtils.formatShortTime(dt, timeFormat);
    }, [timeFormat]);

    const getLuxonFormat = useCallback((type) => {
        return timeUtils.getLuxonFormat(type, timeFormat);
    }, [timeFormat]);

    return {
        timeFormat,
        fmtHr,
        formatFullTime,
        formatShortTime,
        getLuxonFormat
    };
};

export default useTimeFormatter;
