import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect via the proxy (same origin)
        console.log('[SOCKET] Attempting connection to:', window.location.origin);
        const newSocket = io(window.location.origin, {
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
