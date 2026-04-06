// ── 모듈 import ───────────────────────────────────
const express = require("express");
const cors    = require("cors");
const cron    = require("node-cron");
require("dotenv").config();

// ── 라우터 / 모델 import ──────────────────────────
const todoModel      = require("./models/todoModel");
const todoRoutes     = require("./routes/todoRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const teamRoutes     = require("./routes/teamRoutes");

// ── Express 앱 생성 ───────────────────────────────
const app = express();

// ── 미들웨어 ──────────────────────────────────────
app.set("json spaces", 2);
app.use(cors());
app.use(express.json());

// ── 라우터 연결 ───────────────────────────────────
app.get("/", (req, res) => res.send("서버 실행 중"));

app.use("/api/schedules", scheduleRoutes);
app.use("/api/teams",     teamRoutes);

app.use("/api/todos",     todoRoutes);

// ── 서버 시작 ─────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`서버 실행: http://localhost:${PORT}`);
});

// ── 자동 미루기 ───────────────────────────────────

// 서버 시작 시 밀린 todo 즉시 처리
async function runMissedCarryOver() {
    try {
        const count = await todoModel.carryOverTodos();
        if (count > 0) console.log(`[자동 미루기] 서버 시작 시 ${count}개 처리됨`);
    } catch (err) {
        console.error("[자동 미루기 오류]", err);
    }
}

runMissedCarryOver();

// 매일 자정 한국 시간 기준으로 실행
cron.schedule("0 0 * * *", async () => {
    try {
        const count = await todoModel.carryOverTodos();
        console.log(`[자동 미루기] ${count}개 todo가 +1일 처리됨`);
    } catch (err) {
        console.error("[자동 미루기 오류]", err);
    }
}, { timezone: "Asia/Seoul" });