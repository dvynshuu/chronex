export const getTimeContext = (localTime) => {
    const hour = localTime.hour;

    if (hour >= 9 && hour < 17) {
        return {
            label: 'Working Hours',
            icon: '🟢',
            range: '9 AM – 5 PM',
            color: 'var(--clr-ok)'
        };
    } else if (hour >= 17 && hour < 21) {
        return {
            label: 'Evening',
            icon: '🟡',
            range: '5 PM – 9 PM',
            color: 'var(--clr-warn)'
        };
    } else if (hour >= 21 || hour < 5) {
        return {
            label: 'Sleeping Time',
            icon: '🔴',
            range: '9 PM – 5 AM',
            color: 'var(--clr-err)'
        };
    } else {
        return {
            label: 'Early Morning',
            icon: '🌅',
            range: '5 AM – 9 AM',
            color: 'var(--p-text)'
        };
    }
};
