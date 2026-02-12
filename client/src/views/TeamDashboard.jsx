import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import './TeamDashboard.css';

const TeamDashboard = () => {
    const teamStats = [
        { name: 'Active', value: 12 },
        { name: 'Away', value: 3 },
        { name: 'Sleeping', value: 5 }
    ];

    const activityData = [
        { day: 'Mon', usage: 40 },
        { day: 'Tue', usage: 30 },
        { day: 'Wed', usage: 60 },
        { day: 'Thu', usage: 80 },
        { day: 'Fri', usage: 50 }
    ];

    const COLORS = ['#4ade80', '#facc15', '#fb7185'];

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
                            <tr>
                                <td>Sarah Chen</td>
                                <td>Singapore</td>
                                <td>22:05</td>
                                <td><span className="status-pill status-pill--sleeping">Sleeping</span></td>
                            </tr>
                            <tr>
                                <td>James Wilson</td>
                                <td>London</td>
                                <td>14:05</td>
                                <td><span className="status-pill status-pill--office">In Office</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamDashboard;
