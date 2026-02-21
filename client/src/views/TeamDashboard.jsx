import useAnimationClock from '../hooks/useAnimationClock';
import { DateTime } from 'luxon';
import './TeamDashboard.css';

const TeamDashboard = () => {
    const liveClock = useAnimationClock(10000); // 10s is enough for team updates
    const [org, setOrg] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const res = await fetch('/api/v1/orgs/me');
                if (!res.ok) throw new Error('Failed to fetch team data');
                const data = await res.json();
                setOrg(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, []);

    const teamStats = React.useMemo(() => {
        if (!org) return [];
        return [
            { name: 'Active', value: org.stats.active },
            { name: 'Away', value: org.stats.away },
            { name: 'Sleeping', value: org.stats.sleeping }
        ];
    }, [org]);

    // Synthetic activity data based on seat count
    const activityData = React.useMemo(() => {
        const total = org?.stats?.total || 3;
        return [
            { day: 'Mon', usage: Math.min(100, (total * 15)) },
            { day: 'Tue', usage: Math.min(100, (total * 12)) },
            { day: 'Wed', usage: Math.min(100, (total * 22)) },
            { day: 'Thu', usage: Math.min(100, (total * 25)) },
            { day: 'Fri', usage: Math.min(100, (total * 18)) }
        ];
    }, [org]);

    const COLORS = ['#4ade80', '#facc15', '#fb7185'];

    if (loading) return <div className="team-dash-loading">Loading Team Insights...</div>;
    if (error) return <div className="team-dash-error">Error: {error}</div>;
    if (!org) return <div className="team-dash-empty">No Organization Found. Create one in Settings to begin.</div>;

    return (
        <motion.div
            className="team-dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="team-dash__title">Team Intelligence</h1>

            <div className="team-dash__grid">
                <div className="team-dash__col">
                    <div className="team-dash__card glass-panel">
                        <h6 className="team-dash__card-label">Global Availability</h6>
                        <div className="team-dash__chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={teamStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {teamStats.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="team-dash__col">
                    <div className="team-dash__card glass-panel">
                        <h6 className="team-dash__card-label">API Usage Analytics</h6>
                        <div className="team-dash__chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <XAxis dataKey="day" hide />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} className="team-dash__tooltip" />
                                    <Bar dataKey="usage" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="team-dash__table-section glass-panel">
                <h5 className="team-dash__section-title">Shared Schedules</h5>
                <div className="team-dash__table-wrapper">
                    <table className="team-dash__table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Primary Location</th>
                                <th>Local Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {org.members.map((m) => {
                                const localTime = liveClock.setZone(m.timezone);
                                const statusClass = m.statusLabel.toLowerCase().replace(' ', '-');

                                return (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td>{m.location}</td>
                                        <td>{localTime.toFormat('hh:mm a')}</td>
                                        <td>
                                            <span className={`status-pill status-pill--${statusClass}`}>
                                                {m.statusLabel}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamDashboard;
