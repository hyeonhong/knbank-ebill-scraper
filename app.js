// Set environment variable
require('dotenv').config();

const express = require('express');
const logger = require('./logger');
const morgan = require('morgan');
// const favicon = require('serve-favicon');

global.rootDir = __dirname;  // Save the root directory

const PORT = process.env.PORT || '3002';


// morgan settings
logger.stream = {
  write: function (message, encoding) {
    logger.info(message.slice(0, -1));
  }
};
let morganFormat = `:method :url :status :res[content-length] Bytes - :response-time ms`;


const app = express()
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(morgan(morganFormat, { stream: logger.stream }))
  // .use(favicon(__dirname + '/favicon.ico'))
  .use(require('./routes'));


app.listen(PORT, () => {
  logger.info('KNBank Scraper App has started');
});
