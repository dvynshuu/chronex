import React from 'react';
import { motion } from 'framer-motion';
import FocusEngineShell from '../components/FocusEngine/FocusEngineShell';

const FocusWorkspace = () => {
    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <FocusEngineShell />
        </motion.div>
    );
};

export default FocusWorkspace;

