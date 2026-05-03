const ioHolder = { io: null };

const setIo = (io) => {
  ioHolder.io = io;
};

const getIo = () => {
  if (!ioHolder.io) {
    throw new Error('Socket.io has not been initialized');
  }

  return ioHolder.io;
};

module.exports = { setIo, getIo };
