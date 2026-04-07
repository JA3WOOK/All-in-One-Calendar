import express from 'express';
import cors from 'cors';
import { getTodoStats, getDetailedTodos } from './services/todoService.js';
import { getRoutineStats } from './services/routineService.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// [UI 매핑] CalendarStatsDashboard.tsx
// - useEffect 내에서 화면 진입/그룹 변경/기간 변경 시 호출되는 단일 엔드포인트
// - 프론트엔드의 세 가지 상태(scheduleData, routineData, detailedSchedules)를 한 번에 채워줌
app.get('/api/stats', async (req, res) => {
  try {
    const { userId, filterType = 'all', teamId, startDate, endDate } = req.query;
    const [scheduleData, routineData, detailedSchedules] = await Promise.all([
      getTodoStats(userId, filterType, teamId, startDate, endDate),
      getRoutineStats(userId, filterType, teamId, startDate, endDate),
      getDetailedTodos(userId, filterType, teamId, startDate, endDate)
    ]);
    res.json({ scheduleData, routineData, detailedSchedules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));