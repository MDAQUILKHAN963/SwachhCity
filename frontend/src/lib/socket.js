import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Socket event listeners
export const onNewComplaint = (callback) => {
  if (socket) {
    socket.on('new_complaint', callback);
  }
};

export const onComplaintStatusUpdate = (callback) => {
  if (socket) {
    socket.on('complaint_status_updated', callback);
  }
};

export const onNewAssignment = (callback) => {
  if (socket) {
    socket.on('new_assignment', callback);
  }
};

export const joinUserRoom = (userId) => {
  if (socket) {
    socket.emit('join_user', userId);
  }
};

export const joinWorkerRoom = (workerId) => {
  if (socket) {
    socket.emit('join_worker', workerId);
  }
};

export const joinAdminRoom = () => {
  if (socket) {
    socket.emit('join_admin');
  }
};

export const removeListener = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};
