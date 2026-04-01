// MySQL 연결 설정
require('dotenv').config(); // 1. .env 파일을 읽어서 process.env에 담습니다.
const mysql = require("mysql2/promise");

// 커넥션 풀 생성 
const pool = mysql.createPool({ 
  host: process.env.DB_HOST || "localhost",     // 변수 처리 (기본값 localhost)
  user: process.env.DB_USER || "root",          // 변수 처리 (기본값 root)
  password: process.env.DB_PASSWORD,             // ⭐️ 핵심: 리더님의 비번 대신 변수 사용!
  database: process.env.DB_NAME,                 // ⭐️ 핵심: DB명도 변수로 처리
  waitForConnections: true, 
  connectionLimit: 10, 
  queueLimit: 0 
}); 

module.exports = pool;