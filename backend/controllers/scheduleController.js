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

const createSchedule = async (req, res) => {
    try {
        const result = await scheduleModel.createSchedule(req.body);
        res.status(201).json({ message: "일정 등록 성공", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "일정 등록 실패" });
    }
};

const editSchedule = async (req, res) => {
  const { id } = req.params;
  const scheduleData = req.body;

  try {
    const result = await scheduleModel.updateSchedule(id, scheduleData);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "수정할 데이터를 찾지 못했습니다." });
    }

    res.json({ message: "수정 성공!", id });
  } catch (err) {
    console.error("Controller 수정 에러:", err);
    res.status(500).json({ error: "서버 에러" });
  }
};

const removeSchedule = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // 누가 지웠는지 확인용 (나중엔 로그인 정보에서 가져옴)

  try {
    const result = await scheduleModel.deleteSchedule(id, user_id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "삭제할 일정을 찾지 못했습니다." });
    }

    res.json({ message: "일정이 안전하게 삭제(숨김)되었습니다.", id });
  } catch (err) {
    console.error("삭제 컨트롤러 에러:", err);
    res.status(500).json({ error: "서버 에러가 발생했습니다." });
  }
};

module.exports = { getSchedules, createSchedule, editSchedule, removeSchedule };


