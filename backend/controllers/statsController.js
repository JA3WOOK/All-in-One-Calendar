const statsModel = require("../models/statsModel");

exports.getDashboardStats = async (req, res) => {
  try {
    // JWT 토큰이 있으면 req.user.user_id를, 없으면 프론트에서 보낸 userId를 사용
    const userId = (req.user && req.user.user_id) ? req.user.user_id : req.query.userId;
    const { filterType = 'all', teamId, startDate, endDate } = req.query;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "필수 파라미터가 누락되었습니다." });
    }

    // 3가지 통계 데이터를 병렬로 한 번에 조회
    const [scheduleData, routineData, detailedSchedules] = await Promise.all([
      statsModel.getTodoStats(userId, filterType, teamId, startDate, endDate),
      statsModel.getRoutineStats(userId, filterType, teamId, startDate, endDate),
      statsModel.getDetailedTodos(userId, filterType, teamId, startDate, endDate)
    ]);

    // 팀 규칙에 맞춘 JSON 응답
    return res.status(200).json({
      success: true,
      message: "통계 데이터 조회 성공",
      data: { scheduleData, routineData, detailedSchedules }
    });
  } catch (error) {
    console.error("통계 API 에러:", error);
    return res.status(500).json({ success: false, message: "통계 데이터를 불러오는 중 오류가 발생했습니다." });
  }
};