const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// ── 자동 미루기 수동 실행  ──────────
// POST /todos/carry-over/run
router.post("/carry-over/run", todoController.runCarryOver);

// ── 달력 월간 조회 ────────────────────────────
// GET /todos/calendar?year=2026&month=4 - 개인 월간
// GET /todos/calendar?year=2026&month=4&team_id=1 - 팀 월간
router.get("/calendar", todoController.getCalendarTodos);

// ── 개인 Todo ─────────────────────────────────
// GET  /todos/personal                              전체
// GET  /todos/personal?type=day&date=2026-04-10     일간
// GET  /todos/personal?type=week&start=...&end=...  주간
// POST /todos/personal                              생성 (반복 포함)
router.get("/personal",  todoController.getPersonalTodos);
router.post("/personal", todoController.createPersonalTodo);

// ── 팀 Todo ───────────────────────────────────
// GET  /todos/team/:team_id/members
// GET  /todos/team/:team_id
// GET  /todos/team/:team_id?type=day&date=...           일간
// GET  /todos/team/:team_id?type=week&start=...&end=... 주간
// POST /todos/team/:team_id
router.get("/team/:team_id/members", todoController.getTeamMembers);
router.get("/team/:team_id",         todoController.getTeamTodos);
router.post("/team/:team_id",        todoController.createTeamTodo);

// ── 수정 / 삭제 ───────────────────────────────
// PATCH  /todos/:todo_id              이 일정만 수정
// PATCH  /todos/:todo_id?scope=group  모든 일정 수정
// DELETE /todos/:todo_id              이 일정만 삭제
// DELETE /todos/:todo_id?scope=group  모든 일정 삭제
router.patch("/:todo_id",  todoController.updateTodo);
router.delete("/:todo_id", todoController.deleteTodo);

module.exports = router;