import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️'
    };

    return (
        <motion.div
            className={`premium-toast premium-toast--${type}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.02 }}
        >
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </motion.div>
    );
};

export default Toast;
