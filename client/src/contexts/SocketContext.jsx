import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the backend server
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[SOCKET] Connected to server');
        });

        newSocket.on('connect_error', (err) => {
            console.error('[SOCKET] Connection error:', err);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const joinMeeting = (meetingId) => {
        if (socket) socket.emit('join-meeting', meetingId);
    };

    const joinOrg = (orgId) => {
        if (socket) socket.emit('join-org', orgId);
    };

    return (
        <SocketContext.Provider value={{ socket, joinMeeting, joinOrg }}>
            {children}
        </SocketContext.Provider>
    );
};
