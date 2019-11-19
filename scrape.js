// async function main() {
//   const start = process.hrtime.bigint();

//   // run code
//   const puppeteer = require('puppeteer');
//   const cheerio = require('cheerio');

//   await scrape();

//   const end = process.hrtime.bigint();
//   let executionTime = Number(end - start) / 1000000000;
//   console.log(`Execution took ${executionTime.toFixed(2)} seconds`);
// }

async function main(scrapeInfo) {
  // scrapeInfo = {
  //   billNo: '02020190529580514702',
  //   divNo: 2,
  //   startDate: '20190530',
  //   endDate: '20190530'
  // };

  const logInPage = 'https://ebank.knbank.co.kr/ib20/mnu/CMMLGI001001001';
  const enotePage = 'https://ebank.knbank.co.kr/ib20/mnu/ECBBES120403001';
  const queryUrl =
    'https://ebank.knbank.co.kr/ib20/act/ECBBES431TRSA11M?ib20_cur_mnu=ECBBES120403001&ib20_cur_wgt=ECBBES431TRSV11M';
  const queryDetailUrl =
    'https://ebank.knbank.co.kr/ib20/wgt/ECBBES431TRSV22M?ib20_cur_mnu=ECBBES120403001';

  const username = process.env.USER;
  const password = process.env.PASSWORD;

  const cheerio = require('cheerio');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    // headless: false,
    // devtools: true
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // // for console.log() to work in page.evaluate(), add the following lines
  // page.on('console', msg => {
  //   for (let i = 0; i < msg.args().length; ++i)
  //     console.log(`${i}: ${msg.args()[i]}`);
  // });

  // await page.setRequestInterception(true);
  // page.on('request', interceptedRequest => {
  //   if (interceptedRequest.method() === 'POST') {
  //     console.log('intercepted request url:');
  //     console.log(interceptedRequest.url());
  //     console.log('intercepted request post data:');
  //     console.log(interceptedRequest.postData());  // body contents
  //   }
  //   interceptedRequest.continue();
  // });

  let result = [];
  let detailedResult;
  let responseArrived = false;
  page.on('response', async function(response) {
    if (response.url() === queryUrl) {
      let bodyText = await response.text();
      bodyText = decodeURIComponent(bodyText); // decode string
      const body = JSON.parse(bodyText);
      if (body._msg_._common_.resCode === '00') {
        // response is ok
        let grid = body._msg_._body_.GRID_REC1;
        result.push(...grid);
      }
      responseArrived = true;
    } else if (response.url() === queryDetailUrl) {
      detailedResult = await response.text();
      responseArrived = true;
    }
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko');
  await page.goto(logInPage);

  await page.evaluate(
    (id, pw) => {
      document.querySelector('#USER_ID').value = id;
      document.querySelector('#CONN_PWNO').value = pw;
      document.querySelector('#doIDLogin').click();
    },
    username,
    password
  );

  await page.waitForNavigation(); // wait for the page to load

  await page.goto(enotePage);

  // await Promise.all([
  //   page.evaluate((fromDate) => {
  //     document.querySelector('#btnSubmit').click();
  //   }, scrapeInfo.startDate),

  //   await page.waitForSelector('#rMateH5__Content83')
  // ]);

  // query data
  await page.evaluate(
    (fromDate, toDate) => {
      document.querySelector('#startDate').value = fromDate;
      document.querySelector('#endDate').value = toDate;
      document.querySelector('#btnSubmit').click(); // 조회
    },
    scrapeInfo.startDate,
    scrapeInfo.endDate
  );

  // wait for query result
  await page.waitForFunction('document.querySelector("#inqTotCnt").innerText.length > 0');
  // reset flag
  responseArrived = false;

  // // get total count
  // const totalCount = await page.$('#inqTotCnt');
  // const text = await page.evaluate(element => element.textContent, totalCount);
  // console.log(text);

  while (true) {
    try {
      const nextButtonSelector = '#contentForm > div > div:nth-child(11) > span.fr > a';
      const nextButton = await page.waitForSelector(nextButtonSelector, { timeout: 3000 });
      await nextButton.click();
    } catch (e) {
      break;
    }

    // wait for query result
    while (!responseArrived) {
      await page.waitFor(500);
    }
    // reset flag
    responseArrived = false;
  }

  let payload = [];
  for (let i = 0; i < result.length; ++i) {
    let item = result[i];
    let obj = {
      billNo: item.ELT_BIL_NO, // 어음번호
      divNo: parseInt(item.EDR_NO.slice(0, 2)), // 분할번호
      endoNo: parseInt(item.EDR_NO.slice(2)), // 배서번호
      billAmt: parseInt(item.ELT_BIL_AM), // 어음금액
      endoAmt: parseInt(item.EDR_AM__C0015), // 배서금액
      status: item.ELT_BIL_PRC_STS, // 처리상태
      issuedDate: item.ELT_BIL_ISU_DT, // 발행일자
      expiryDate: item.ELT_BIL_XPR_DT, // 만기일자
      issuerName: item.ISUPE_NM // 발행인명
    };
    payload.push(obj);
  }
  console.log(payload);
  console.log(payload.length);

  // sort by order of billNo
  payload.sort((a, b) => a.billNo - b.billNo);

  if (typeof scrapeInfo.billNo === 'undefined' || typeof scrapeInfo.divNo === 'undefined') {
    await browser.close();
    return payload;
  }

  // scrape the details of the selected item

  // get the index for the selected item
  let rowNumber;
  for (let i = 0; i < payload.length; ++i) {
    let item = payload[i];
    if (item.billNo === scrapeInfo.billNo && item.divNo === scrapeInfo.divNo) {
      rowNumber = i;
      break;
    }
  }
  if (typeof rowNumber === 'undefined') {
    return { error: 'Cannot find the matching billNo & divNo' };
  }

  // activate the current tab
  await page.bringToFront();

  // go to table
  await page.focus('#btnSubmit');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Home');

  // move down to the target row if necessary
  for (let i = 0; i < rowNumber; ++i) {
    await page.keyboard.press('ArrowDown'); // next row
  }

  // select the element and click the button
  await page.keyboard.press('Space');
  await page.click('#detailView');

  // wait for query result
  while (!responseArrived) {
    await page.waitFor(500);
  }
  // reset flag
  responseArrived = false;

  const parseDetails = require('./parse-details');
  const payloadDetails = parseDetails(detailedResult);
  console.log(payloadDetails);

  await browser.close();
  return payloadDetails;
}

module.exports = main;
