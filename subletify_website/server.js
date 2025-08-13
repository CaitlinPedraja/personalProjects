const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");

const furnitureRoutes = require("./src/app/api/furniture");
const apartmentRoutes = require("./src/app/api/apartment");
const messagesRoutes = require("./src/app/api/message");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 5001; 

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressServer = express();
  const httpServer = createServer(expressServer); 
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  expressServer.use(express.json());
  expressServer.use(
    cors({
      origin: "http://localhost:3000",
    })
  );

  expressServer.use("/api/furniture", furnitureRoutes);
  expressServer.use("/api/apartment", apartmentRoutes);
  expressServer.use("/api/message", messagesRoutes);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("message", (messageData) => {
      socket.broadcast.emit("message", messageData);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  expressServer.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Server running on http://${hostname}:${port}`);
  });
});
