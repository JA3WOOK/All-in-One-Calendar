//요청 접수 (조회/생성/수정/삭제)

const scheduleModel = require('../models/scheduleModel'); 

const getSchedules = async (req, res) => {
    try {
        // 'getAllSchedules'로 호출!
        const rows = await scheduleModel.getAllSchedules();
        res.status(200).json(rows);
    } catch (err) {
        console.error("데이터 조회 실패:", err);
        res.status(500).json({ error: "일정을 불러오는 중 서버 에러 발생" });
    }
};

module.exports = { getSchedules };