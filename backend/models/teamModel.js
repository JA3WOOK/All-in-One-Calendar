const pool = require("../config/db");

// 그룹명 중복 확인
exports.checkGroupNameExists = async (user_id, team_name) => {
    try {
        const sql = `
            select count(*) as count
            from teams
            where created_by = ? and team_name = ? and is_deleted = false
        `;
        // deleted된 팀은 중복 체크에서 제외하기 위해 is_deleted = false 조건 추가
        const [rows] = await pool.query(sql, [user_id, team_name]);
        return rows[0].count > 0;
    } catch (err) {
        console.error("그룹명 중복 체크 에러:", err.message);
        throw err;
    }
};

// 그룹 생성
exports.create = async (team,created_by) => {
    try {
        const teamsql = `
            insert into teams
                (team_color,team_name,description,created_by)
            values (?,?,?,?)
        `;

        const [teamresult] = await pool.query(teamsql,[
            team.team_color,
            team.team_name,
            team.description || null,
            created_by
        ]);

        // 그룹 멤버 목록에 생성자 등록
        const newteamId = teamresult.insertId;

        const membersql = `
            insert into team_members (team_id,user_id,role)
            values (?,?,'OWNER');
        `;
        await pool.query(membersql, [newteamId, created_by]);
        console.log("멤버 등록 완료");
        return teamresult;
    } catch(err) {
        console.error("에러 발생",err.message);
        throw err;
    }

}

//내그룹 목록 조회
exports.findMyTeam = async(user_id) => {
    try {
        const sql = `
        select t.team_id,
        t.team_name, 
        t.team_color, 
        t.description, 
        tm.role,
        (select count(*) 
         from team_members tm2 
         where tm2.team_id = t.team_id and tm2.is_deleted = false) as member_count
         from teams t
         inner join team_members tm on t.team_id = tm.team_id
         where tm.user_id = ? and tm.is_deleted = false and t.is_deleted = false
        `;
        const [rows] = await pool.query(sql, [user_id]);
        return rows;
    } catch (err) {
        throw err;
    }
}

// 그룹 수정
exports.update = async(team_id,team,updated_by) => {
    const sql = `
        update teams
        set team_color=?,team_name=?,description=?,updated_by=?
        where team_id=?
    `;

    const [result] = await pool.query(sql,[
        team.team_color,
        team.team_name,
        team.description || null,
        updated_by,
        team_id
    ])
    return result;
}

// 그룹 삭제
exports.remove = async(team_id) => {
    const sql = `
        update teams
        set is_deleted=true
        where team_id=?
    `;
    const [result] = await pool.query(sql, [team_id]);
    return result;
}

// 선택한 그룹에서 멤버 조회
exports.findTeamMembers = async(team_id) => {
    try {
        const sql = `
            select u.user_id,u.profile_image,u.name,tm.role
            from team_members tm
                     inner join users u on tm.user_id = u.user_id
            WHERE tm.team_id = ? AND tm.is_deleted = false
            ORDER BY (CASE WHEN tm.role = 'OWNER' THEN 1 ELSE 2 END), u.name ASC
        `;
        const [rows] = await pool.query(sql, [team_id]);
        return rows;
    } catch (err) {
        throw err;
    }
}