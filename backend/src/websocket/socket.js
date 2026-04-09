const { Server } = require('socket.io');

let ioInstance;

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.connectedAt = Date.now();
    // allow client to subscribe to a gym room
    socket.on('subscribe', (gymId) => {
      if (socket.currentRoom) socket.leave(socket.currentRoom);
      socket.join(gymId);
      socket.currentRoom = gymId;
    });

    socket.on('unsubscribe', (gymId) => {
      socket.leave(gymId);
      delete socket.currentRoom;
    });

    socket.on('disconnect', () => {
      // noop
    });
  });

  ioInstance = io;
  return io;
}

function emitEvent(event) {
  if (!ioInstance) return;
  // Emit once to all connected clients. Frontend scopes per selected gym.
  try {
    ioInstance.emit('event', event);
  } catch (err) {
    console.error('Failed to emit event', err);
  }
}

module.exports = function(server) {
  const io = setupSocket(server);
  // make sure global room exists for convenience
  io.on('connection', (s) => s.join('global'));
  return io;
};

module.exports.emitEvent = emitEvent;
