const express = require('express');
const { getTodoScheduleData } = require('../services/statsQuery.js');
const { getRoutineData } = require('../services/routineQuery.js');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { userId, teamId, startDate, endDate } = req.query;
    
    const [scheduleData, routineData] = await Promise.all([
      getTodoScheduleData(userId, teamId, startDate, endDate),
      getRoutineData(userId, teamId, startDate, endDate)
      // 상세 일정(getDetailedTodos)도 동일 패턴으로 추가 가능
    ]);

    res.json({ scheduleData, routineData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;