const tcpService = require('../services/tcpService');

const startServer = (req, res) => {
    try {
        tcpService.startTcpServer();
        res.status(200).json({ message: 'TCP server started successfully.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const stopServer = (req, res) => {
    try {
        tcpService.stopTcpServer();
        res.status(200).json({ message: 'TCP server stopped successfully.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    startServer,
    stopServer,
};
