const net = require('net');

let tcpServer = null;

const TCP_HOST = '0.0.0.0'; // Listen on all interfaces
const TCP_PORT = 4660;      // Port for TCP server

const startTcpServer = () => {
    if (tcpServer) {
        throw new Error('TCP server is already running.');
    }

    tcpServer = net.createServer((socket) => {
        console.log('Client connected:', socket.remoteAddress, socket.remotePort);

        socket.on('data', (data) => {
            console.log('Received data:', data.toString());
        });

        socket.on('end', () => {
            console.log('Client disconnected:', socket.remoteAddress, socket.remotePort);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err.message);
        });
    });

    tcpServer.listen(TCP_PORT, TCP_HOST, () => {
        console.log(`TCP server is listening on ${TCP_HOST}:${TCP_PORT}`);
    });

    tcpServer.on('error', (err) => {
        console.error('TCP server error:', err.message);
    });
};

const stopTcpServer = () => {
    if (!tcpServer) {
        throw new Error('TCP server is not running.');
    }

    tcpServer.close(() => {
        console.log('TCP server stopped.');
        tcpServer = null;
    });
};

module.exports = {
    startTcpServer,
    stopTcpServer,
};
