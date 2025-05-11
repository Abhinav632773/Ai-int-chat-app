import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (id) => {
  socketInstance = socket(`http://localhost:3000/`, {
    auth: {
      token: localStorage.getItem("token"),
    },
    query: {
      id,
    },
  });
  return socketInstance;
};

export const receiveMessage = (eventName, cb) => {
  socketInstance.on(eventName, cb); // FIXED: Changed `.emit` to `.on`
};

export const sendMessage = (eventName, data) => {
  socketInstance.emit(eventName, data);
};
