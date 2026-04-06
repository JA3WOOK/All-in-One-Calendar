// 무조건 최상단에 추가! (이게 없으면 process.env.GOOGLE_API_KEY를 못 읽어서 401이 뜹니다)
require('dotenv').config();

//요청 접수 (조회/생성/수정/삭제)
const axios = require('axios');
const scheduleModel = require('../models/scheduleModel');
const db = require('../config/db');

// 구글 공휴일 정보를 가져오는 헬퍼 함수
const fetchHolidays = async () => {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    // # 문자를 서버가 안전하게 보낼 수 있도록 인코딩!
    const CALENDAR_ID = encodeURIComponent('ko.south_korea#holiday@group.v.calendar.google.com');

    // 1. 현재 연도 계산 (예: 2026)
    const currentYear = new Date().getFullYear();

    // 2. 올해 1월 1일부터 12월 31일까지로 범위 자동 설정
    const timeMin = `${currentYear}-01-01T00:00:00Z`;
    const timeMax = `${currentYear}-12-31T23:59:59Z`;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${process.env.GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}`;

    console.log("구글 API 호출 시도 중...");
    const response = await axios.get(url);
    console.log("구글 데이터 수신 성공!"); // 성공 로그 추가

    // FullCalendar 형식에 맞게 가공
    return response.data.items.map(item => ({
      id: `holiday-${item.id}`, // DB 아이디와 겹치지 않게 접두사 추가
      title: item.summary,
      start: item.start.date,
      allDay: true,
      backgroundColor: '#ff9f89', // 공휴일 전용 색상 (연한 주황/빨강)
      borderColor: '#ff9f89',
      editable: false, // 공휴일은 수정 못하게 막기
      extendedProps: { type: 'holiday' }
    }));
  } catch (err) {
    console.error("구글 API 호출 실패:", err.message);
    return []; // 실패해도 빈 배열을 돌려주어 서비스는 돌아가게 함
  }
};

const getSchedules = async (req, res) => {
  try {
    // 1. DB 일정과 구글 공휴일을 동시에(Parallel) 기다립니다. (속도 향상)
    const [rows, holidays] = await Promise.all([
      scheduleModel.getAllSchedules(),
      fetchHolidays()
    ]);

    console.log("DB 데이터 개수:", rows.length);
    console.log("공휴일 데이터 개수:", holidays.length);
    // 2. 두 배열을 하나로 합칩니다.
    const combinedSchedules = [...rows, ...holidays];

    // 3. 합쳐진 데이터를 응답합니다.
    res.status(200).json(combinedSchedules);
  } catch (err) {
    console.error("데이터 조회 실패:", err);
    res.status(500).json({ error: "일정을 불러오는 중 서버 에러 발생" });
  }
};

const createSchedule = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. 데이터 구조 분해
    const { 
      title, 
      description, 
      start_at, 
      end_at, 
      category,     // self_dev, work, hobby, exercise, etc
      priority,     // LOW, MEDIUM, HIGH
      team_id, 
      location,     // { name, address, lat, lng }
      user_id 
    } = req.body;

    // 인증된 사용자 ID가 없으면 넘겨받은 user_id나 기본값 1 사용
    const current_user = (req.user && req.user.id) || user_id || 1;

    let location_id = null;

    // 2. 장소 정보 저장 (locations 테이블)
    if (location && location.address) {
      const [locResult] = await connection.query(
        "INSERT INTO locations (location_name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
        [location.name || title, location.address, location.lat || null, location.lng || null]
      );
      location_id = locResult.insertId;
    }

    // 3. 제약 조건(chk_sche_PorG) 처리
    // 팀 일정이면 user_id는 NULL, 개인 일정이면 team_id는 NULL
    const final_user_id = team_id ? null : current_user;
    const final_team_id = team_id || null;

    // 4. 일정 생성 (schedules 테이블)
    const [schResult] = await connection.query(
      `INSERT INTO schedules 
      (title, description, start_at, end_at, category, priority, user_id, team_id, location_id, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || "",
        start_at,
        end_at,
        category || "etc",      // 명세서 ENUM 소문자 기준
        priority || "MEDIUM", 
        final_user_id,
        final_team_id,
        location_id,
        current_user            // created_by 필수값
      ]
    );

    await connection.commit();
    res.status(201).json({ success: true, scheduleId: schResult.insertId });

  } catch (error) {
    await connection.rollback();
    console.error("일정 생성 에러:", error);
    res.status(500).json({ error: "일정 저장 중 오류가 발생했습니다.", details: error.message });
  } finally {
    connection.release();
  }
};

//일정 수정
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

//일정 삭제
const removeSchedule = async (req, res) => {
  const { id } = req.params;
  // user_id가 꼭 필요한 로직이 아니라면 이 줄을 지우거나, body가 없을 때를 대비해 기본값을 줍니다.
  const user_id = req.body?.user_id || 1;

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


