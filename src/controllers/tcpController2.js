const TcpClientService = require('../services/tcpService2');
const tcpClientService = new TcpClientService('192.169.0.140', 4660);  // Pass the necessary arguments like host and port

// Start the TCP client and stream data to the frontend using SSE
const startClient = (req, res) => {
    try {
        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Start the TCP client to receive data
        tcpClientService.startClient();

        // Listen for data received from the TCP client
        tcpClientService.on('dataReceived', (data) => {
            // Process the received data (e.g., extract the middle value)
            const processedData = processData(data); // Assuming you have a processData function

            // Send the data to the client in SSE format
            const jsonResponse = JSON.stringify({ message: 'New data received', middleValue: processedData });
            res.write(`data: ${jsonResponse}\n\n`);
        });

        // Handle client disconnection
        req.on('close', () => {
            console.log('Client disconnected.');
            tcpClientService.stopClient();
        });

    } catch (error) {
        console.error(`Error starting TCP client: ${error.message}`);
        res.status(500).json({ message: 'Failed to start TCP client.', error: error.message });
    }
};

// Stop the TCP client
const stopClient = (req, res) => {
    try {
        tcpClientService.stopClient();
        res.status(200).json({ message: 'TCP client stopped successfully.' });
    } catch (error) {
        console.error(`Error stopping TCP client: ${error.message}`);
        res.status(500).json({ message: 'Failed to stop TCP client.', error: error.message });
    }
};



// Helper function to process the data (e.g., extracting the middle value)
const processData = (data) => {
    const regex = /\)\d+\s+(\d+)\s+0/; // Adjust the regex to match the data structure
    const match = data.toString().match(regex);
    if (match && match[1]) {
        return match[1];
    }
    return null;
};


module.exports = { startClient, stopClient };
