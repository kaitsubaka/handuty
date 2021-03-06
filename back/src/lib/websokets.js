import {Server} from 'socket.io';
/**
 * Starts web socket communication.
 *
 * @param {any} server Main Http server.
 */
export function initServerWS(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
    },
  });

  console.log('WS conection success');

  const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
      users.push({userId, socketId});
  };

  const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
  };

  const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
  };

  io.on('connection', (socket) => {
    // when ceonnect
    console.log('a user connected.');

    // take userId and socketId from user
    socket.on('addUser', (userId) => {
      addUser(userId, socket.id);
      io.emit('getUsers', users);
    });

    // send and get message
    socket.on('sendMessage', ({senderId, receiverId, text}) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit('getMessage', {
          senderId,
          text,
        });
      }
    });

    // when disconnect
    socket.on('disconnect', () => {
      console.log('a user disconnected!');
      removeUser(socket.id);
      io.emit('getUsers', users);
    });
  });
}
