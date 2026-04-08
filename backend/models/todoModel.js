const pool = require("../config/db");

// ──────────────────────────────────────────────
// 조회
// ──────────────────────────────────────────────

/** 단건 조회 */
exports.findById = async (todo_id) => {
    const sql = "SELECT * FROM todos WHERE todo_id = ? AND is_deleted = FALSE";
    const [rows] = await pool.query(sql, [todo_id]);
    return rows[0] ?? null;
};

/**
 * 개인 todo 목록 조회
 */
exports.findAllByUser = async (user_id, due_date = null) => {
    let sql = `
        SELECT *
        FROM todos
        WHERE user_id = ?
          AND team_id IS NULL
          AND is_deleted = FALSE
    `;
    const params = [user_id];

    if (due_date) {
        sql += " AND due_date = ?";
        params.push(due_date);
    }

    sql += " ORDER BY due_date ASC, created_at DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
};

/**
 * 팀 todo 목록 조회
 */
exports.findAllByTeam = async (team_id, due_date = null) => {
    let sql = `
        SELECT t.*, u.name AS assign_by_name
        FROM todos t
                 LEFT JOIN users u ON t.assign_by = u.user_id
        WHERE t.team_id = ?
          AND t.user_id IS NULL
          AND t.is_deleted = FALSE
    `;
    const params = [team_id];

    if (due_date) {
        sql += " AND t.due_date = ?";
        params.push(due_date);
    }

    sql += " ORDER BY t.due_date ASC, t.created_at DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
};

/** 개인 - 일간 조회 */
exports.findByUserAndDate = async (user_id, date) => {
    const sql = `
        SELECT * FROM todos
        WHERE user_id = ? AND team_id IS NULL AND is_deleted = FALSE
          AND due_date = ?
        ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql, [user_id, date]);
    return rows;
};

/** 팀 - 일간 조회 */
exports.findByTeamAndDate = async (team_id, date) => {
    const sql = `
        SELECT t.*, u.name AS assign_by_name
        FROM todos t
        LEFT JOIN users u ON t.assign_by = u.user_id
        WHERE t.team_id = ? AND t.user_id IS NULL AND t.is_deleted = FALSE
          AND t.due_date = ?
        ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.query(sql, [team_id, date]);
    return rows;
};

/** 개인 - 주간 조회 */
exports.findByUserAndWeek = async (user_id, start, end) => {
    const sql = `
        SELECT * FROM todos
        WHERE user_id = ? AND team_id IS NULL AND is_deleted = FALSE
          AND due_date BETWEEN ? AND ?
        ORDER BY due_date ASC, created_at DESC
    `;
    const [rows] = await pool.query(sql, [user_id, start, end]);
    return rows;
};

/** 팀 - 주간 조회 */
exports.findByTeamAndWeek = async (team_id, start, end) => {
    const sql = `
        SELECT t.*, u.name AS assign_by_name
        FROM todos t
        LEFT JOIN users u ON t.assign_by = u.user_id
        WHERE t.team_id = ? AND t.user_id IS NULL AND t.is_deleted = FALSE
          AND t.due_date BETWEEN ? AND ?
        ORDER BY t.due_date ASC, t.created_at DESC
    `;
    const [rows] = await pool.query(sql, [team_id, start, end]);
    return rows;
};

/** 개인 - 월간 조회 (달력용) */
exports.findByUserAndMonth = async (user_id, year, month) => {
    const sql = `
        SELECT *
        FROM todos
        WHERE user_id = ?
            AND team_id IS NULL
            AND is_deleted = FALSE
            AND YEAR(due_date) = ?
          AND MONTH(due_date) = ?
        ORDER BY due_date ASC
    `;
    const [rows] = await pool.query(sql, [user_id, year, month]);
    return rows;
};

/** 팀 - 월간 조회 (달력용) */
exports.findByTeamAndMonth = async (team_id, year, month) => {
    const sql = `
        SELECT t.*, u.name AS assign_by_name
        FROM todos t
                 LEFT JOIN users u ON t.assign_by = u.user_id
        WHERE t.team_id = ?
            AND t.user_id IS NULL
            AND t.is_deleted = FALSE
            AND YEAR(t.due_date) = ?
          AND MONTH(t.due_date) = ?
        ORDER BY t.due_date ASC
    `;
    const [rows] = await pool.query(sql, [team_id, year, month]);
    return rows;
};

