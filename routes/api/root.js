const router = require('express').Router();
const logger = require('../../logger');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const wrapAsync = (fn) => function (req, res, next) {
  fn(req, res, next).catch(next);
};
const addDashDate = (date) => date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);


router.get('/', function (req, res) {
  logger.debug(`GET request entry to the path: '${req.originalUrl}'`);

  res.send("Welcome to KNBank Scraping Server: " + process.env.NODE_ENV);
});

router.post('/enote/fetch', wrapAsync(async function (req, res) {
  logger.debug(`POST request entry to the path: '${req.originalUrl}'`);

  // Retrieve the POST data
  const parsedBody = req.body;


  // Check validity of the POST data

  // 1. check property name
  if (!parsedBody.startDate || !parsedBody.endDate) {
    return res.json({ error: `startDate or endDate property is missing` });
  }
  // 2. check datatype of startDate, endDate
  if (typeof parsedBody.startDate !== 'string' || typeof parsedBody.endDate !== 'string') {
    return res.json({ error: `Datatype of startDate, endDate must be string` });
  }
  const startDate = parsedBody.startDate.replace(/\D/g, '');  // remove non-digit characters
  const endDate = parsedBody.endDate.replace(/\D/g, '');  // remove non-digit characters
  // 3. check string's length
  if (startDate.length !== 8 || endDate.length !== 8) {
    return res.json({ error: `Datatype of startDate, endDate must be 8 digit values` });
  }
  const startDateObj = new Date(addDashDate(startDate));
  const endDateObj = new Date(addDashDate(endDate));
  // 4. check if date is valid
  if (startDateObj.toString() === 'Invalid Date' || endDateObj.toString() === 'Invalid Date') {
    return res.json({ error: `startDate, endDate must be in the format of YYYYMMDD` });
  }
  // 5. check if startDate comes later than endDate
  if (startDateObj > endDateObj) {
    return res.json({ error: `startDate must be less than or equal to endDate` });
  }
  // 6. check datatype of billNo, divNo
  if (parsedBody.billNo && parsedBody.divNo && (typeof parsedBody.billNo !== 'string' || typeof parsedBody.divNo !== 'number')) {
    return res.json({ error: `Datatype of billNo, divNo must be string, number` });
  }


  // use lockfile to process the request synchronously
  const lockFile = require('lockfile');
  const lockFilePath = require('path').join(__dirname, 'lockfile.dat');

  while (true) {
    try {
      // acquire lock
      lockFile.lockSync(lockFilePath);

      // if successful, proceed
      break;
    } catch (e) {
      // wait for lock
      await sleep(1000);
      console.log('waiting for the lock to be released');
    }
  }

  // run code
  const scrape = require('../../scrape');
  const result = await scrape(parsedBody);

  // release lock
  lockFile.unlockSync(lockFilePath);

  res.json(result);
}));

module.exports = router;
