import API from "./axios";

// ── 팀 멤버 조회 (모달 셀렉박스용) ──────────────
export const fetchTeamMembers = (team_id) =>
    API.get(`/api/todos/team/${team_id}/members`).then((res) => res.data.data);

// ── 개인 Todo 생성 ───────────────────────────────
export const createPersonalTodo = (data) =>
    API.post("/api/todos/personal", {
        content:        data.content,
        dueDate:        data.dueDate        ?? null,
        priority:       data.priority       ?? "MEDIUM",
        category:       data.category,
        isCarriedOver:  data.isCarriedOver  ?? false,
        isRepeat:       data.isRepeat       ?? false,
        repeatType:     data.repeatType     ?? null,
        repeatInterval: data.repeatInterval ?? 1,
        repeatEndAt:    data.repeatEndAt    ?? null,
    }).then((res) => res.data);

// ── 팀 Todo 생성 ─────────────────────────────────
export const createTeamTodo = (team_id, data) =>
    API.post(`/api/todos/team/${team_id}`, {
        content:        data.content,
        dueDate:        data.dueDate        ?? null,
        priority:       data.priority       ?? "MEDIUM",
        category:       data.category,
        assignBy:       data.assignBy       ?? null,
        isCarriedOver:  data.isCarriedOver  ?? false,
        isRepeat:       data.isRepeat       ?? false,
        repeatType:     data.repeatType     ?? null,
        repeatInterval: data.repeatInterval ?? 1,
        repeatEndAt:    data.repeatEndAt    ?? null,
    }).then((res) => res.data);

// ── 개인 Todo 목록 ───────────────────────────────
export const fetchPersonalTodos = (due_date = null) =>
    API.get("/api/todos/personal", { params: due_date ? { due_date } : {} })
        .then((res) => res.data.data);

// ── 팀 Todo 목록 ─────────────────────────────────
export const fetchTeamTodos = (team_id, due_date = null) =>
    API.get(`/api/todos/team/${team_id}`, { params: due_date ? { due_date } : {} })
        .then((res) => res.data.data);

// ── 달력 월간 조회 ───────────────────────────────
export const fetchCalendarTodos = (year, month, team_id = null) =>
    API.get("/api/todos/calendar", {
        params: { year, month, ...(team_id ? { team_id } : {}) },
    }).then((res) => res.data.data);

// ── 수정 ─────────────────────────────────────────
export const updateTodo = (todo_id, data, scope = "only") =>
    API.patch(`/api/todos/${todo_id}`, data, {
        params: scope === "group" ? { scope: "group" } : {},
    }).then((res) => res.data);

// ── 삭제 ─────────────────────────────────────────
export const deleteTodo = (todo_id, scope = "only") =>
    API.delete(`/api/todos/${todo_id}`, {
        params: scope === "group" ? { scope: "group" } : {},
    }).then((res) => res.data);

// ── 자동 미루기 수동 실행 ─────────────────────────
export const runCarryOver = () =>
    API.post("/api/todos/carry-over/run").then((res) => res.data);