/**
 * 팀 멤버 목록 조회 (모달 셀렉박스용)
 */
exports.findTeamMembers = async (team_id) => {
    const sql = `
        SELECT u.user_id, u.name, u.profile_image, tm.role
        FROM team_members tm
                 JOIN users u ON tm.user_id = u.user_id
        WHERE tm.team_id = ?
          AND u.is_deleted = FALSE
        ORDER BY tm.role ASC, u.name ASC
    `;
    const [rows] = await pool.query(sql, [team_id]);
    return rows;
};

// ──────────────────────────────────────────────
// 생성
// ──────────────────────────────────────────────

/**
 * 개인 Todo 생성
 */
exports.createPersonal = async ({
                                    user_id,
                                    content,
                                    due_date,
                                    priority = "MEDIUM",
                                    category,
                                    created_by,
                                    is_carried_over = false,
                                    is_repeat = false,
                                    repeat_type = null,
                                    repeat_interval = 1,
                                    repeat_end_at = null,
                                }) => {

    const sql = `
        INSERT INTO todos
        (user_id, team_id, content, due_date, priority, category,
         created_by, is_carried_over,
         is_repeat, repeat_type, repeat_interval, repeat_end_at)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        user_id,
        content,
        due_date,
        priority,
        category,
        created_by,
        is_carried_over,
        is_repeat,
        repeat_type,
        repeat_interval,
        repeat_end_at,
    ]);
    return result.insertId;
};

/**
 * 팀 Todo 생성
 */
exports.createTeam = async ({
                                team_id,
                                content,
                                due_date,
                                priority = "MEDIUM",
                                category,
                                assign_by = null,   // 모달 셀렉박스 선택값 (팀원 user_id)
                                created_by,
                                is_carried_over = false,
                                is_repeat = false,
                                repeat_type = null,
                                repeat_interval = 1,
                                repeat_end_at = null,
                            }) => {

    const sql = `
        INSERT INTO todos
            (user_id, team_id, content, due_date, priority, category,
             assign_by, created_by, is_carried_over,
             is_repeat, repeat_type, repeat_interval, repeat_end_at)
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        team_id,
        content,
        due_date,
        priority,
        category,
        assign_by,
        created_by,
        is_carried_over,
        is_repeat,
        repeat_type,
        repeat_interval,
        repeat_end_at,
    ]);
    return result.insertId;
};

/**
 * 개인 반복 todo 다건 생성
 * 첫 번째 todo의 insertId를 repeat_group_id로 사용
 */
exports.createManyPersonal = async (todos) => {
    // 첫 번째 단건 생성
    const firstId = await exports.createPersonal(todos[0]);

    if (todos.length === 1) {
        await pool.query("UPDATE todos SET repeat_group_id = ? WHERE todo_id = ?", [firstId, firstId]);
        return { count: 1, repeat_group_id: firstId };
    }

    // 나머지 다건 생성 (repeat_group_id = firstId)
    const sql = `
        INSERT INTO todos
            (user_id, team_id, content, due_date, priority, category,
             created_by, is_carried_over,
             is_repeat, repeat_type, repeat_interval, repeat_end_at, repeat_group_id)
        VALUES ?
    `;
    const values = todos.slice(1).map(t => [
        t.user_id, null, t.content, t.due_date, t.priority, t.category,
        t.created_by, t.is_carried_over,
        t.is_repeat, t.repeat_type, t.repeat_interval, t.repeat_end_at, firstId,
    ]);
    const [result] = await pool.query(sql, [values]);

    // 첫 번째 todo repeat_group_id 업데이트
    await pool.query("UPDATE todos SET repeat_group_id = ? WHERE todo_id = ?", [firstId, firstId]);

    return { count: result.affectedRows + 1, repeat_group_id: firstId };
};

/**
 * 팀 반복 todo 다건 생성
 */
