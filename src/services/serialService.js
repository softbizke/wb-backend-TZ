const net = require('net');
const ping = require('ping');

/**
 * Check if the IP is reachable using ICMP (ping).
 *
 * @param {string} ip - The IP address to check.
 * @returns {Promise<boolean>} - Resolves with true if reachable, false otherwise.
 */
async function isIpReachable(ip) {
    return new Promise((resolve, reject) => {
        ping.sys.probe(ip, function(isAlive) {
            if (isAlive) {
                resolve(true);
            } else {
                reject('IP is not reachable');
            }
        });
    });
}

/**
 * Check if the port is open by attempting to connect to the IP and port.
 *
 * @param {string} ip - The IP address to check.
 * @param {number} port - The port number to check.
 * @returns {Promise<boolean>} - Resolves with true if the port is open, false otherwise.
 */
async function isPortOpen(ip, port) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(2000); // Set timeout to 2 seconds

        socket.on('connect', () => {
            resolve(true);
            socket.end(); // Close the socket after successful connection
        });

        socket.on('timeout', () => {
            reject('Port check timed out');
        });

        socket.on('error', (err) => {
            reject(`Error connecting to port: ${err.message}`);
        });

        socket.connect(port, ip);
    });
}

/**
 * Sends a command directly to a serial-to-Ethernet converter and logs the response.
 *
 * @param {string} ip - The IP address of the serial-to-Ethernet converter.
 * @param {number} port - The port number of the converter.
 * @param {string} command - The command to send.
 * @param {string} terminator - Optional terminator for the command (e.g., "\r\n").
 * @returns {Promise<string>} - The response from the converter.
 */
async function sendReadCommand(ip, port, command, terminator = '\r\n') {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        // Connect to the weighbridge
        client.connect(port, ip, () => {
            console.log(`Connected to ${ip}:${port}`);
            const fullCommand = command + terminator; // Append terminator
            client.write(fullCommand, 'utf-8', () => {
                console.log(`Command sent: "${fullCommand}"`);
            });
        });

        let responseData = ''; // Accumulate response data

        // Collect data chunks
        client.on('data', (data) => {
            responseData += data.toString(); // Accumulate data as a string
            console.log('Data received:', data.toString());
            client.end(); // Close the connection immediately once any of the strings is found
        });

        // Handle connection close
        client.on('close', () => {
            console.log('Connection closed');
            if (responseData.trim() === '') {
                reject('No response data received.');
            } else {
                resolve(responseData.trim());
            }
        });

        // Handle errors
        client.on('error', (error) => {
            console.error('Error:', error.message);
            reject(error.message);
        });
    });
}


module.exports = {
    sendReadCommand
  };