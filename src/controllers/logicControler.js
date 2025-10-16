const net = require('net');

// Store the parsed data in memory
let parsedData = [];

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
            const lines = data.toString().split('\n');
            lines.forEach((line) => {
                const match = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\]IN.*\)0\s+(480)\s+(\d+)/);
                if (match) {
                    const timestamp = match[1];
                    const value1 = parseInt(match[2], 10);
                    const value2 = parseInt(match[3], 10);

                    // Store parsed data
                    parsedData.push({ timestamp, value1, value2 });
                }
            });

            // Broadcast updated data to all connected clients
            broadcastToClients();
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

// Broadcast data to all connected SSE clients
const broadcastToClients = () => {
    if (typeof global.sseClients !== 'undefined') {
        global.sseClients.forEach(client => {
            if (client.writable) {
                client.write(`data: ${JSON.stringify({ success: true, data: parsedData })}\n\n`);
            }
        });
    }
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

const getParsedData = () => parsedData;

module.exports = {
    startTcpServer,
    stopTcpServer,
    getParsedData,
};
