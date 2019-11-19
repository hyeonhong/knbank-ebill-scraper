## 사용된 stack 설명

Node.js 의 express + puppeteer 로 만든 script 에 windows service 로 wrapper 를 씌운 프로그램

## 설치전 준비사항

- 경남은행 사이트 (https://ebank.knbank.co.kr/) 에 들어가서 각종 프로그램 (키보드 보안프로그램 등) 미리 설치

- node, yarn 설치 여부 확인후 없으면 설치

- cmd 를 띄울때 반드시 '관리자 권한으로 실행' 한다. (Windows Service 생성시 필요!)

## 설치

```
git clone https://github.com/ninetydays/utilities.git

cd utilities/scrape_knbank_enote

yarn
```

## 환경설정 파일 .env 추가

```
echo 'NODE_ENV=prod' >> .env  # 환경 설정
```

## Windows Service 올리기

```
yarn run create-win-service
```

Win 키 + R => services.msc 입력한 후 

Services 화면에서 KNBank Scraping Server 가 띄워져 있음을 확인한다

## 사용법

HTTP REST API 를 통해 외부에서 호출

- method: POST
- Port: 3002
- Path: /enote/fetch
- Content-type: application/json
- JSON 입력형식 parameter

```
{
    "startDate": "20190607",  # type: string (required)
    "endDate": "20190607",  # type: string (required)
    "billNo": "02020190529580514702",  # type: string (optional)
    "divNo": 2  # type: number (optional)
}
```

## 유의사항

startDate, endDate 의 형식은 YYYYMMDD 이다.

목록보기를 원하면, startDate, endDate 만 지정하면 된다.

상세보기를 원하면, billNo (어음번호), divNo (분할번호) 도 추가로 지정한다.

billNo, divNo 는 값을 모두 지정하거나 아예 생략한다. (둘 중 한개만 지정시, 전부 무시된다)

동기식으로 구현되었으며 이전의 request 가 끝날때까지 기다린후 처리를 시작한다.


## Windows Service 내리기

```
yarn run uninstall-win-service
```

## 응답값 예시

example 1 (목록 보기 - billNo, divNo 없을때):

```
[
    {
        "billNo": "00320190520000027551",
        "divNo": 1,
        "endoNo": 3,
        "billAmt": 100000000,
        "endoAmt": 31579000,
        "status": "정상어음(유통중)",
        "issuedDate": "20190520",
        "expiryDate": "20190820",
        "issuerName": "（주）동해식품"
    },
    {
        "billNo": "00420190328000004236",
        "divNo": 3,
        "endoNo": 2,
        "billAmt": 65000000,
        "endoAmt": 20000000,
        "status": "정상어음(유통중)",
        "issuedDate": "20190328",
        "expiryDate": "20190926",
        "issuerName": "호림약품（주）"
    },
    {
        "billNo": "02020190529580199871",
        "divNo": 0,
        "endoNo": 2,
        "billAmt": 2449113,
        "endoAmt": 2449113,
        "status": "정상어음(유통중)",
        "issuedDate": "20190529",
        "expiryDate": "20190805",
        "issuerName": "（주）대전지오영"
    },
    {
        "billNo": "02020190529580199981",
        "divNo": 0,
        "endoNo": 3,
        "billAmt": 1000000,
        "endoAmt": 1000000,
        "status": "정상어음(유통중)",
        "issuedDate": "20190529",
        "expiryDate": "20190805",
        "issuerName": "（주）대전지오영"
    },
    {
        "billNo": "02020190529580514702",
        "divNo": 1,
        "endoNo": 2,
        "billAmt": 193566026,
        "endoAmt": 93566026,
        "status": "정상어음(유통중)",
        "issuedDate": "20190529",
        "expiryDate": "20190818",
        "issuerName": "（주）서희건설"
    },
    {
        "billNo": "02020190529580514702",
        "divNo": 2,
        "endoNo": 2,
        "billAmt": 193566026,
        "endoAmt": 100000000,
        "status": "정상어음(유통중)",
        "issuedDate": "20190529",
        "expiryDate": "20190818",
        "issuerName": "（주）서희건설"
    }
]
```

example 2 (상세 보기 - billNo, divNo 지정시):

```
{
    "billNo": "02020190529580514702",
    "divNo": 2,
    "endoNo": 2,
    "endoAmt": 100000000,
    "status": "정상어음(유통중)",
    "issuedDate": "20190529",
    "expiryDate": "20190818",
    "issuerBizNo": "2208119330",
    "issuerBizName": "（주）서희건설",
    "issuerAddress": "서울 서초구남부순환로２５８３ １９층（서초동， 서희타워）",
    "issuedBank": " 삼성타운기업영업지원",
    "recBizNo": "1288612434",
    "recBizName": "（주）부전이엔씨",
    "endoList": [
        {
            "endoNo": 1,
            "divNo": 2,
            "endoDate": "20190530",
            "endoAmt": 100000000,
            "customerType": "1",
            "bizNo": "4958700626",
            "bizName": "주식회사　코펀드대부",
            "bizCeo": "문정민",
            "bankCode": "011",
            "bankName": "농협은행",
            "bankAcct": "3017775422261",
            "address": "서울시　중구　명동２길　３４，　９층（충무로　１가）"
        },
        {
            "endoNo": 2,
            "divNo": 2,
            "endoDate": "20190530",
            "endoAmt": 100000000,
            "customerType": "1",
            "bizNo": "4358600710",
            "bizName": "주식회사　한국기업금융대부",
            "bizCeo": "곽기웅",
            "bankCode": "039",
            "bankName": "경남은행",
            "bankAcct": "2070080152209",
            "address": "서울　서초구　나루터로１０길　２０，５층"
        }
    ]
}
```

상세보기의 endoList.customerType 값 -- "1": 법인, "2": 개인사업자, "3": 개인

bizNo 이 13자리일경우 주민번호, 10자리이면 사업자번호
