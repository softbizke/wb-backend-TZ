const net = require('net');

class TcpClientService {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.client = null;
    }

    startClient(onDataCallback) {
        if (this.client) {
            throw new Error('TCP client is already running.');
        }

        console.log("Socket host 11", this.host)
        this.client = new net.Socket();

        // Connect to the server
        this.client.connect(this.port, this.host, () => {
            console.log(`Connected to server at ${this.host}:${this.port}`);
        });

        // need to comment this code out when going to production
        // After connecting, send the START command to the server
        setTimeout(() => {
            this.client.write('START\n');
        }, 1000);

        // Handle incoming data
        this.client.on('data', (data) => {
            //console.log(`Received data: ${data.toString()}`);

            // Updated regex to capture the middle value (second number) after any value following ')'
            const regex = /\)\d+\s+(\d+)\s+0/;
            const match = data.toString().match(regex);

            if (match && match[1]) {
                const middleValue = match[1];
                //console.log(`Extracted middle value: ${middleValue}`);

                // Pass the extracted value to the callback if needed
                if (onDataCallback) {
                    onDataCallback(middleValue);
                }
                return middleValue;
            } else {
                console.log('No match found in the data.');
            }
        });

        // Handle connection closure
        this.client.on('close', () => {
            console.log('Connection closed by the server.');
            this.client = null; // Reset client instance
        });

        // Handle connection errors
        this.client.on('error', (err) => {
            console.error(`TCP client error: ${err.message}`);
            this.client = null; // Reset client instance
        });
    }

    stopClient() {
        if (!this.client) {
            throw new Error('TCP client is not running.');
        }

        this.client.destroy(); // Close the client connection
        console.log('TCP client stopped.');
        this.client = null; // Reset client instance
    }
}

module.exports = TcpClientService;
