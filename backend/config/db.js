// MySQL 연결 설정 (ES 모듈 방식)
import mysql from "mysql2/promise";

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
 
export default pool;