const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const fs = require("fs");

let port;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let serial_port = null;

app.get("/Background.mp4", (req, res) => {
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    "media",
    "Background.mp4"
  );
  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "video/mp4",
    "Content-Length": stat.size,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

app.use(express.static(path.join(__dirname, "..", "public"))); // serve index.html

const connect_to_serial = async () => {
  try {
    port = new SerialPort({
      //change com port as needed
      path: "COM3",
      baudRate: 9600,
    });
    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

    port.on("open", () => {
      //change com port as needed
      console.log("Serial Port Opened on COM3 @ 9600");
    });

    port.on("error", (err) => {
      console.error("Serial error:", err.message);
    });

    port.on("close", () => {
      console.log("Serial port closed");
    });

    parser.on("data", (line) => {
      const dataStr = line.toString().trim();

      console.log("Data:", dataStr);

      // Send to browser
      io.emit("serial-data", dataStr);
    });
  } catch (err) {
    console.error("Error connecting to serial port:", err);
  }

  const ports = await SerialPort.list();

  const arduino_port = ports.find((port) =>
    port.friendlyName.includes("USB Serial Device")
  );

  if (!arduino_port) {
    console.error("Arduino not found!");
    return;
  }

  console.log(arduino_port);

  // serial_port = new SerialPort({
  //   path: "COM4",
  //   baudRate: 9600,
  // });

  // serial_port.open((err) => {
  //   console.log(err);
  // });

  //problem area??
  // serial_port.on("data", function (data) {
  //   console.log("Data:", data);
  // });

  //serial_port.on('readable', (data) => {
  //    data = data.toString().trim();
  //
  //    console.log('DATA:', data);
  //
  //    // Send to browser
  //    io.emit('serial-data', data);
  //});
};

const startServer = () => {
  // IMPORTANT: start the HTTP server, not app.listen
  server.listen(3000, () => {
    console.log("Server + Socket.IO listening on http://localhost:3000");
  });

  io.on("connection", (socket) => {
    console.log("Web client connected:", socket.id);
    socket.on("disconnect", () =>
      console.log("Web client disconnected:", socket.id)
    );
  });
};

const main = async () => {
  await connect_to_serial();
  startServer();
};

process.on("SIGINT", () => {
  console.log("\nShutting down…");
  if (port && port.isOpen) port.close(() => process.exit(0));
  else process.exit(0);
});

main();
