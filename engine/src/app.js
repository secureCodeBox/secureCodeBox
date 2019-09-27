const express = require('express');

const app = express();

app.use(express.json({
	limit: '10mb'
}));

app.use(require('./scan-job/scan-job'));

module.exports = app;
