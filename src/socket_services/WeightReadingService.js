const axios = require("axios");
const WebSocket = require("ws");

const WS_URL = process.env.WEIGHT_SOCKET_URL_DEV

class WeightReadingService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      onWeightUpdate: null,
      onError: null,
      onConnectionChange: null,
    };
  }

  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    return this;
  }

  async initTcpClient(weighbridgeAddress) {
    try {
      const response = await axios.get(
        `http://${WS_URL}/startClient`,
        { params: { host: weighbridgeAddress } }
      );

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(response.data.success);
      }

      return response.data;
    } catch (error) {
      console.error("Error initializing TCP client:", error.message);
      if (this.callbacks.onError) {
        this.callbacks.onError("Failed to connect to weighbridge");
      }
      return { success: false, message: error.message };
    }
  }

  async startWeightReading(weighbridge) {
    if (!weighbridge?.address) {
      throw new Error("Invalid weighbridge configuration");
    }

    this.socket = new WebSocket(`ws://${WS_URL}`);

    this.socket.on("open", () => {
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }
    });

    this.socket.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.weight !== undefined) {
          const currentWeight = parseInt(data.weight, 10);
          if (this.callbacks.onWeightUpdate) {
            this.callbacks.onWeightUpdate(currentWeight);
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error.message);
      }
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error.message);
      if (this.callbacks.onError) {
        this.callbacks.onError("Error connecting to weighbridge server");
      }
    });

    return true;
  }

  async stopWeightReading(weighbridgeAddress) {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (weighbridgeAddress) {
      try {
        await axios.get(`http://${WS_URL}/stopClient`, {
          params: { host: weighbridgeAddress },
        });
      } catch (error) {
        console.error("Error stopping client:", error.message);
      }
    }

    if (this.callbacks.onConnectionChange) {
      this.callbacks.onConnectionChange(false);
    }
  }
}

module.exports = new WeightReadingService();
