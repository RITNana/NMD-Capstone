const { SerialPort } = require('serialport');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

let serial_port = null;

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'public'))); // serve index.html

const connect_to_serial = async () => {
    const ports = await SerialPort.list();

    const arduino_port = ports
       .find(port => port.friendlyName.includes('USB Serial Device'));

    // const arduino_port = ports
    //     .find(port => port.friendlyName.includes('USB VID'));

    if (!arduino_port) {
        console.error('Arduino not found!');
        return;
    }

    console.log(arduino_port);
    
    serial_port = new SerialPort({ 
        path: arduino_port.path, 
        baudRate: 9600,
        autoOpen: false, 
    });

    serial_port.open((err) => {
        console.log(err);
    })


    //problem area??
    serial_port.on('data', function (data) {
        console.log('Data:', data)
    })

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
    app.listen(3000, () => {
        console.log('Server listening on port 3000');
    });
};

const main = async () => {
    await connect_to_serial();
    startServer();
};

main();