exports.createManyTeam = async (todos) => {
    const firstId = await exports.createTeam(todos[0]);

    if (todos.length === 1) {
        await pool.query("UPDATE todos SET repeat_group_id = ? WHERE todo_id = ?", [firstId, firstId]);
        return { count: 1, repeat_group_id: firstId };
    }

    const sql = `
        INSERT INTO todos
            (user_id, team_id, content, due_date, priority, category,
             assign_by, created_by, is_carried_over,
             is_repeat, repeat_type, repeat_interval, repeat_end_at, repeat_group_id)
        VALUES ?
    `;
    const values = todos.slice(1).map(t => [
        null, t.team_id, t.content, t.due_date, t.priority, t.category,
        t.assign_by, t.created_by, t.is_carried_over,
        t.is_repeat, t.repeat_type, t.repeat_interval, t.repeat_end_at, firstId,
    ]);
    const [result] = await pool.query(sql, [values]);

    await pool.query("UPDATE todos SET repeat_group_id = ? WHERE todo_id = ?", [firstId, firstId]);

    return { count: result.affectedRows + 1, repeat_group_id: firstId };
};

// ──────────────────────────────────────────────
// 수정
// ──────────────────────────────────────────────

/** 단건 수정 (이 일정만) */
exports.update = async (todo_id, fields, updated_by) => {
    const allowed = [
        "content", "due_date", "priority", "category",
        "is_done", "is_carried_over", "assign_by",
        "is_repeat", "repeat_type", "repeat_interval", "repeat_end_at",
    ];
    const setClauses = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            params.push(fields[key]);
        }
    }
    if (setClauses.length === 0) return 0;

    if (fields.is_done === true || fields.is_done === 1) {
        setClauses.push("completed_at = NOW()", "completed_by = ?");
        params.push(updated_by);
    }
    setClauses.push("updated_by = ?");
    params.push(updated_by);
    params.push(todo_id);

    const sql = `UPDATE todos SET ${setClauses.join(", ")} WHERE todo_id = ? AND is_deleted = FALSE`;
    const [result] = await pool.query(sql, params);
    return result.affectedRows;
};

/**
 * 그룹 전체 수정 (모든 일정)
 * due_date는 각 항목마다 다르므로 수정 불가
 */
exports.updateByGroup = async (repeat_group_id, fields, updated_by) => {
    const allowed = [
        "content", "priority", "category", "assign_by",
        "is_repeat", "repeat_type", "repeat_interval", "repeat_end_at",
    ];
    const setClauses = [];
    const params = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            params.push(fields[key]);
        }
    }
    if (setClauses.length === 0) return 0;

    setClauses.push("updated_by = ?");
    params.push(updated_by);
    params.push(repeat_group_id);

    const sql = `
        UPDATE todos SET ${setClauses.join(", ")}
        WHERE repeat_group_id = ? AND is_deleted = FALSE
    `;
    const [result] = await pool.query(sql, params);
    return result.affectedRows;
};

// ──────────────────────────────────────────────
// 삭제 (Soft Delete)
// ──────────────────────────────────────────────

/** 단건 삭제 (이 일정만) */
exports.softDelete = async (todo_id, updated_by) => {
    const sql = `
        UPDATE todos SET is_deleted = TRUE, updated_by = ?
        WHERE todo_id = ? AND is_deleted = FALSE
    `;
    const [result] = await pool.query(sql, [updated_by, todo_id]);
    return result.affectedRows;
};

/** 반복 그룹 전체 삭제 (모든 일정) */
exports.softDeleteByGroup = async (repeat_group_id, updated_by) => {
    const sql = `
        UPDATE todos SET is_deleted = TRUE, updated_by = ?
        WHERE repeat_group_id = ? AND is_deleted = FALSE
    `;
    const [result] = await pool.query(sql, [updated_by, repeat_group_id]);
    return result.affectedRows;
};

/**
 * 자동 미루기 실행
 * - is_carried_over = TRUE 이고 is_done = FALSE 인 todo 중
 *   due_date가 오늘보다 과거인 것들을 +1일로 업데이트
 */
exports.carryOverTodos = async () => {
    const sql = `
        UPDATE todos
        SET due_date = DATE_ADD(due_date, INTERVAL 1 DAY)
        WHERE is_carried_over = TRUE
          AND is_done = FALSE
          AND is_deleted = FALSE
          AND due_date < CURDATE()
    `;
    const [result] = await pool.query(sql);
    return result.affectedRows; // 미뤄진 todo 개수
};