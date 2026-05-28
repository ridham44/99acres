const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const routes = require('./routes');
app.use('/api', routes);

module.exports = app;