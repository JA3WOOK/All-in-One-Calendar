// ── 모듈 import ───────────────────────────────────
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const pool = require("./config/db");
const todoModel = require("./models/todoModel");

// ── 라우터 import ─────────────────────────────────
const todoRoutes = require("./routes/todoRoutes");

// ── Express 앱 생성 ───────────────────────────────
const app = express();

// ── 미들웨어 등록 ─────────────────────────────────
app.use(cors());          // 프론트엔드 CORS 허용
app.use(express.json());  // req.body JSON 파싱

// ── 라우터 연결 ───────────────────────────────────
app.get("/", (req, res) => {
    res.send("서버 실행 중");
});

app.use("/todos", todoRoutes);

// ── 서버 시작 ─────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`서버 실행: http://localhost:${PORT}`);
});

// ── 자동 미루기 ───────────────────────────────────

// 서버 시작 시 밀린 todo 즉시 처리
// 서버가 꺼져있는 동안 자정을 넘긴 todo를 서버 켤 때 한 번에 처리
async function runMissedCarryOver() {
    try {
        const count = await todoModel.carryOverTodos();
        if (count > 0) {
            console.log(`[자동 미루기] 서버 시작 시 ${count}개 처리됨`);
        }
    } catch (err) {
        console.error("[자동 미루기 오류]", err);
    }
}

runMissedCarryOver();

// 매일 자정 0시 0분에 자동 미루기 실행
// - is_carried_over = TRUE, is_done = FALSE, due_date < 오늘 인 todo를 +1일
// - 서버가 켜져있는 동안만 동작 (꺼지면 runMissedCarryOver가 대신 처리)
cron.schedule("0 0 * * *", async () => {
    try {
        const count = await todoModel.carryOverTodos();
        console.log(`[자동 미루기] ${count}개 todo가 +1일 처리됨`);
    } catch (err) {
        console.error("[자동 미루기 오류]", err);
    }
}, {
    timezone: "Asia/Seoul", // 한국 시간 기준
});