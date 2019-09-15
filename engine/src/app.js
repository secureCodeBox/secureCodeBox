const express = require('express');

const app = express();

app.use(express.json());

app.use(require('./scan-job/scan-job'));

module.exports = app;
