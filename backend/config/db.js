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