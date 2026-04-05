//  MySQL 연결 설정

const mysql = require("mysql2/promise");  // Promise + async/await 사용  
 
// 커넥션 풀 생성 
const pool = mysql.createPool({ 
  host: "localhost",     // DB 서버 
  user: "root",          // 계정 
  password: "1234",      // 비밀번호 
  database: "all_in_one",     // DB명
  waitForConnections: true, // 기다릴 지 유무  
  connectionLimit: 10, //동시 연결 수   
  queueLimit: 0,   // queue에 쌓을 수 있는 요청 개수 제한,  0은 무한대기

  // 자동미루기 UTC 시간 맞추기
  timezone: "+09:00",
  dateStrings: true,
}); 
 
module.exports = pool;
