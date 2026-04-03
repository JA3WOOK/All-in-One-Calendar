// app.js 에 연결 확인 코드 추가 
const express = require("express"); 
const cors = require("cors"); 
require("dotenv").config(); // (비밀번호 보호용)

const pool = require("./config/db"); 
const scheduleRoutes = require("./routes/scheduleRoutes"); //  일정 라우터 가져오기

const app = express();
// JSON 응답을 2칸 들여쓰기 출력하도록 설정
app.set('json spaces', 2);

app.use(cors()); 
app.use(express.json());

//라우터 연결
app.use("/api/schedules", scheduleRoutes);

// Promise 객체 : js에서 비동기작업 (완료되지 않고 걸리는 시간) 중에 [실행대기, 성공, 실패]를 리턴하는 객체
// ex) 카페 진동벨 -> 비동기 대기
// 컴포넌트 앞에 async를 선언하면 {} 안에 기다려라 await는 코드가 존재한다를 알려주는 것

// DB 연결 확인 로직
async function testDB() { 
    try { 
        // await DB의 response를 즉 응답이 올때 까지 잠시 '기다림'
        const [rows] = await pool.query("SELECT 1"); 
        console.log("DB 연결 성공!"); 

    } catch (err) { 
        console.error("DB 연결 실패:", err); 
    } 
} 
testDB(); 

app.get("/", (req, res) => { 
    res.send("all_in_one 서버 실행 중 (Promise 버전)" ); 
}); 

const PORT = 3001; 
app.listen(PORT, () => { 
console.log(`서버 실행: http://localhost:${PORT}`); 
}); 