const socket = io('http://localhost:3000');
let connected = false;

socket.emit('set-up', userLoggedIn);
socket.on('connected', () => {
  connected = true;
});
socket.on('message received', (newMessage) => messageReceived(newMessage));
