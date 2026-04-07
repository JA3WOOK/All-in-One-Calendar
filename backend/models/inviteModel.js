const pool = require('../config/db');

// 초대장 발송
exports.create = async (inviteData) => {
        const sql= `
            insert into invitations
            (team_id,inviter_id,invitee_id)
            values (?,?,?)
        `;
        const [result] = await pool.query(sql,[
            inviteData.team_id, 
            inviteData.inviter_id, 
            inviteData.invitee_id
        ]);
        return result;
}

// 입력된 이메일로 user_id 찾기
exports.getUserByEmail = async (invitee_email) => {
    const sql = `
        select user_id
        from users
        where email=?
    `;
    const [rows] = await pool.query(sql,[invitee_email]);
    return rows[0];
}

// 초대장 발송 여부 , 이미 초대된 id인지 구분
exports.findByTarget = async(team_id,invitee_id) => {
    const sql = `
        select * FROM invitations 
        where team_id=? and invitee_id=? and status = 'PENDING'
    `;
    const [rows] = await pool.query(sql, [team_id, invitee_id]);
    return rows;
}

// 초대장 수락,거절
exports.responseStatus = async(responseData) => {
    const sql = `
        update invitations
        set status=?
        where invite_id=?
    `;

    const [result] = await pool.query(sql,[
        responseData.status,
        responseData.invite_id
    ]);
    return result;
}

//멤버 추가를 위해 invite_id로 team_id,invitee_id 가져오기
exports.getInviteById = async(invite_Id) => {
    const sql = `
        select team_id,invitee_id
        from invitations
        where invite_id=?
    `;
    const [rows] = await pool.query(sql,[invite_Id]);
    return rows[0];
}

// 멤버 등록
exports.addteam_members = async(team_id,invitee_id) => {
    const sql = `
        insert into team_members(team_id,user_id)
        values (?,?)
    `;
    const [result] = await pool.query(sql,[team_id,invitee_id]);
    return result;
}

// 내가 보낸 초대 목록 조회
exports.findSendInviteList = async(inviter_id,team_id) => {
    try {
        const sql = `
            select
            i.invite_id,
            t.team_name,
            u.profile_image as invitee_image,
            u.name as invitee_name,
            i.status,
            i.created_at
            from invitations i
            inner join teams t on i.team_id = t.team_id
            inner join users u on i.invitee_id=u.user_id
            where i.inviter_id =? 
            and i.team_id = ?
            and i.status = 'PENDING'
            order by i.created_at desc
        `;
        const [rows] = await pool.query(sql, [inviter_id,team_id]);
        return rows;
    } catch (err) {
        throw err;
    }
}

// 내가 받은 초대 목록 조회
exports.findReceivedInviteList = async(invitee_id) => {
    const sql = `
        select
        i.invite_id,
        t.team_name,
        u.name as inviter_name,
        i.status,
        i.created_at
        from invitations i
        inner join teams t on i.team_id = t.team_id
        inner join users u on i.inviter_id = u.user_id
        where i.invitee_id=? and i.status = 'PENDING'
        order by i.created_at desc
    `;
    const [rows] = await pool.query(sql, [invitee_id]);
    return rows;
}