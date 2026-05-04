const { Server } = require('socket.io');
const logger = require('../utils/logger');

class SocketService {
    constructor() {
        this.io = null;
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    // Allow local and production origins (same as Express CORS)
                    callback(null, true);
                },
                credentials: true
            }
        });

        this.io.on('connection', (socket) => {
            logger.info(`[SOCKET] User connected: ${socket.id}`);

            socket.on('join-meeting', (meetingId) => {
                socket.join(`meeting:${meetingId}`);
                logger.info(`[SOCKET] ${socket.id} joined meeting:${meetingId}`);
            });

            socket.on('join-org', (orgId) => {
                socket.join(`org:${orgId}`);
                logger.info(`[SOCKET] ${socket.id} joined org:${orgId}`);
            });

            socket.on('disconnect', () => {
                logger.info(`[SOCKET] User disconnected: ${socket.id}`);
            });
        });

        return this.io;
    }

    emitToMeeting(meetingId, event, data) {
        if (!this.io) return;
        this.io.to(`meeting:${meetingId}`).emit(event, data);
        logger.info(`[SOCKET] Emitted ${event} to meeting:${meetingId}`);
    }

    emitToOrg(orgId, event, data) {
        if (!this.io) return;
        this.io.to(`org:${orgId}`).emit(event, data);
        logger.info(`[SOCKET] Emitted ${event} to org:${orgId}`);
    }
}

module.exports = new SocketService();
