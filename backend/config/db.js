const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

<<<<<<< HEAD
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "latteislove!",
  database: process.env.DB_NAME || "all_in_one",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
=======
const mysql = require("mysql2/promise");  // Promise + async/await 사용  
 
// 커넥션 풀 생성 
const pool = mysql.createPool({ 
  host: "localhost",     // DB 서버 
  user: "root",          // 계정 
  password: "thdtnqls0528",      // 비밀번호 
  database: "all_in_one",     // DB명 
  waitForConnections: true, // 기다릴 지 유무  
  connectionLimit: 10, //동시 연결 수   
  queueLimit: 0   // queue에 쌓을 수 있는 요청 개수 제한,  0은 무한대기  
}); 
 
module.exports = pool; 
>>>>>>> subin
