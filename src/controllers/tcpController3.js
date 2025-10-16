const TcpClientService = require('../services/tcpService1');
//const Pusher = require('pusher');


// Store connections and data for each dynamic host
let connections = {};

const startClient = (req, res) => {
    const { host } = req.query;
    console.log("Socket host 3", host)

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
    // Send data to Pusher
    //req.pusher.trigger('my-client', 'my-event', {
    //    host: host,
    //    weight: 10
    //});

    try {
        tcpClientService.startClient((data) => {
            parsedData = data;
            connections[host] = { tcpClientService, parsedData };
            console.log(`Received data for host ${host}:`, parsedData);

            // Send data to Pusher
            req.pusher.trigger('my-client', 'my-event', {
                host: host,
                weight: parsedData
            });
        });

        res.status(200).json({ message: `TCP client started for ${host}:${port}.` });
    } catch (error) {
        console.error(`Error starting TCP client for ${host}:${port}: ${error.message}`);
        if (!res.headersSent) {
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
        connections[host].tcpClientService.stopClient();
        delete connections[host];
        return res.status(200).json({ message: `TCP client stopped for ${host}.` });
    } catch (error) {
        console.error(`Error stopping TCP client for ${host}: ${error.message}`);
        return res.status(500).json({ message: 'Failed to stop TCP client.', error: error.message });
    }
};

module.exports = { startClient, stopClient };
