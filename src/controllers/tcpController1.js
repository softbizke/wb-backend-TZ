const TcpClientService = require('../services/tcpService1');

// Store connections and data for each dynamic host
let connections = {};

// Internal function to stop a client for the given host
const stopClientInternal = (host) => {
    if (connections[host]) {
        try {
            connections[host].tcpClientService.stopClient();
            connections[host].parsedData = 0; // Reset the data
            delete connections[host]; // Remove the connection
        } catch (error) {
            console.error(`Error stopping TCP client for ${host}: ${error.message}`);
        }
    }
};

const startClient = (req, res) => {
    const { host } = req.query;
    console.log("Socket host 1", host)
    const port = 4660;

    if (!host || !port) {
        return res.status(400).json({ message: 'Host and port are required.' });
    }

    // Check if a client is already running for this host
    if (connections[host]) {
        return res.status(400).json({ message: `TCP client for ${host}:${port} is already running.` });
    }

    // Initialize the TCP client service for the dynamic host
    const tcpClientService = new TcpClientService(host, port);
    let parsedData = 0;

    try {
        tcpClientService.startClient((data) => {
            parsedData = data;

            // Store the connection and data for this host
            connections[host] = { tcpClientService, parsedData };

            // Send the initial response
            if (!res.headersSent) {
                // Stop the client just before sending the response
                stopClientInternal(host);
                return res.status(200).json({
                    weight: parsedData,
                });
            }
        });
    } catch (error) {
        console.error(`Error starting TCP client for ${host}:${port}: ${error.message}`);
        if (!res.headersSent) {
            // Stop the client before responding to the error
            stopClientInternal(host);
            return res.status(500).json({ message: 'Failed to start TCP client.', error: error.message });
        }
    }
};

const stopClient = (req, res) => {
    const { host } = req.query;

    if (!host || !connections[host]) {
        return res.status(400).json({ message: `No active TCP client for ${host}.` });
    }

    try {
        stopClientInternal(host);
        if (!res.headersSent) {
            return res.status(200).json({ message: `TCP client stopped for ${host}.` });
        }
    } catch (error) {
        console.error(`Error stopping TCP client for ${host}: ${error.message}`);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to stop TCP client.', error: error.message });
        }
    }
};

// Stream parsed data for a specific host to the client using Server-Sent Events (SSE)
const streamParsedData = (req, res) => {
    const { host } = req.query;

    if (!host || !connections[host]) {
        return res.status(400).json({ message: `No active TCP client for ${host}.` });
    }

    const parsedData = connections[host].parsedData;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send the initial data
    res.write(`data: {"weight": ${parsedData}}

`);

    // Store interval ID for cleanup
    const intervalId = setInterval(() => {
        if (connections[host]) {
            const updatedData = connections[host].parsedData;
            res.write(`data: {"weight": ${updatedData}}

`);
        } else {
            // Stop sending data if the connection for the host is no longer active
            clearInterval(intervalId);
            res.end();
        }
    }, 1000); // Adjust the interval as needed

    // Clean up when the client disconnects
    req.on('close', () => {
        console.log(`Client disconnected from streaming for host: ${host}`);
        clearInterval(intervalId);
        res.end();
    });
};

module.exports = { startClient, stopClient, streamParsedData };
