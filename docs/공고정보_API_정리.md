# 📋 공고정보 API (기업마당 bizinfo.go.kr)

## 1️⃣ 기본 정보

| 항목 | 내용 |
|---|---|
| API 이름 | 공고정보 API |
| 설명 | 기관별, 분야별 최신 지원사업 공고 정보 제공 |
| URL | `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do` |
| 호출 방식 | GET |
| 데이터 형식 | JSON, XML(RSS) |
| 등록일 | 2023.08.02 |
| 수정일 | 2025.10.22 |

---

## 2️⃣ 요청 파라미터

| 파라미터명 | 항목명 | 타입 | 필수여부 | 샘플데이터 | 설명 |
|---|---|---|---|---|---|
| crtfcKey | 서비스키 | String | Y | - | 기업마당에서 발급받은 서비스 인증키 |
| dataType | 데이터타입 | String | N | rss / json | API 데이터를 리턴받는 타입 지정 |
| searchCnt | 조회건수 | String | N | 100 | 조회건수 지정 (0 또는 값 없을 시 전체 데이터) |
| searchLclasId | 분야 | String | N | 02 | 지원사업 조회시 분야 지정 |
| hashtags | 해시태그 | String | N | 금융,서울 | 해시태그 지정하여 조회 (다중입력 가능) |
| pageUnit | 데이터개수 | String | N | 4 | 한 페이지에 보여줄 데이터 개수 |
| pageIndex | 페이지번호 | String | N | 2 | 화면에 보여줄 페이지 번호 |

---

## 3️⃣ 분야 코드 (searchLclasId)

| 코드 | 분야명 | 코드 | 분야명 |
|---|---|---|---|
| 01 | 금융 | 05 | 내수 |
| 02 | 기술 | 06 | 창업 |
| 03 | 인력 | 07 | 경영 |
| 04 | 수출 | 09 | 기타 |

---

## 4️⃣ 지역 해시태그

**광역시도 (16개)**
서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주

---

## 5️⃣ 응답 메시지 구조

### 📤 응답 필드 (공통)

| 필드명 | 항목명 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| title | 데이터 제목 | String | Y | 기업마당 지원사업정보 |
| link | 공고목록URL | String | Y | 공고 목록 링크 |
| description | 데이터 설명 | String | Y | 최신지원사업정보를 구독하세요 |
| language | 언어 | String | Y | ko-kr |
| copyright | 출처 | String | Y | bizinfo |
| managingEditor | 담당자 | String | Y | develover@smba.go.kr |
| webMaster | 관리자 | String | Y | kosi@bizinfo.go.kr |
| category | 제공구분 | String | Y | bizinfo |
| ttl | 유효시간 | String | Y | 60 |

### 📦 아이템 필드 (각 공고 정보)

| 필드명 | 항목명 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| title | 공고명 | String | Y | 예: 착한임대인 장관 표창 신청 연장 공고 |
| link | 공고URL | String | Y | 공고 상세 페이지 링크 |
| seq | 공고ID | String | Y | 예: PBLN_000000000080236 |
| author | 소관기관명 | String | Y | 예: 중소벤처기업부 |
| excInsttNm | 수행기관명 | String | Y | 예: 지방중소벤처기업청 |
| description | 사업개요내용 | String | N | 사업 설명 |
| lcategory | 지원분야대분류 | String | Y | 예: 경영 |
| pubDate | 등록일자 | String | Y | 예: 2022-09-02 15:38:29 |
| reqstDt | 신청기간 | String | N | 예: 20220727 ~ 20220930 |
| trgetNm | 지원대상 | String | Y | 예: 중소기업 |
| inqireCo | 조회수 | String | Y | 예: 43 |
| flpthNm | 첨부파일경로명 | String | N | 첨부파일 URL |
| fileNm | 첨부파일명 | String | N | 예: 2022년 대한민국 메이커 스타 참가자모집 공고.pdf |
| printFlpthNm | 본문출력파일경로명 | String | Y | 인쇄용 파일 URL |
| printFileNm | 본문출력파일명 | String | Y | 인쇄용 파일명 |
| hashTags | 해시태그 | String | Y | 예: 2022,금융,충북,대전,중소벤처기업부 |
| totCnt | 전체건수 | String | Y | 예: 1435 |
| jrsdInsttNm | 소관기관명 | String | N | 예: 중소벤처기업부 |
| bsnsSumryCn | 사업개요내용 | String | N | 상세 사업 설명 |
| refrncNm | 문의처 | String | N | 연락처 정보 |
| rceptEngnHmpgUrl | 사업신청URL | String | N | 신청 홈페이지 URL |
| creatPnttm | 등록일자 | String | N | 예: 2022-09-02 15:38:29 |
| reqstBeginEndDe | 신청기간 | String | N | 예: 20220727 ~ 20220930 |

---

## 6️⃣ 사용 예시

### 📌 XML(RSS) 응답 예시

```xml
<rss version="2.0">
  <channel>
    <title>기업마당 지원사업정보</title>
    <link>https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do</link>
    <ttl>60</ttl>
    <item>
      <title>착한임대인 장관 표창 신청 연장 공고</title>
      <link>https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_000000000080236</link>
      <seq>PBLN_000000000080236</seq>
      <author>중소벤처기업부</author>
      <lcategory>경영</lcategory>
      <pubDate>2022-09-02 15:38:29</pubDate>
    </item>
  </channel>
</rss>
```

### 📌 JSON 응답 예시

```json
{
  "jsonArray": {
    "title": "기업마당 지원사업정보",
    "link": "https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do",
    "ttl": 60,
    "item": [
      {
        "title": "착한임대인 장관 표창 신청 연장 공고",
        "link": "https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_000000000080236",
        "seq": "PBLN_000000000080236",
        "author": "중소벤처기업부",
        "lcategory": "경영",
        "pubDate": "2022-09-02 15:38:29"
      }
    ]
  }
}
```

### 📌 Java 샘플 코드

```java
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.io.BufferedReader;
import java.net.URL;
import java.io.IOException;

public class ApiExplorer {
  public static void main(String[] args) throws IOException {
    StringBuilder urlBuilder = new StringBuilder("http://X.X.X.X:X/test?crtfcKey=XXXXX");
    URL url = new URL(urlBuilder.toString());
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setRequestMethod("GET");
    conn.setRequestProperty("Content-type", "application/json");

    System.out.println("Response code: " + conn.getResponseCode());
    BufferedReader rd;

    if (conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
      rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
    } else {
      rd = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
    }

    StringBuilder sb = new StringBuilder();
    String line;
    while ((line = rd.readLine()) != null) {
      sb.append(line);
    }
    rd.close();
    conn.disconnect();
    System.out.println(sb.toString());
  }
}
```

---

## 7️⃣ 주의사항

- ✅ **필수항목**: `crtfcKey` (서비스 인증키)는 반드시 포함되어야 함
- ✅ **인증키 발급**: 기업마당에서 발급받아야 함
- ✅ **데이터 형식**: `dataType`을 지정하지 않으면 RSS 형식으로 응답
- ✅ **조회건수**: `searchCnt`가 0 또는 값이 없으면 전체 데이터 반환
- ✅ **TTL**: 60초 동안 유효 (캐시 시간)
