const net = require('net');
const EventEmitter = require('events');

class TcpClientService extends EventEmitter {
    constructor(host, port) {
        super();
        this.host = host;
        this.port = port;
        this.client = null;
    }

    startClient() {
        this.client = new net.Socket();
    console.log("Socket host 22", this.host)

        this.client.connect(this.port, this.host, () => {
            console.log(`Connected to ${this.host}:${this.port}`);
        });

        this.client.on('data', (data) => {
            console.log(`Received data: ${data.toString()}`);
            // Emit the data received event
            this.emit('dataReceived', data.toString());
        });

        this.client.on('error', (err) => {
            console.error('Error:', err.message);
        });

        this.client.on('close', () => {
            console.log('Connection closed');
        });
    }

    stopClient() {
        if (this.client) {
            this.client.destroy();
            console.log('TCP client stopped');
        }
    }
}

module.exports = TcpClientService;
