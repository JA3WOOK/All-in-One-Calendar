const pool = require("../config/db");

//멤버 권한 수정
exports.update = async(updateData) => {
    const sql = `
        update team_members
        set role=?
        where team_id=? and user_id=?
    `;

    const[result] = await pool.query(sql,[
        updateData.new_role,
        updateData.team_id,
        updateData.user_id
    ]);
    return result;
}

// 멤버 삭제
exports.remove = async(deleteData) => {
    const sql = `
        update team_members
        set is_deleted=true
        where team_id=? and user_id=?
    `;
    const [result] = await pool.query(sql,[
        deleteData.team_id,
        deleteData.user_id
    ]);
    return result;
}