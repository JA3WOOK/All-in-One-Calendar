const todoModel = require("../models/todoModel");

// ──────────────────────────────────────────────
// 팀 멤버 조회
// GET /todos/team/:team_id/members
// ──────────────────────────────────────────────
exports.getTeamMembers = async (req, res) => {
    try {
        const { team_id } = req.params;
        const members = await todoModel.findTeamMembers(Number(team_id));
        return res.status(200).json({ success: true, data: members });
    } catch (err) {
        console.error("[getTeamMembers]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 개인 Todo 조회
// GET /todos/personal?type=all|day|week&date=&start=&end=
// ──────────────────────────────────────────────
exports.getPersonalTodos = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { type, date, start, end } = req.query;

        let todos;
        if (type === "day") {
            if (!date) return res.status(400).json({ success: false, message: "date는 필수입니다." });
            todos = await todoModel.findByUserAndDate(user_id, date);
        } else if (type === "week") {
            if (!start || !end) return res.status(400).json({ success: false, message: "start, end는 필수입니다." });
            todos = await todoModel.findByUserAndWeek(user_id, start, end);
        } else {
            todos = await todoModel.findAllByUser(user_id);
        }

        return res.status(200).json({ success: true, data: todos });
    } catch (err) {
        console.error("[getPersonalTodos]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 개인 Todo 생성
// POST /todos/personal
// ──────────────────────────────────────────────
exports.createPersonalTodo = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const {
            content, dueDate, priority, category,
            isCarriedOver, isRepeat, repeatType, repeatInterval, repeatEndAt,
        } = req.body;

        if (!content)  return res.status(400).json({ success: false, message: "content는 필수입니다." });
        if (!category) return res.status(400).json({ success: false, message: "category는 필수입니다." });
        if (!dueDate && !isCarriedOver) return res.status(400).json({ success: false, message: "dueDate는 필수입니다." });
        if (isRepeat && !repeatType)    return res.status(400).json({ success: false, message: "반복 일정은 repeatType이 필요합니다." });
        if (isRepeat && !repeatEndAt)   return res.status(400).json({ success: false, message: "반복 종료일은 필수입니다." });

        const base = {
            user_id, content,
            priority:        priority       ?? "MEDIUM",
            category,
            created_by:      user_id,
            is_carried_over: isCarriedOver  ?? false,
            is_repeat:       isRepeat       ?? false,
            repeat_type:     isRepeat ? repeatType   : null,
            repeat_interval: repeatInterval ?? 1,
            repeat_end_at:   isRepeat ? repeatEndAt  : null,
        };

        // 반복 일정 → 여러 건 생성
        if (isRepeat && dueDate && repeatEndAt) {
            const dates = generateRepeatDates(dueDate, repeatType, repeatInterval ?? 1, repeatEndAt);
            const todos = dates.map(d => ({ ...base, due_date: d }));
            const result = await todoModel.createManyPersonal(todos);
            return res.status(201).json({ success: true, message: `${result.count}개 할 일이 생성됐습니다.`, ...result });
        }

        // 단건 생성
        const todo_id = await todoModel.createPersonal({ ...base, due_date: dueDate ?? null });
        const created = await todoModel.findById(todo_id);
        return res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error("[createPersonalTodo]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 팀 Todo 조회
// GET /todos/team/:team_id?type=all|day|week&date=&start=&end=
// ──────────────────────────────────────────────
exports.getTeamTodos = async (req, res) => {
    try {
        const { team_id } = req.params;
        const { type, date, start, end } = req.query;

        let todos;
        if (type === "day") {
            if (!date) return res.status(400).json({ success: false, message: "date는 필수입니다." });
            todos = await todoModel.findByTeamAndDate(Number(team_id), date);
        } else if (type === "week") {
            if (!start || !end) return res.status(400).json({ success: false, message: "start, end는 필수입니다." });
            todos = await todoModel.findByTeamAndWeek(Number(team_id), start, end);
        } else {
            todos = await todoModel.findAllByTeam(Number(team_id));
        }

        return res.status(200).json({ success: true, data: todos });
    } catch (err) {
        console.error("[getTeamTodos]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 팀 Todo 생성
// POST /todos/team/:team_id
// ──────────────────────────────────────────────
exports.createTeamTodo = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { team_id } = req.params;
        const {
            content, dueDate, priority, category, assignBy,
            isCarriedOver, isRepeat, repeatType, repeatInterval, repeatEndAt,
        } = req.body;

        if (!content)  return res.status(400).json({ success: false, message: "content는 필수입니다." });
        if (!category) return res.status(400).json({ success: false, message: "category는 필수입니다." });
        if (!dueDate && !isCarriedOver) return res.status(400).json({ success: false, message: "dueDate는 필수입니다." });
        if (isRepeat && !repeatType)    return res.status(400).json({ success: false, message: "반복 일정은 repeatType이 필요합니다." });
        if (isRepeat && !repeatEndAt)   return res.status(400).json({ success: false, message: "반복 종료일은 필수입니다." });

        const base = {
            team_id:         Number(team_id),
            content,
            priority:        priority       ?? "MEDIUM",
            category,
            assign_by:       assignBy       ?? null,
            created_by:      user_id,
            is_carried_over: isCarriedOver  ?? false,
            is_repeat:       isRepeat       ?? false,
            repeat_type:     isRepeat ? repeatType   : null,
            repeat_interval: repeatInterval ?? 1,
            repeat_end_at:   isRepeat ? repeatEndAt  : null,
        };

        if (isRepeat && dueDate && repeatEndAt) {
            const dates = generateRepeatDates(dueDate, repeatType, repeatInterval ?? 1, repeatEndAt);
            const todos = dates.map(d => ({ ...base, due_date: d }));
            const result = await todoModel.createManyTeam(todos);
            return res.status(201).json({ success: true, message: `${result.count}개 할 일이 생성됐습니다.`, ...result });
        }

        const todo_id = await todoModel.createTeam({ ...base, due_date: dueDate ?? null });
        const created = await todoModel.findById(todo_id);
        return res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error("[createTeamTodo]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 달력 (월간 조회)
// GET /todos/calendar
// ──────────────────────────────────────────────

exports.getCalendarTodos = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { year, month, team_id } = req.query;

        if (!year || !month) {
            return res.status(400).json({ success: false, message: "year, month는 필수입니다." });
        }

        const todos = team_id
            ? await todoModel.findByTeamAndMonth(Number(team_id), year, month)
            : await todoModel.findByUserAndMonth(user_id, year, month);

        // 날짜별 그룹핑 { "2025-04-05": [...] }
        const grouped = todos.reduce((acc, todo) => {
            const key = todo.due_date instanceof Date
                ? todo.due_date.toISOString().slice(0, 10)
                : String(todo.due_date).slice(0, 10);
            if (!acc[key]) acc[key] = [];
            acc[key].push(todo);
            return acc;
        }, {});

        return res.status(200).json({ success: true, data: grouped });
    } catch (err) {
        console.error("[getCalendarTodos]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 수정
// PATCH /todos/:todo_id
// PATCH /todos/:todo_id?scope=group  → 모든 일정
// ──────────────────────────────────────────────
exports.updateTodo = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { todo_id } = req.params;
        const { scope } = req.query; // scope=group 이면 모든 일정 수정

        const todo = await todoModel.findById(Number(todo_id));
        if (!todo) return res.status(404).json({ success: false, message: "할 일을 찾을 수 없습니다." });
        if (todo.user_id && todo.user_id !== user_id) return res.status(403).json({ success: false, message: "권한이 없습니다." });

        const {
            content, dueDate, priority, category,
            isDone, isCarriedOver, assignBy,
            isRepeat, repeatType, repeatInterval, repeatEndAt,
        } = req.body;

        const fields = {};
        if (content        !== undefined) fields.content         = content;
        if (dueDate        !== undefined) fields.due_date        = dueDate;
        if (priority       !== undefined) fields.priority        = priority;
        if (category       !== undefined) fields.category        = category;
        if (isDone         !== undefined) fields.is_done         = isDone;
        if (isCarriedOver  !== undefined) fields.is_carried_over = isCarriedOver;
        if (assignBy       !== undefined) fields.assign_by       = assignBy;
        if (isRepeat       !== undefined) fields.is_repeat       = isRepeat;
        if (repeatType     !== undefined) fields.repeat_type     = repeatType;
        if (repeatInterval !== undefined) fields.repeat_interval = repeatInterval;
        if (repeatEndAt    !== undefined) fields.repeat_end_at   = repeatEndAt;

        // 모든 일정 수정 (반복 그룹 전체)
        if (scope === "group" && todo.repeat_group_id) {
            const affected = await todoModel.updateByGroup(todo.repeat_group_id, fields, user_id);
            return res.status(200).json({ success: true, message: `${affected}개 할 일이 수정됐습니다.`, count: affected });
        }

        // 이 일정만 수정
        const affected = await todoModel.update(Number(todo_id), fields, user_id);
        if (!affected) return res.status(400).json({ success: false, message: "수정할 내용이 없습니다." });

        const updated = await todoModel.findById(Number(todo_id));
        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error("[updateTodo]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};
// ──────────────────────────────────────────────
// 삭제
// DELETE /todos/:todo_id
// DELETE /todos/:todo_id?scope=group  → 모든 일정
// ──────────────────────────────────────────────
exports.deleteTodo = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { todo_id } = req.params;
        const { scope } = req.query; // scope=group 이면 모든 일정 삭제

        const todo = await todoModel.findById(Number(todo_id));
        if (!todo) return res.status(404).json({ success: false, message: "할 일을 찾을 수 없습니다." });
        if (todo.user_id && todo.user_id !== user_id) return res.status(403).json({ success: false, message: "권한이 없습니다." });

        // 모든 일정 삭제 (반복 그룹 전체)
        if (scope === "group" && todo.repeat_group_id) {
            const affected = await todoModel.softDeleteByGroup(todo.repeat_group_id, user_id);
            return res.status(200).json({ success: true, message: `${affected}개 할 일이 삭제됐습니다.`, count: affected });
        }

        // 이 일정만 삭제
        await todoModel.softDelete(Number(todo_id), user_id);
        return res.status(200).json({ success: true, message: "할 일이 삭제됐습니다." });
    } catch (err) {
        console.error("[deleteTodo]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 자동 미루기 수동 실행
// POST /todos/carry-over/run
// ──────────────────────────────────────────────
exports.runCarryOver = async (req, res) => {
    try {
        const count = await todoModel.carryOverTodos();
        return res.status(200).json({ success: true, message: `${count}개 todo가 미뤄졌습니다.`, count });
    } catch (err) {
        console.error("[runCarryOver]", err);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// ──────────────────────────────────────────────
// 반복 날짜 배열 생성
// ──────────────────────────────────────────────

/**
 * @param {string} startDate  - 'YYYY-MM-DD'
 * @param {string} repeatType - 'daily' | 'weekly' | 'monthly'
 * @param {number} interval   - 반복 간격
 * @param {string} endDate    - 'YYYY-MM-DD'
 * @returns {string[]}
 */
function generateRepeatDates(startDate, repeatType, interval, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const yyyy = current.getFullYear();
        const mm   = String(current.getMonth() + 1).padStart(2, "0");
        const dd   = String(current.getDate()).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);

        if (repeatType === "daily") {
            current.setDate(current.getDate() + interval);
        } else if (repeatType === "weekly") {
            current.setDate(current.getDate() + 7 * interval);
        } else if (repeatType === "monthly") {
            current.setMonth(current.getMonth() + interval);
        }
    }
    return dates;
}