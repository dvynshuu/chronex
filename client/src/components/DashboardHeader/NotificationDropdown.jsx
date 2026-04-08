import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NotificationDropdown.css';

const mockNotifications = [
    {
        id: 1,
        title: 'High Synchronicity',
        message: 'Global sync index reached 92% across AMER and EMEA.',
        time: '2 mins ago',
        type: 'success',
        read: false
    },
    {
        id: 2,
        title: 'New Node Added',
        message: 'Singapore (APAC) has been added to the tracking row.',
        time: '1 hour ago',
        type: 'info',
        read: false
    },
    {
        id: 3,
        title: 'Latency Alert',
        message: 'Connection to Dubai node experiencing high latency.',
        time: '3 hours ago',
        type: 'warning',
        read: true
    }
];

const NotificationDropdown = ({ isOpen }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="dropdown-panel notification-panel"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        <button className="mark-read-btn">Mark all read</button>
                    </div>
                    
                    <div className="notification-list">
                        {mockNotifications.map(notif => (
                            <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                                <div className={`notification-dot bg-${notif.type}`} />
                                <div className="notification-content">
                                    <h4 className="notification-title">{notif.title}</h4>
                                    <p className="notification-desc">{notif.message}</p>
                                    <span className="notification-time">{notif.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="dropdown-footer">
                        <button className="view-all-btn">View All History</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationDropdown;
