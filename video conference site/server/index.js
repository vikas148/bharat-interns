const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
const userVideoStateMap = new Map();
io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  
  socket.on("user:video:toggle", (isEnabled) => {
    const userEmail = socketidToEmailMap.get(socket.id);
    userVideoStateMap.set(userEmail, isEnabled);
    socket.broadcast.emit("user:video:toggle", { userEmail, isEnabled });
  });


  socket.on("room:join", ({ email, room }) => {
    const videoState = userVideoStateMap.get(email) || true; // Default to true
    socket.broadcast.to(room).emit("user:video:toggle", { userEmail: email, isEnabled: videoState });
    // ... Other room join logic ...
  });

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("join:accept", ({ roomNumber, userEmail }) => {
    socket.join(roomNumber);
    // You can emit events or perform other actions here upon accepting the join request
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("send:message", ({ roomNumber, message }) => {
    // Broadcast the message to all users in the room
    io.to(roomNumber).emit("receive:message", message);
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
