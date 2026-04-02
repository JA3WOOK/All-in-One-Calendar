// app.js 에 연결 확인 코드 추가 
const express = require("express"); 
const cors = require("cors"); 
const dotenv = require("dotenv");

dotenv.config();

const pool = require("./config/db"); 
const authRoutes = require("./routes/authRoutes");


const app = express(); 

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
})
); 

app.use(express.json()); 


// DB 연결 테스트 
async function testDB() { 
    try { 
        
        const [rows] = await pool.query("SELECT 1"); 
        console.log("DB 연결 성공!"); 

    } catch (err) { 
        console.error("DB 연결 실패:", err); 
    } 
} 


// 기본 확인용
app.get("/", (req, res) => { 
    res.send("로그인 서버 실행 중" ); 
}); 

// 로그인 라우터
app.use("/api/auth", authRoutes);

// 등록되지 않은 경로 처리 
app.use((req, res) => {
    res.status(404).json({error : "요청한 경로를 찾을 수 없습니다."});
});

// 전역 에러 처리 
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message || "서버 내부 오류가 발생했습니다.",
    });
});


const PORT = process.env.PORT || 3001; 

async function startServer() {
    try {
        await pool.query("SELECT 1");
        console.log(`DB 연결 성공`);

        app.listen(PORT, () => { 
        console.log(`서버 실행: http://localhost:${PORT}`); 
        }); 
    } catch (err) {
        console.error("DB 연결 실패:", err.message);
        process.exit(1);
    }
}
startServer();