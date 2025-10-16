// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const eventRoutes = require('./routes/eventRoutes');
const manualModeRoutes = require("./routes/manualModeRoutes");

const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.use(cors());

app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });

app.use("/snapshots", express.static(path.join(__dirname, "../public/snapshots")));

app.use('/api', eventRoutes);
app.use("/api/manual-mode", manualModeRoutes);



app.use(errorMiddleware);

module.exports = app;
