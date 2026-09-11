const { io } = require("socket.io-client");
const restaurantId = "7f3c2a91-6d84-4e17-9b52-1a6f8c3d2047";

const socket = io("http://localhost:3007/notifications", {
  transports: ["polling", "websocket"],
});

socket.on("connect", () => {
  console.log("CONNECTED");
  console.log("Socket ID:", socket.id);

  socket.emit("join-restaurant", {
    restaurantId,
  });

  console.log(`Joined restaurant:${restaurantId}`);
});

socket.on("notification:new", (notification) => {
  console.log("NEW NOTIFICATION");
  console.log(notification);
});

socket.on("connect_error", (error) => {
  console.error("CONNECT ERROR:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("DISCONNECTED:", reason);
});
