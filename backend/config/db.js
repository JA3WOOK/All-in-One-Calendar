/*
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:             process.env.DB_HOST || "localhost",     // 변수 처리 (기본값 localhost)
  user:             process.env.DB_USER|| "root",          // 변수 처리 (기본값 root)
  password:         process.env.DB_PASSWORD,             // 비번 대신 변수 사용!
  database:         process.env.DB_NAME,                 // DB명도 변수로 처리
  port:             process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         "+09:00",
  dateStrings:      true,
});

module.exports = pool;
*/
const mysql = require("mysql2/promise");

// 커넥션 풀 생성 
const pool = mysql.createPool({ 
  host: "localhost",     // DB 서버 
  user: "root",          // 계정 
  password: "0221",      // 비밀번호 
  database: "all_in_one",     // DB명 
  waitForConnections: true, // 기다릴 지 유무  
  connectionLimit: 10, //동시 연결 수   
  queueLimit: 0   // queue에 쌓을 수 있는 요청 개수 제한
}); 
 
module.exports = pool;