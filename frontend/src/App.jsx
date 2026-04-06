import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import CreateModal from './components/Todo/CreateModal.jsx';
import API from './api/axios';
import './App.css';

// ── 임시 로그인 유저 (인증 구현 전 테스트용) ──────────
const TEMP_USER_ID = 1;

// 팀 색상 팔레트 (priority/personal 베이지 색상 제외)
const TEAM_COLOR_PALETTE = [
    '#4a80c4','#1e88e5','#0097a7','#00acc1','#00897b',
    '#7c3aed','#9c27b0','#d81b60','#e53935','#f4511e',
    '#e67e22','#546e7a','#37474f','#6d4c41','#ff7043',
    '#43a047','#558b2f','#1565c0','#6a1b9a','#ad1457',
];

function App() {
    const [dbEvents, setDbEvents]               = useState([]);
    const [mainDate, setMainDate]               = useState(new Date());
    const [miniDate, setMiniDate]               = useState(new Date());

    // ── 모달 상태 ─────────────────────────────────────
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGroupModalOpen,  setIsGroupModalOpen]  = useState(false);
    const [newGroupName,      setNewGroupName]      = useState('');
    const [newGroupColor,     setNewGroupColor]     = useState('#4a80c4');
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);

    // ── 선택된 날짜 / 이벤트 ──────────────────────────
    const [selectedDate,  setSelectedDate]  = useState(""); // 달력 날짜 클릭 시
    const [selectedEvent, setSelectedEvent] = useState(null); // 이벤트 클릭 시

    // ── 팀 / 팀 멤버 ──────────────────────────────────
    const [teams,       setTeams]       = useState([]);
    const [teamMembers, setTeamMembers] = useState({}); // { [team_id]: [...members] }

    // ── Todo 이벤트 ───────────────────────────────────
    const [todoEvents, setTodoEvents] = useState([]);

    // ── 뷰 / 사이드바 ─────────────────────────────────
    const [currentView,    setCurrentView]    = useState('dayGridMonth');
    const [isGroupOpen,    setIsGroupOpen]    = useState(true);
    const [isPersonalOpen, setIsPersonalOpen] = useState(true);

    const [filters, setFilters] = useState({
        personal: true,
        teams: {},
        holidays: true,
    });

    const calendarRef = useRef(null);

    // ── 1. 일정 목록 불러오기 ──────────────────────────
    const fetchSchedules = () => {
        fetch('http://localhost:3001/api/schedules')
            .then((res) => res.json())
            .then((data) => {
                const formatted = data.map((item) => {
                    if (item.id && String(item.id).startsWith('holiday')) {
                        return {
                            id: item.id,
                            title: item.title,
                            start: item.start,
                            backgroundColor: 'transparent',
                            textColor: '#ff4d4f',
                            borderColor: 'transparent',
                            allDay: true,
                            display: 'block',
                        };
                    }
                    return {
                        id: item.sched_id,
                        title: item.title,
                        start: item.start_at,
                        end: item.end_at,
                        backgroundColor: item.team_id ? '#85a5ff' : '#73d13d',
                        borderColor: 'transparent',
                        textColor: '#ffffff',
                        extendedProps: { ...item },
                    };
                });
                setDbEvents(formatted);
            })
            .catch((err) => console.error("일정 로딩 에러:", err));
    };

    // ── 1-1. 팀 목록 불러오기 ─────────────────────────
    const fetchTeams = () => {
        fetch('http://localhost:3001/api/teams')
            .then((res) => res.json())
            .then((data) => {
                setTeams(data);
                const initialTeamFilters = {};
                // String key로 통일 → getTeamFilter의 String(team_id) 와 일치
                data.forEach((team) => { initialTeamFilters[String(team.team_id)] = true; });
                setFilters((prev) => ({ ...prev, teams: initialTeamFilters }));

                // 팀 데이터 로드 완료 후 현재 달 Todo를 즉시 조회
                // (data를 직접 넘겨 stale closure 방지)
                const now = new Date();
                const calApi = calendarRef.current?.getApi();
                const d = calApi ? calApi.getDate() : now;
                fetchTodosForMonth(d.getFullYear(), d.getMonth() + 1, data);
            })
            .catch((err) => console.error("팀 로딩 에러:", err));
    };

    // ── 1-2. 팀 멤버 불러오기 (CreateModal 셀렉박스용) ─
    const fetchTeamMembers = async (team_id) => {
        if (teamMembers[team_id]) return; // 이미 불러왔으면 skip
        try {
            const res = await API.get(`/api/todos/team/${team_id}/members`);
            setTeamMembers((prev) => ({ ...prev, [team_id]: res.data.data ?? [] }));
        } catch (err) {
            console.error("팀 멤버 로딩 에러:", err);
        }
    };

    // ── 1-3. 월별 Todo 불러오기 ──────────────────────
    // teamList를 직접 인자로 받아 클로저 stale 문제를 방지합니다.
    const PRIORITY_COLOR = { HIGH: '#c94f4f', MEDIUM: '#c8952a', LOW: '#5a9e6f' };

    const fetchTodosForMonth = async (year, month, teamList = []) => {
        try {
            // 개인 Todo
            const personalRes = await API.get('/api/todos/calendar', {
                params: { year, month },
            });
            const personalGrouped = personalRes.data?.data ?? {};

            // 팀 Todo (팀별 병렬 호출, team_color도 함께 전달)
            const teamResults = await Promise.all(
                teamList.map((team) =>
                    API.get('/api/todos/calendar', { params: { year, month, team_id: team.team_id } })
                        .then((r) => ({ team_id: team.team_id, team_color: team.team_color ?? null, data: r.data?.data ?? {} }))
                        .catch(() => ({ team_id: team.team_id, team_color: team.team_color ?? null, data: {} }))
                )
            );

            // grouped { "YYYY-MM-DD": [todo,...] }  →  FullCalendar event 배열
            // ※ team_id / team_color 를 마지막에 명시해 ...todo 덮어쓰기 방지
            const BEIGE_BG     = '#fef3e2'; // 개인 todo 고정 베이지 배경
            const BEIGE_BORDER = '#c8952a'; // 개인 todo 고정 베이지 border

            const toEvents = (grouped, team_id = null, team_color = null) =>
                Object.entries(grouped).flatMap(([date, todos]) =>
                    todos.map((todo) => {
                        const isTeam = !!team_id;
                        const bg     = isTeam ? (team_color ?? '#4a80c4') + '22' : BEIGE_BG;
                        const border = isTeam ? (team_color ?? '#4a80c4')         : BEIGE_BORDER;
                        return {
                            id:              `todo-${todo.todo_id}`,
                            title:           todo.content,
                            start:           date,
                            allDay:          true,
                            backgroundColor: bg,
                            borderColor:     border,
                            textColor:       '#2d2d2d',
                            extendedProps: {
                                ...todo,
                                eventType:  'todo',
                                isDone:     !!todo.is_done,
                                priority:   todo.priority,
                                category:   todo.category,
                                team_id:    team_id ?? todo.team_id ?? null,
                                team_color: team_color ?? null,
                            },
                        };
                    })
                );

            const personal = toEvents(personalGrouped, null, null);
            const team     = teamResults.flatMap(({ team_id, team_color, data }) =>
                toEvents(data, team_id, team_color)
            );
            setTodoEvents([...personal, ...team]);
        } catch (err) {
            console.error('[fetchTodosForMonth] 에러:', err);
        }
    };

    useEffect(() => {
        fetchSchedules();
        fetchTeams();
    }, []);

    // ── 2. 미니 달력 ──────────────────────────────────
    const handleMiniPrev = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1));
    const handleMiniNext = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1));

    const renderMiniDays = () => {
        const year     = miniDate.getFullYear();
        const month    = miniDate.getMonth();
        const lastDay  = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();
        const days     = [];

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="mini-day empty" />);
        }

        for (let d = 1; d <= lastDay; d++) {
            const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents  = dbEvents.filter((e) => e.start && e.start.startsWith(currentStr));
            const hasPersonal = dayEvents.some((e) => !e.extendedProps?.team_id);
            const hasTeam     = dayEvents.some((e) => e.extendedProps?.team_id && !e.extendedProps?.is_study);
            const hasStudy    = dayEvents.some((e) => e.extendedProps?.is_study);

            days.push(
                <div
                    key={d}
                    className="mini-day"
                    onClick={() => calendarRef.current.getApi().gotoDate(new Date(year, month, d))}
                >
                    <span className="day-number">{d}</span>
                    <div className="mini-dot-container">
                        {hasPersonal && <span className="mini-dot personal-dot" />}
                        {hasTeam     && <span className="mini-dot team-dot" />}
                        {hasStudy    && <span className="mini-dot study-dot" />}
                    </div>
                </div>
            );
        }
        return days;
    };

    // ── 3. 달력 날짜 클릭 → CreateModal 열기 ─────────
    const handleDateClick = (info) => {
        setSelectedDate(info.dateStr); // 'YYYY-MM-DD'
        setSelectedEvent(null);
        setIsCreateModalOpen(true);
    };

    // ── 4. 기존 이벤트 클릭 → EditModal (CreateModal 수정 모드) ────────
    const handleEventClick = (info) => {
        if (info.event.id && String(info.event.id).startsWith('holiday')) return;
        const ep = info.event.extendedProps ?? {};

        if (ep.eventType === 'todo') {
            // ── Todo ─────────────────────────────────────────────────────
            setSelectedEvent({
                type:          'todo',
                id:            ep.todo_id,
                scope:         ep.team_id ? 'team' : 'personal',
                content:       ep.content       ?? info.event.title,
                dueDate:       ep.due_date      ? String(ep.due_date).slice(0, 10) : "",
                category:      ep.category      ?? "",
                priority:      ep.priority      ?? "MEDIUM",
                isCarriedOver: !!ep.is_carried_over,
                isRepeat:      !!ep.is_repeat,
                repeatType:    ep.repeat_type   ?? "weekly",
                repeatInterval:ep.repeat_interval ?? 1,
                repeatEndAt:   ep.repeat_end_at ? String(ep.repeat_end_at).slice(0, 10) : "",
                repeatGroupId: ep.repeat_group_id ?? null,
                teamId:        ep.team_id       ?? null,
                assignBy:      ep.assign_by     ?? null,
                isDone:        !!ep.is_done,
            });
        } else {
            // ── Schedule ─────────────────────────────────────────────────
            setSelectedEvent({
                type:        'schedule',
                id:          ep.sched_id ?? info.event.id,
                scope:       ep.team_id ? 'team' : 'personal',
                title:       info.event.title,
                startAt:     info.event.startStr.slice(0, 16),
                endAt:       info.event.end ? info.event.endStr.slice(0, 16) : info.event.startStr.slice(0, 16),
                description: ep.description ?? "",
                location:    ep.location    ?? "",
                category:    ep.category    ?? "",
                priority:    ep.priority    ?? "MEDIUM",
                isRepeat:    false,
                teamId:      ep.team_id    ?? null,
            });
        }
        setIsEditModalOpen(true);
    };

    // ── 5. CreateModal 제출 처리 ──────────────────────
    //   data.type === "schedule" | "todo"
    //   data.scope === "personal" | "team"
    const handleCreateSubmit = async (data) => {
        try {
            if (data.type === "schedule") {
                // ── 일정 생성 (scheduleController) ──────────
                const body = {
                    title:       data.title,
                    start_at:    data.startAt,
                    end_at:      data.endAt,
                    description: data.description  || "",
                    priority:    data.priority     || "MEDIUM",
                    category:    data.category     || "ETC",
                    user_id:     TEMP_USER_ID,
                    team_id:     data.teamId       || null,
                    updated_by:  TEMP_USER_ID,
                };
                await fetch('http://localhost:3001/api/schedules', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(body),
                });
                fetchSchedules();

            } else {
                // ── Todo 생성 (todoController) ───────────────
                const todoBody = {
                    content:        data.content,
                    dueDate:        data.dueDate        || null,
                    priority:       data.priority       || "MEDIUM",
                    category:       data.category       || "ETC",
                    isCarriedOver:  data.isCarriedOver  || false,
                    isRepeat:       data.isRepeat       || false,
                    repeatType:     data.repeatType     || null,
                    repeatInterval: data.repeatInterval || 1,
                    repeatEndAt:    data.repeatEndAt    || null,
                    user_id:        TEMP_USER_ID,       // 인증 없을 때 컨트롤러 fallback용
                };

                if (data.scope === "team" && data.teamId) {
                    await API.post(`/api/todos/team/${data.teamId}`, {
                        ...todoBody,
                        assignBy: data.assignBy || null,
                    });
                } else {
                    await API.post('/api/todos/personal', todoBody);
                }
                // Todo 저장 후 현재 달 목록 갱신
                fetchTodosForMonth(mainDate.getFullYear(), mainDate.getMonth() + 1, teams);
            }
        } catch (err) {
            console.error("저장 에러:", err);
            alert("저장에 실패했습니다.");
        }
    };

    // ── 6. 수정 저장 (schedule PUT / todo PATCH) ─────────────────────
    const handleEditSubmit = async (data) => {
        try {
            if (data.type === 'schedule') {
                await fetch(`http://localhost:3001/api/schedules/${data.id}`, {
                    method:  'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title:       data.title,
                        start_at:    data.startAt,
                        end_at:      data.endAt,
                        description: data.description || "",
                        location:    data.location    || "",
                        priority:    data.priority    || "MEDIUM",
                        category:    data.category    || "ETC",
                        updated_by:  TEMP_USER_ID,
                    }),
                });
                fetchSchedules();
            } else {
                // todo PATCH
                const body = {
                    content:       data.content,
                    dueDate:       data.dueDate       || null,
                    priority:      data.priority      || "MEDIUM",
                    category:      data.category      || "ETC",
                    isCarriedOver: data.isCarriedOver ?? false,
                    isDone:        data.isDone        ?? false,
                    isRepeat:      data.isRepeat      ?? false,
                    repeatType:    data.repeatType    || null,
                    repeatInterval:data.repeatInterval || 1,
                    repeatEndAt:   data.repeatEndAt   || null,
                    assignBy:      data.assignBy      || null,
                    user_id:       TEMP_USER_ID,
                };
                await API.patch(`/api/todos/${data.id}`, body);
                fetchTodosForMonth(mainDate.getFullYear(), mainDate.getMonth() + 1, teams);
            }
        } catch (err) {
            console.error("수정 에러:", err);
            alert("수정에 실패했습니다.");
        }
    };

    // ── 7. 삭제 (schedule DELETE / todo soft-delete) ──────────────────
    const handleDeleteEvent = async (data) => {
        try {
            if (data.type === 'schedule') {
                await fetch(`http://localhost:3001/api/schedules/${data.id}`, { method: 'DELETE' });
                fetchSchedules();
            } else {
                const params = data.scope === 'group' ? '?scope=group' : '';
                await API.delete(`/api/todos/${data.id}${params}`);
                fetchTodosForMonth(mainDate.getFullYear(), mainDate.getMonth() + 1, teams);
            }
        } catch (err) {
            console.error("삭제 에러:", err);
            alert("삭제에 실패했습니다.");
        }
    };

    // ── 8. 그룹 저장 ─────────────────────────────────
    const handleSaveGroup = () => {
        if (!newGroupName.trim()) { alert('그룹 이름을 입력해주세요.'); return; }
        fetch('http://localhost:3001/api/teams', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name: newGroupName.trim(), team_color: newGroupColor, user_id: TEMP_USER_ID }),
        })
            .then((res) => { if (!res.ok) throw new Error('그룹 생성 실패'); return res.json(); })
            .then(() => {
                setIsGroupModalOpen(false);
                setNewGroupName('');
                setNewGroupColor('#4a80c4');
                fetchTeams();
            })
            .catch((err) => alert(err.message));
    };

    // ── 9. 필터링 ─────────────────────────────────────
    // team_id → String 변환으로 타입 불일치 방지
    // filters.teams 에 없는 팀은 기본적으로 표시(true)
    const getTeamFilter = (team_id) => {
        if (!team_id) return null; // 팀 이벤트 아님
        const key = String(team_id);
        return key in filters.teams ? filters.teams[key] : true;
    };

    const filteredSchedules = dbEvents.filter((event) => {
        if (event.id && String(event.id).startsWith('holiday')) return filters.holidays;
        const teamFilter = getTeamFilter(event.extendedProps?.team_id);
        if (teamFilter !== null) return teamFilter;
        return filters.personal;
    });

    const filteredTodos = todoEvents.filter((event) => {
        const teamFilter = getTeamFilter(event.extendedProps?.team_id);
        if (teamFilter !== null) return teamFilter;
        return filters.personal;
    });

    const filteredEvents = [...filteredSchedules, ...filteredTodos];

    // ── renderEventContent: 일정 vs Todo 구분 렌더링 ──
    const PRIORITY_LABEL = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' };
    const PRIORITY_TEXT_COLOR = { HIGH: '#c94f4f', MEDIUM: '#555', LOW: '#5a9e6f' };

    const renderEventContent = (eventInfo) => {
        const { eventType, isDone, priority, team_color } = eventInfo.event.extendedProps ?? {};

        if (eventType === 'todo') {
            const borderColor = eventInfo.event.borderColor;
            const prioLabel   = PRIORITY_LABEL[priority] ?? '';
            const prioTextCol = PRIORITY_TEXT_COLOR[priority] ?? '#555';

            return (
                <div style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    gap:            4,
                    padding:        '1px 4px 1px 5px',
                    borderRadius:   4,
                    fontSize:       11,
                    lineHeight:     1.4,
                    overflow:       'hidden',
                    cursor:         'pointer',
                    background:     eventInfo.event.backgroundColor,
                    borderLeft:     `3px solid ${borderColor}`,
                    color:          isDone ? '#aaa' : '#333',
                    textDecoration: isDone ? 'line-through' : 'none',
                    width:          '100%',
                    boxSizing:      'border-box',
                }}>
                    {/* 왼쪽: 체크박스 + 제목 */}
                    <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', flex:1, minWidth:0 }}>
            <span style={{ fontSize: 10, flexShrink: 0, color: borderColor }}>
              {isDone ? '☑' : '☐'}
            </span>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {eventInfo.event.title}
            </span>
                    </div>
                    {/* 오른쪽: 강도 텍스트 */}
                    {prioLabel && (
                        <span style={{
                            flexShrink:  0,
                            fontSize:    9,
                            fontWeight:  600,
                            color:       isDone ? '#bbb' : prioTextCol,
                            letterSpacing: '0.02em',
                            marginLeft:  2,
                        }}>
              {prioLabel}
            </span>
                    )}
                </div>
            );
        }

        // 일반 일정 (pill 스타일)
        return (
            <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          4,
                padding:      '2px 6px',
                borderRadius: 4,
                fontSize:     11,
                lineHeight:   1.3,
                overflow:     'hidden',
                width:        '100%',
                boxSizing:    'border-box',
                background:   eventInfo.event.backgroundColor,
                color:        eventInfo.event.textColor ?? '#fff',
            }}>
                {eventInfo.timeText && (
                    <span style={{ flexShrink: 0, opacity: 0.85 }}>{eventInfo.timeText}</span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {eventInfo.event.title}
        </span>
            </div>
        );
    };

    // ─────────────────────────────────────────────────
    return (
        <div className="container">
            <aside className="sidebar">
                {/* 미니 달력 */}
                <div className="mini-calendar-card">
                    <div className="mini-header">
                        <ChevronLeft size={16} className="cursor-pointer" onClick={handleMiniPrev} />
                        <strong className="mini-month-name">
                            {miniDate.toLocaleString('en-US', { month: 'long' })}
                        </strong>
                        <ChevronRight size={16} className="cursor-pointer" onClick={handleMiniNext} />
                    </div>
                    <div className="mini-grid">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                            <div key={`${d}-${i}`} className="mini-day-label">{d}</div>
                        ))}
                        {renderMiniDays()}
                    </div>
                </div>

                {/* 그룹 섹션 */}
                <div className="category-section">
                    <div className="category-header" onClick={() => setIsGroupOpen(!isGroupOpen)}>
                        <span>그룹</span>
                        <div className="header-icons">
                            <Plus
                                size={14}
                                className="cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); setIsGroupModalOpen(true); }}
                            />
                            <span className={`arrow ${isGroupOpen ? 'up' : 'down'}`}>▲</span>
                        </div>
                    </div>
                    {isGroupOpen && (
                        <div className="category-list">
                            {teams.map((team, idx) => {
                                const checked = filters.teams[String(team.team_id)] || false;
                                const color   = team.team_color ?? '#4a80c4';
                                return (
                                    <div
                                        key={team.team_id}
                                        className="category-item"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                teams: { ...prev.teams, [String(team.team_id)]: !prev.teams[String(team.team_id)] },
                                            }))
                                        }
                                    >
                                        {/* 커스텀 체크박스 */}
                                        <span style={{
                                            display:        'inline-flex',
                                            alignItems:     'center',
                                            justifyContent: 'center',
                                            width:          16,
                                            height:         16,
                                            borderRadius:   4,
                                            border:         `2px solid ${checked ? color : '#ccc'}`,
                                            background:     checked ? color : '#fff',
                                            flexShrink:     0,
                                            transition:     'all 0.15s',
                                        }}>
                      {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                      )}
                    </span>
                                        <span style={{ color: checked ? '#2d2d2d' : '#9ca3af', transition: 'color 0.15s' }}>
                      {team.team_name}
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 개인 섹션 */}
                <div className="category-section">
                    <div className="category-header" onClick={() => setIsPersonalOpen(!isPersonalOpen)}>
                        <span>개인</span>
                        <span className={`arrow ${isPersonalOpen ? 'up' : 'down'}`}>▲</span>
                    </div>
                    {isPersonalOpen && (
                        <div className="category-list">
                            <div
                                className="category-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setFilters((prev) => ({ ...prev, personal: !prev.personal }))}
                            >
                <span style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          16,
                    height:         16,
                    borderRadius:   4,
                    border:         `2px solid ${filters.personal ? '#22c55e' : '#ccc'}`,
                    background:     filters.personal ? '#22c55e' : '#fff',
                    flexShrink:     0,
                    transition:     'all 0.15s',
                }}>
                  {filters.personal && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  )}
                </span>
                                <span style={{ color: filters.personal ? '#2d2d2d' : '#9ca3af', transition: 'color 0.15s' }}>
                  개인 일정
                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <h2 className="main-month-title">
                        {mainDate.getFullYear()}년 {mainDate.getMonth() + 1}월
                    </h2>
                    <div className="button-group">
                        <button className="btn-outline" onClick={() => setIsGroupModalOpen(true)}>그룹 생성</button>
                        <button
                            className="btn-outline"
                            onClick={() => { setSelectedDate(""); setSelectedEvent(null); setIsCreateModalOpen(true); }}
                        >
                            일정 생성
                        </button>
                    </div>
                </header>

                <div className="calendar-wrapper" style={{ position: "relative" }}>
                    {/* 뷰 전환 버튼 — 달력 바로 위 오른쪽에 절대 배치 */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0,
                        display: 'flex', gap: 2,
                        background: '#f1f3f4', borderRadius: 8, padding: 3,
                        zIndex: 5,
                    }}>
                        {[
                            { view: 'timeGridDay',  label: '일간' },
                            { view: 'timeGridWeek', label: '주간' },
                            { view: 'dayGridMonth', label: '월간' },
                        ].map(({ view, label }) => (
                            <button
                                key={view}
                                onClick={() => { calendarRef.current.getApi().changeView(view); setCurrentView(view); }}
                                style={{
                                    padding:      '5px 14px',
                                    borderRadius:  6,
                                    border:        'none',
                                    cursor:        'pointer',
                                    fontSize:      13,
                                    fontWeight:    currentView === view ? 600 : 400,
                                    background:    currentView === view ? '#fff' : 'transparent',
                                    color:         currentView === view ? '#3c4043' : '#5f6368',
                                    boxShadow:     currentView === view ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                                    transition:    'all 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                        initialView="dayGridMonth"
                        locale="ko"
                        headerToolbar={{ left: 'prev,next today', center: '', right: '' }}
                        height="82vh"
                        events={filteredEvents}
                        eventClick={handleEventClick}
                        dateClick={handleDateClick}
                        eventContent={renderEventContent}           // ← 날짜 클릭 시 CreateModal 오픈
                        datesSet={(arg) => {
                            const d = arg.view.currentStart;
                            setMainDate(d);
                            // teams는 setTeams로 최신 값이 업데이트되어 있으므로 직접 전달
                            fetchTodosForMonth(d.getFullYear(), d.getMonth() + 1, teams);
                        }}
                        dayMaxEvents={true}
                    />
                </div>
            </main>

            {/* ── CreateModal (날짜 클릭 / 일정 생성 버튼) ── */}
            {isCreateModalOpen && (
                <CreateModal
                    defaultDate={selectedDate}
                    teams={teams}
                    teamMembers={teamMembers}
                    onTeamSelect={fetchTeamMembers}
                    onClose={() => { setIsCreateModalOpen(false); setSelectedDate(""); }}
                    onSubmit={handleCreateSubmit}
                />
            )}

            {/* ── 수정/삭제 모달 (CreateModal 수정 모드) ── */}
            {isEditModalOpen && selectedEvent && (
                <CreateModal
                    initialData={selectedEvent}
                    teams={teams}
                    teamMembers={teamMembers}
                    onTeamSelect={fetchTeamMembers}
                    onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
                    onSubmit={handleEditSubmit}
                    onDelete={handleDeleteEvent}
                />
            )}

            {/* ── 그룹 생성 모달 ── */}
            {isGroupModalOpen && (
                <div style={{
                    position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
                    display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
                }}
                     onClick={(e) => e.target === e.currentTarget && setIsGroupModalOpen(false)}
                >
                    <div style={{
                        background:'#fff', borderRadius:12, width:400,
                        boxShadow:'0 4px 24px rgba(0,0,0,0.14)', padding:'24px 24px 20px',
                    }}>
                        {/* 헤더 */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                            <span style={{ fontSize:16, fontWeight:600, color:'#2d2d2d' }}>👥 새 그룹 추가</span>
                            <button onClick={() => setIsGroupModalOpen(false)} style={{
                                background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af', lineHeight:1,
                            }}>×</button>
                        </div>

                        {/* 그룹 이름 */}
                        <label style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>그룹 이름</label>
                        <input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="예: 개발팀, 스터디 모임"
                            style={{
                                display:'block', width:'100%', boxSizing:'border-box',
                                marginTop:6, marginBottom:20,
                                padding:'9px 12px', borderRadius:8,
                                border:'1px solid rgba(0,0,0,0.12)',
                                fontSize:14, outline:'none',
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveGroup()}
                        />

                        {/* 팀 색상 선택 */}
                        <label style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>팀 색상</label>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8, marginBottom:6 }}>
                            {TEAM_COLOR_PALETTE.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewGroupColor(color)}
                                    title={color}
                                    style={{
                                        width:28, height:28, borderRadius:'50%',
                                        background:color, border:'none', cursor:'pointer',
                                        outline: newGroupColor === color ? `3px solid ${color}` : '3px solid transparent',
                                        outlineOffset:2,
                                        transform: newGroupColor === color ? 'scale(1.15)' : 'scale(1)',
                                        transition:'transform 0.1s',
                                        boxShadow: newGroupColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        {/* 직접 입력 */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, marginBottom:20 }}>
                            <div style={{
                                width:28, height:28, borderRadius:'50%',
                                background:newGroupColor, border:'1px solid rgba(0,0,0,0.1)', flexShrink:0,
                            }} />
                            <input
                                type="text"
                                value={newGroupColor}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setNewGroupColor(v);
                                }}
                                placeholder="#hex"
                                maxLength={7}
                                style={{
                                    flex:1, padding:'6px 10px', borderRadius:6,
                                    border:'1px solid rgba(0,0,0,0.12)',
                                    fontSize:13, outline:'none', letterSpacing:'0.05em',
                                    fontFamily:'monospace',
                                }}
                            />
                            <input
                                type="color"
                                value={newGroupColor.length === 7 ? newGroupColor : '#4a80c4'}
                                onChange={(e) => setNewGroupColor(e.target.value)}
                                style={{ width:36, height:36, borderRadius:6, border:'1px solid rgba(0,0,0,0.12)', cursor:'pointer', padding:2 }}
                                title="색상 직접 선택"
                            />
                        </div>

                        {/* 버튼 */}
                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                            <button
                                onClick={() => setIsGroupModalOpen(false)}
                                style={{
                                    padding:'8px 16px', borderRadius:8, border:'1px solid rgba(0,0,0,0.12)',
                                    background:'none', color:'#6b7280', fontSize:13, cursor:'pointer',
                                }}
                            >취소</button>
                            <button
                                onClick={handleSaveGroup}
                                style={{
                                    padding:'8px 20px', borderRadius:8, border:'none',
                                    background:newGroupColor.length === 7 ? newGroupColor : '#4a80c4',
                                    color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
                                }}
                            >저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;