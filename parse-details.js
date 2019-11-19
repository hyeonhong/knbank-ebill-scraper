function main(html) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const scriptText = $('script').get()[4].children[0].data;
  const param = scriptText.match(/grid1.create\(([^)]+)\)/)[1];
  const jsonString = param.match(/'(.+?)'/)[1];
  const json = JSON.parse(jsonString);

  let maxEndoNo = 0;
  const endoList = json.map((item) => {
    const endoNo = parseInt(item.ELT_BIL_PT_NO) - 1;
    maxEndoNo = maxEndoNo < endoNo ? endoNo : maxEndoNo;
    const obj = {
      endoNo: endoNo,  // 배서 번호
      divNo: parseInt(item.EDR_EDR_NO),  // 분할번호
      endoDate: item.EDR_EDR_DT__C0008,  // 배서일자
      endoAmt: parseInt(item.EDR_EDR_AM__C0015),  // 배서금액
      customerType: item.EDR_CORP_PSN_DIS__C0001,  // 법인: 1, 개인사업자: 2, 개인: 3
      bizNo: item.EDR_PSBZNO__C0013,  // 사업자번호 (주민번호)
      bizName: item.EDR_CORP_NM__C0040,  // 법인명
      bizCeo: item.EDR_NM__C0020,  // 대표자명
      bankCode: item.EDR_BK_CD__C0003,  // 은행 코드
      bankName: item.EDR_BK_CD_NM,  // 은행 이름
      bankAcct: item.EDR_RCV_ACT_NO__C0016,  // 은행 계좌번호
      address: item.EDR_AD__C0060,  // 주소
    };
    return obj;
  });

  // update the last item's endoNo
  endoList.forEach((obj) => {
    if (obj.endoNo < 0) {
      obj.endoNo = maxEndoNo + 1;
    }
  });

  const recipient = $('#contentForm > div > div.bill-wrap > div > div.info > span.name').text();
  const billNoText = $('#contentForm > div > div.bill-wrap > div > div.info > span.num').text();
  const endoAmtFmt = $('#contentForm > div > div.bill-wrap > div > div.info > strong.money > span').text();
  const issuer = $('#contentForm > div > div.bill-wrap > div > div.info2 > div.issue-info > dl > dd:nth-child(8)').text();
  const endoNoText = $('#contentForm > div > div.table-type2 > table > tbody > tr:nth-child(1) > td:nth-child(2)').text();
  const divNoText = $('#contentForm > div > div.table-type2 > table > tbody > tr:nth-child(2) > td:nth-child(2)').text();
  const issuedDateText = $('#contentForm > div > div.bill-wrap > div > div.info2 > div.issue-info > dl > dd:nth-child(2)').text();
  const expiryDateText = $('#contentForm > div > div.bill-wrap > div > div.info2 > div.give-info > dl > dd:nth-child(2)').text();
  // 어음 상태
  const status = $('#contentForm > div > div.bill-wrap > div > div.info > strong.state-02').text();
  // 지급 은행
  const issuedBank = $('#contentForm > div > div.bill-wrap > div > div.info2 > div.give-info > dl > dd:nth-child(6) > strong').text();
  // 발행인 주소 (not a full address)
  const issuerAddress = $('#contentForm > div > div.bill-wrap > div > div.info2 > div.issue-info > dl > dd:nth-child(4)').text();
  // 수취인 사업자번호
  const recBizNo = recipient.match(/(\d{3}-\d{2}-\d{5})|(\d{6}-\d{7})/)[0];
  // 수취인 법인명 (성명)
  const recBizName = recipient.slice(0, recipient.indexOf(recBizNo) - 1).trim();
  // 어음번호
  const billNo = billNoText.slice(4);
  // 배서금액
  const endoAmt = parseInt(endoAmtFmt.replace(/\D/g, ''));
  // 발행인 사업자번호
  const issuerBizNo = issuer.match(/(\d{3}-\d{2}-\d{5})|(\d{6}-\d{7})/)[0];
  // 발행인 법인명
  const issuerBizName = issuer.slice(0, issuer.indexOf(issuerBizNo) - 1).trim();
  // 배서번호
  const endoNo = parseInt(endoNoText);
  // 분할번호
  const divNo = parseInt(divNoText);
  // 발행일
  const issuedDate = issuedDateText.replace(/\D/g, '');  // remove non-digit
  // 만기일
  const expiryDate = expiryDateText.replace(/\D/g, '');  // remove non-digit

  return {
    billNo,
    divNo,
    endoNo,
    endoAmt,
    status,
    issuedDate,
    expiryDate,
    issuerBizNo: issuerBizNo.replace(/\D/g, ''),
    issuerBizName,
    issuerAddress,
    issuedBank,
    recBizNo: recBizNo.replace(/\D/g, ''),
    recBizName,
    endoList
  };
}

module.exports = main;
