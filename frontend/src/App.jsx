import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import CreateModal from './components/Todo/CreateModal.jsx';
import TeamManageModal from './components/Team/TeamManageModal.jsx';
import API from './api/axios';
import './App.css';



// 팀 색상 팔레트 (priority/personal 베이지 색상 제외)
const TEAM_COLOR_PALETTE = [
    '#4a80c4', '#1e88e5', '#0097a7', '#00acc1', '#00897b',
    '#7c3aed', '#9c27b0', '#d81b60', '#e53935', '#f4511e',
    '#e67e22', '#546e7a', '#37474f', '#6d4c41', '#ff7043',
    '#43a047', '#558b2f', '#1565c0', '#6a1b9a', '#ad1457',
];

function App() {
    const navigate = useNavigate();
    // 로그인 유저 ID (렌더링마다 최신값)
    const [dbEvents, setDbEvents] = useState([]);
    const [mainDate, setMainDate] = useState(new Date());
    const [miniDate, setMiniDate] = useState(new Date());

    // ── 모달 상태 ─────────────────────────────────────
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#4a80c4');

    // 팀 수정 모달
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [editTeamName, setEditTeamName] = useState('');
    const [editTeamColor, setEditTeamColor] = useState('#4a80c4');

    // 팀 삭제 확인 모달
    const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
    const [deletingTeam, setDeletingTeam] = useState(null);

    // 사이드바 hover
    const [hoveredTeamId, setHoveredTeamId] = useState(null);

    // 그룹관리 모달
    const [isTeamManageOpen, setIsTeamManageOpen] = useState(false);

    // 통계 섹션 열림 여부
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // ── 선택된 날짜 / 이벤트 ──────────────────────────
    const [selectedDate, setSelectedDate] = useState(""); // 달력 날짜 클릭 시
    const [selectedEvent, setSelectedEvent] = useState(null); // 이벤트 클릭 시

    // ── 팀 / 팀 멤버 ──────────────────────────────────
    const [teams, setTeams] = useState([]);
    const [teamMembers, setTeamMembers] = useState({}); // { [team_id]: [...members] }

    // ── Todo 이벤트 ───────────────────────────────────
    const [todoEvents, setTodoEvents] = useState([]);

    // ── 뷰 / 사이드바 ─────────────────────────────────
    const [currentView, setCurrentView] = useState('dayGridMonth');
    const [isGroupOpen, setIsGroupOpen] = useState(true);
    const [isPersonalOpen, setIsPersonalOpen] = useState(true);

    const [filters, setFilters] = useState({
        personal: true,   // 개인 일정
        personalTodo: true,   // 개인 할일
        teams: {},
        holidays: true,
    });

    const calendarRef = useRef(null);

    // ── 1. 일정 목록 불러오기 ──────────────────────────
    const fetchSchedules = (teamList = []) => {
        API.get('/api/schedules')
            .then((res) => res.data)
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
                        // 개인일정: 베이지(할일과 동일), 팀일정: team_color
                        ...(item.team_id ? (() => {
                            const t = teamList.find(t => String(t.team_id) === String(item.team_id));
                            const tc = t?.team_color ?? '#4a80c4';
                            return { backgroundColor: tc, borderColor: 'transparent', textColor: '#ffffff' };
                        })() : {
                            backgroundColor: '#fef3e2',
                            borderColor: '#c8952a',
                            textColor: '#2d2d2d',
                        }),
                        extendedProps: { ...item },
                    };
                });
                setDbEvents(formatted);
            })
            .catch((err) => console.error("일정 로딩 에러:", err?.response?.data || err.message));
    };

    // ── 1-1. 팀 목록 불러오기 ─────────────────────────
    const fetchTeams = () => {
        API.get('/api/teams')
            .then((res) => res.data)
            .then((data) => {
                setTeams(data);
                fetchSchedules(data); // 팀 색상 적용을 위해 teams 전달
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
            const BEIGE_BG = '#fef3e2'; // 개인 todo 고정 베이지 배경
            const BEIGE_BORDER = '#c8952a'; // 개인 todo 고정 베이지 border

            const toEvents = (grouped, team_id = null, team_color = null) =>
                Object.entries(grouped).flatMap(([date, todos]) =>
                    todos.map((todo) => {
                        const isTeam = !!team_id;
                        const bg = isTeam ? (team_color ?? '#4a80c4') + '22' : BEIGE_BG;
                        const border = isTeam ? (team_color ?? '#4a80c4') : BEIGE_BORDER;
                        return {
                            id: `todo-${todo.todo_id}`,
                            title: todo.content,
                            start: date,
                            allDay: true,
                            backgroundColor: bg,
                            borderColor: border,
                            textColor: '#2d2d2d',
                            extendedProps: {
                                ...todo,
                                eventType: 'todo',
                                isDone: !!todo.is_done,
                                priority: todo.priority,
                                category: todo.category,
                                team_id: team_id ?? todo.team_id ?? null,
                                team_color: team_color ?? null,
                            },
                        };
                    })
                );

            const personal = toEvents(personalGrouped, null, null);
            const team = teamResults.flatMap(({ team_id, team_color, data }) =>
                toEvents(data, team_id, team_color)
            );
            setTodoEvents([...personal, ...team]);
        } catch (err) {
            console.error('[fetchTodosForMonth] 에러:', err);
        }
    };

    useEffect(() => {
        fetchTeams(); // 팀 로드 완료 후 fetchSchedules(teams) 내부에서 호출
        fetchSchedules([]); // 공휴일 및 개인 일정 선 로드
    }, []);

    // ── 2. 미니 달력 ──────────────────────────────────
    const handleMiniPrev = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1));
    const handleMiniNext = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1));

    const renderMiniDays = () => {
        const year = miniDate.getFullYear();
        const month = miniDate.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="mini-day empty" />);
        }

        for (let d = 1; d <= lastDay; d++) {
            const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = dbEvents.filter((e) => e.start && e.start.startsWith(currentStr));
            const hasHoliday = dayEvents.some((e) => String(e.id || '').startsWith('holiday'));

            days.push(
                <div
                    key={d}
                    className="mini-day"
                    onClick={() => calendarRef.current.getApi().gotoDate(new Date(year, month, d))}
                >
                    <span className="day-number">{d}</span>
                    <div className="mini-dot-container">
                        {hasHoliday && <span className="mini-dot" style={{ background: '#ff4d4f' }} />}
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
            // 팀 이벤트이면 내 role 확인 → VIEWER면 viewOnly
            const todoTeamRole = ep.team_id
                ? (teams.find(t => String(t.team_id) === String(ep.team_id))?.role ?? 'VIEWER')
                : null;
            setSelectedEvent({
                type: 'todo',
                id: ep.todo_id,
                scope: ep.team_id ? 'team' : 'personal',
                viewOnly: todoTeamRole === 'VIEWER',
                content: ep.content ?? info.event.title,
                dueDate: ep.due_date ? String(ep.due_date).slice(0, 10) : "",
                category: ep.category ?? "",
                priority: ep.priority ?? "MEDIUM",
                isCarriedOver: !!ep.is_carried_over,
                isRepeat: !!ep.is_repeat,
                repeatType: ep.repeat_type ?? "weekly",
                repeatInterval: ep.repeat_interval ?? 1,
                repeatEndAt: ep.repeat_end_at ? String(ep.repeat_end_at).slice(0, 10) : "",
                repeatGroupId: ep.repeat_group_id ?? null,
                teamId: ep.team_id ?? null,
                assignBy: ep.assign_by ?? null,
                isDone: !!ep.is_done,
            });
        } else {
            // ── Schedule ─────────────────────────────────────────────────
            setSelectedEvent({
                type: 'schedule',
                id: ep.sched_id ?? info.event.id,
                scope: ep.team_id ? 'team' : 'personal',
                title: info.event.title,
                startAt: info.event.startStr.slice(0, 16),
                endAt: info.event.end ? info.event.endStr.slice(0, 16) : info.event.startStr.slice(0, 16),
                description: ep.description ?? "",
                // DB JOIN 결과: location_name, address, latitude, longitude 컬럼으로 옴
                // 또는 기존 문자열 location 필드로 올 수 있으므로 두 케이스 처리
                location: ep.location_name || ep.address
                    ? {
                        name: ep.location_name ?? ep.location ?? '',
                        address: ep.address ?? ep.location ?? '',
                        lat: ep.latitude ?? null,
                        lng: ep.longitude ?? null,
                    }
                    : typeof ep.location === 'object' && ep.location?.address
                        ? ep.location
                        : { name: '', address: '', lat: null, lng: null },
                category: ep.category ?? "",
                priority: ep.priority ?? "MEDIUM",
                isRepeat: false,
                teamId: ep.team_id ?? null,
                viewOnly: ep.team_id
                    ? (teams.find(t => String(t.team_id) === String(ep.team_id))?.role ?? 'VIEWER') === 'VIEWER'
                    : false,
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
                // location: CreateModal에서 { name, address, lat, lng } 객체로 옴
                const rawLoc = data.location;
                const locationObj = rawLoc && rawLoc.address
                    ? { name: rawLoc.name || rawLoc.address, address: rawLoc.address, lat: rawLoc.lat || null, lng: rawLoc.lng || null }
                    : null;

                const body = {
                    title: data.title,
                    start_at: data.start_at || data.startAt,
                    end_at:   data.end_at   || data.endAt,
                    description: data.description || "",
                    priority: data.priority || "MEDIUM",
                    category: data.category || "ETC",
                    team_id: data.team_id || data.teamId || null,
                    location: locationObj,
                };
                await API.post('/api/schedules', body);
                fetchSchedules(teams);

            } else {
                // ── Todo 생성 (todoController) ───────────────
                const todoBody = {
                    content: data.content,
                    dueDate: data.due_date || data.dueDate || null,
                    priority: data.priority || "MEDIUM",
                    category: data.category || "ETC",
                    isCarriedOver: data.is_carried_over ?? data.isCarriedOver ?? false,
                    isRepeat: data.is_repeat ?? data.isRepeat ?? false,
                    repeatType: data.repeat_type || data.repeatType || null,
                    repeatInterval: data.repeat_interval ?? data.repeatInterval ?? 1,
                    repeatEndAt: data.repeat_end_at || data.repeatEndAt || null,
                };

                if (data.scope === "team" && (data.teamId || data.team_id)) {
                    await API.post(`/api/todos/team/${data.teamId || data.team_id}`, {
                        ...todoBody,
                        assignBy: data.assign_by || data.assignBy || null,
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
                await API.put(`/api/schedules/${data.id}`, {
                    title: data.title,
                    start_at: data.start_at || data.startAt,
                    end_at: data.end_at || data.endAt,
                    description: data.description || "",
                    priority: data.priority || "MEDIUM",
                    category: data.category || "ETC",
                    location: (data.location && data.location.address)
                        ? { name: data.location.name || data.location.address, address: data.location.address, lat: data.location.lat || null, lng: data.location.lng || null }
                        : null,
                });
                fetchSchedules(teams);
            } else {
                // ── Todo 수정 ────────────────────────────────────────────
                const baseBody = {
                    content: data.content,
                    dueDate: data.due_date || data.dueDate || null,
                    priority: data.priority || "MEDIUM",
                    category: data.category || "ETC",
                    isCarriedOver: data.is_carried_over ?? data.isCarriedOver ?? false,
                    isDone:        data.is_done        ?? data.isDone        ?? false,
                    isRepeat:      data.is_repeat      ?? data.isRepeat      ?? false,
                    repeatType:    data.repeat_type    || data.repeatType    || null,
                    repeatInterval:data.repeat_interval ?? data.repeatInterval ?? 1,
                    repeatEndAt:   data.repeat_end_at  || data.repeatEndAt   || null,
                    assignBy:      data.assign_by      || data.assignBy      || null,
                };

                // editScope=rebuild이더라도 isDone 변경(완료처리)은 단건 PATCH만
                const isOnlyDoneChange = data.editScope === "rebuild" &&
                    (data.is_done !== undefined || data.isDone !== undefined);
                if (data.editScope === "rebuild" && !isOnlyDoneChange) {
                    // ── 재생성: 기존 삭제 후 새 설정으로 재생성 ──
                    // 1) 기존 삭제 — 반복 그룹이면 전체, 단일이면 단건
                    const deleteUrl = data.repeatGroupId
                        ? `/api/todos/${data.id}?scope=group`
                        : `/api/todos/${data.id}`;
                    await API.delete(deleteUrl);

                    // 2) 새 설정으로 재생성
                    const createBody = {
                        content: data.content,
                        dueDate: data.due_date || data.dueDate || null,
                        priority: data.priority || "MEDIUM",
                        category: data.category || "ETC",
                        isCarriedOver: data.is_carried_over ?? data.isCarriedOver ?? false,
                        isRepeat: data.is_repeat ?? data.isRepeat ?? false,
                        repeatType: data.repeat_type || data.repeatType || null,
                        repeatInterval: data.repeat_interval ?? data.repeatInterval ?? 1,
                        repeatEndAt: data.repeat_end_at || data.repeatEndAt || null,
                        assignBy: data.assign_by || data.assignBy || null,
                    };

                    const teamIdVal = data.team_id || data.teamId || null;
                    if (data.scope === "team" && teamIdVal) {
                        await API.post(`/api/todos/team/${teamIdVal}`, createBody);
                    } else {
                        await API.post("/api/todos/personal", createBody);
                    }
                } else {
                    // ── 이 일정만 PATCH ──────────────────────────────────────
                    await API.patch(`/api/todos/${data.id}`, baseBody);
                }

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
                await API.delete(`/api/schedules/${data.id}`);
                fetchSchedules(teams);
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
        API.post('/api/teams', { name: newGroupName.trim(), team_color: newGroupColor })
            .then(() => {
                setIsGroupModalOpen(false);
                setNewGroupName('');
                setNewGroupColor('#4a80c4');
                fetchTeams();
            })
            .catch((err) => alert(err.response?.data?.message || '그룹 생성 실패'));
    };

    // ── 9. 팀 수정 ───────────────────────────────────
    const handleOpenEditTeam = (e, team) => {
        e.stopPropagation(); // 체크박스 토글 방지
        setEditingTeam(team);
        setEditTeamName(team.team_name);
        setEditTeamColor(team.team_color ?? '#4a80c4');
        setIsEditTeamModalOpen(true);
    };

    const handleSaveEditTeam = () => {
        if (!editTeamName.trim()) { alert('그룹 이름을 입력해주세요.'); return; }
        API.put(`/api/teams/${editingTeam.team_id}`, { name: editTeamName.trim(), team_color: editTeamColor })
            .then(() => {
                setIsEditTeamModalOpen(false);
                setEditingTeam(null);
                fetchTeams();
                // 달력 todo도 색상 갱신
                fetchTodosForMonth(mainDate.getFullYear(), mainDate.getMonth() + 1, teams);
            })
            .catch((err) => alert(err.response?.data?.message || '수정 실패'));
    };

    // ── 10. 팀 삭제 ──────────────────────────────────
    const handleOpenDeleteTeam = (e, team) => {
        e.stopPropagation();
        setDeletingTeam(team);
        setIsDeleteTeamModalOpen(true);
    };

    const handleConfirmDeleteTeam = () => {
        API.delete(`/api/teams/${deletingTeam.team_id}`)
            .then(() => {
                setIsDeleteTeamModalOpen(false);
                setDeletingTeam(null);
                fetchTeams();
                fetchSchedules(teams);
                fetchTodosForMonth(mainDate.getFullYear(), mainDate.getMonth() + 1, teams);
            })
            .catch((err) => alert(err.message));
    };

    // ── 11. 필터링 ─────────────────────────────────────
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
        // 개인 할일은 personalTodo 필터로 별도 제어
        return filters.personalTodo;
    });

    const filteredEvents = [...filteredSchedules, ...filteredTodos];



    // ── renderEventContent: 일정 vs Todo 구분 렌더링 ──
    const PRIORITY_LABEL = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' };
    const PRIORITY_TEXT_COLOR = { HIGH: '#c94f4f', MEDIUM: '#555', LOW: '#5a9e6f' };

    const renderEventContent = (eventInfo) => {
        const { eventType, isDone, priority, team_color } = eventInfo.event.extendedProps ?? {};

        if (eventType === 'todo') {
            const borderColor = eventInfo.event.borderColor;
            const prioLabel = PRIORITY_LABEL[priority] ?? '';
            const prioTextCol = PRIORITY_TEXT_COLOR[priority] ?? '#555';

            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    padding: '1px 4px 1px 5px',
                    borderRadius: 4,
                    fontSize: 11,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: eventInfo.event.backgroundColor,
                    borderLeft: `3px solid ${borderColor}`,
                    color: isDone ? '#aaa' : '#333',
                    textDecoration: isDone ? 'line-through' : 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                }}>
                    {/* 왼쪽: 체크박스 + 제목 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, flexShrink: 0, color: borderColor }}>
                            {isDone ? '☑' : '☐'}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {eventInfo.event.title}
                        </span>
                    </div>
                    {/* 오른쪽: 강도 텍스트 */}
                    {prioLabel && (
                        <span style={{
                            flexShrink: 0,
                            fontSize: 9,
                            fontWeight: 600,
                            color: isDone ? '#bbb' : prioTextCol,
                            letterSpacing: '0.02em',
                            marginLeft: 2,
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
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                lineHeight: 1.3,
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box',
                background: eventInfo.event.backgroundColor,
                color: eventInfo.event.textColor ?? '#fff',
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
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
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
                            {teams.map((team) => {
                                const checked = filters.teams[String(team.team_id)] || false;
                                const color = team.team_color ?? '#4a80c4';
                                const isHovered = hoveredTeamId === team.team_id;
                                return (
                                    <div
                                        key={team.team_id}
                                        className="category-item"
                                        style={{
                                            cursor: 'pointer', position: 'relative',
                                            background: isHovered ? 'rgba(0,0,0,0.03)' : 'transparent',
                                            borderRadius: 6, transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={() => setHoveredTeamId(team.team_id)}
                                        onMouseLeave={() => setHoveredTeamId(null)}
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                teams: { ...prev.teams, [String(team.team_id)]: !prev.teams[String(team.team_id)] },
                                            }))
                                        }
                                    >
                                        {/* 커스텀 체크박스 */}
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 16,
                                            height: 16,
                                            borderRadius: 4,
                                            border: `2px solid ${checked ? color : '#ccc'}`,
                                            background: checked ? color : '#fff',
                                            flexShrink: 0,
                                            transition: 'all 0.15s',
                                        }}>
                                            {checked && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <span style={{ color: checked ? '#2d2d2d' : '#9ca3af', transition: 'color 0.15s', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {team.team_name}
                                        </span>
                                        {/* 수정: OWNER/EDITOR만, 삭제: OWNER만 */}
                                        {(team.role === 'OWNER' || team.role === 'EDITOR') && (
                                            <span style={{ display: 'flex', gap: 1, flexShrink: 0, opacity: isHovered ? 1 : 0, transition: 'opacity 0.1s' }}>
                                                <button title="수정" onClick={(e) => handleOpenEditTeam(e, team)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: '#1f2937' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                {team.role === 'OWNER' && (
                                                    <button title="삭제" onClick={(e) => handleOpenDeleteTeam(e, team)}
                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 3px', borderRadius: 4, display: 'flex', alignItems: 'center', color: '#c94f4f' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                            <path d="M10 11v6M14 11v6" />
                                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </span>
                                        )}
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
                            {/* 개인 일정 */}
                            <div
                                className="category-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setFilters((prev) => ({ ...prev, personal: !prev.personal }))}
                            >
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 16, height: 16, borderRadius: 4,
                                    border: `2px solid ${filters.personal ? '#22c55e' : '#ccc'}`,
                                    background: filters.personal ? '#22c55e' : '#fff',
                                    flexShrink: 0, transition: 'all 0.15s',
                                }}>
                                    {filters.personal && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                                <span style={{ color: filters.personal ? '#2d2d2d' : '#9ca3af', transition: 'color 0.15s' }}>
                                    개인 일정
                                </span>
                            </div>
                            {/* 개인 할일 */}
                            <div
                                className="category-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setFilters((prev) => ({ ...prev, personalTodo: !prev.personalTodo }))}
                            >
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 16, height: 16, borderRadius: 4,
                                    border: `2px solid ${filters.personalTodo ? '#22c55e' : '#ccc'}`,
                                    background: filters.personalTodo ? '#22c55e' : '#fff',
                                    flexShrink: 0, transition: 'all 0.15s',
                                }}>
                                    {filters.personalTodo && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                                <span style={{ color: filters.personalTodo ? '#2d2d2d' : '#9ca3af', transition: 'color 0.15s' }}>
                                    개인 할일
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 통계 섹션 */}
                <div className="category-section">
                    <div className="category-header" onClick={() => setIsStatsOpen(!isStatsOpen)}>
                        <span>통계</span>
                        <span className={`arrow ${isStatsOpen ? 'up' : 'down'}`}>▲</span>
                    </div>
                    {isStatsOpen && (() => {
                        const yr = mainDate.getFullYear();
                        const mo = mainDate.getMonth();

                        // 이번 달 todo 필터링
                        const monthTodos = todoEvents.filter(e => {
                            const d = new Date(e.start);
                            return d.getFullYear() === yr && d.getMonth() === mo;
                        });

                        // 개인 todo
                        const personalTodos = monthTodos.filter(e => !e.extendedProps?.team_id);
                        const personalDone  = personalTodos.filter(e => e.extendedProps?.isDone).length;
                        const personalRate  = personalTodos.length > 0
                            ? Math.round((personalDone / personalTodos.length) * 100) : null;

                        // 팀별 todo
                        const teamStats = teams.map(team => {
                            const tTodos = monthTodos.filter(e => String(e.extendedProps?.team_id) === String(team.team_id));
                            const tDone  = tTodos.filter(e => e.extendedProps?.isDone).length;
                            const tRate  = tTodos.length > 0 ? Math.round((tDone / tTodos.length) * 100) : null;
                            return { ...team, total: tTodos.length, done: tDone, rate: tRate };
                        }).filter(t => t.total > 0);

                        const hasAny = personalTodos.length > 0 || teamStats.length > 0;

                        const rateColor = (r) => r >= 70 ? '#16a34a' : r >= 40 ? '#d97706' : '#dc2626';
                        const barColor  = (r) => r >= 70 ? '#22c55e' : r >= 40 ? '#f59e0b' : '#ef4444';

                        const Bar = ({ rate, color }) => (
                            <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden', marginTop: 4 }}>
                                <div style={{ height: '100%', borderRadius: 3, width: `${rate}%`, background: color, transition: 'width 0.4s' }} />
                            </div>
                        );

                        return (
                            <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {!hasAny && (
                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
                                        이번 달 할일이 없습니다.
                                    </p>
                                )}

                                {/* 개인 할일 */}
                                {personalTodos.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                                                개인 할일
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(personalRate) }}>
                                                {personalRate}%
                                            </span>
                                        </div>
                                        <Bar rate={personalRate} color={barColor(personalRate)} />
                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                                            {personalDone} / {personalTodos.length} 완료
                                        </div>
                                    </div>
                                )}

                                {/* 팀별 할일 */}
                                {teamStats.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12,
                                        ...(personalTodos.length > 0 && { borderTop: '1px solid #f0f0f0', paddingTop: 12 }) }}>
                                        {teamStats.map(team => {
                                            const tc = team.team_color ?? '#4a80c4';
                                            return (
                                                <div key={team.team_id}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151',
                                                            display: 'flex', alignItems: 'center', gap: 5,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tc, flexShrink: 0, display: 'inline-block' }} />
                                                            {team.team_name}
                                                        </span>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(team.rate), flexShrink: 0 }}>
                                                            {team.rate}%
                                                        </span>
                                                    </div>
                                                    <Bar rate={team.rate} color={tc} />
                                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                                                        {team.done} / {team.total} 완료
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

            </aside>

            <main className="main-content">
                <header className="top-header">
                    <h2 className="main-month-title">
                        {mainDate.getFullYear()}년 {mainDate.getMonth() + 1}월
                    </h2>

                    {/* 마이페이지 아이콘 */}
                    <button
                        title="마이페이지"
                        onClick={() => navigate('/mypage')}
                        style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', flexShrink: 0, transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                </header>

                <div className="calendar-wrapper" style={{ position: 'relative' }}>
                    {/* 달력 오른쪽 상단: 그룹생성·관리 + 뷰 전환 */}
                    <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* 그룹생성 */}
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, color: '#374151', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            그룹 생성
                        </button>
                        {/* 그룹관리 */}
                        <button
                            onClick={() => setIsTeamManageOpen(true)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, color: '#374151', cursor: 'pointer', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                            그룹 관리
                        </button>
                        {/* 구분선 */}
                        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
                        {/* 일간/주간/월간 */}
                        <div style={{ display: 'flex', gap: 2, background: '#f1f3f4', borderRadius: 8, padding: 3 }}>
                            {[
                                { view: 'timeGridDay', label: '일간' },
                                { view: 'timeGridWeek', label: '주간' },
                                { view: 'dayGridMonth', label: '월간' },
                            ].map(({ view, label }) => (
                                <button
                                    key={view}
                                    onClick={() => { calendarRef.current.getApi().changeView(view); setCurrentView(view); }}
                                    style={{
                                        padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                        fontSize: 13, fontWeight: currentView === view ? 600 : 400,
                                        background: currentView === view ? '#fff' : 'transparent',
                                        color: currentView === view ? '#3c4043' : '#5f6368',
                                        boxShadow: currentView === view ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                                        transition: 'all 0.15s',
                                    }}
                                >{label}</button>
                            ))}
                        </div>
                    </div>
                    {/* FullCalendar prev/next/today 버튼 스타일 오버라이드 */}
                    <style>{`
            .fc-button {
              background: #fff !important;
              border: 1px solid #e5e7eb !important;
              color: #374151 !important;
              border-radius: 8px !important;
              box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
              font-size: 13px !important;
              padding: 6px 12px !important;
              font-weight: 500 !important;
              transition: background 0.15s !important;
            }
            .fc-button:hover { background: #f9fafb !important; }
            .fc-button:focus { box-shadow: 0 0 0 2px rgba(95,99,104,0.2) !important; }
            .fc-button-active, .fc-button:active { background: #f3f4f6 !important; box-shadow: none !important; }
            .fc-prev-button, .fc-next-button { padding: 6px 10px !important; }
            .fc-today-button:disabled { opacity: 0.4 !important; }
            .fc-toolbar-chunk { display: flex !important; align-items: center !important; gap: 4px !important; }

            /* 오늘 날짜: 연노랑 → 옅은 회색 */
            .fc-day-today { background: #f3f4f6 !important; }
            .fc-day-today .fc-daygrid-day-number { color: #374151 !important; font-weight: 700; }
          `}</style>
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
                    onSubmit={selectedEvent.viewOnly ? undefined : handleEditSubmit}
                    onDelete={selectedEvent.viewOnly ? undefined : handleDeleteEvent}
                    viewOnly={selectedEvent.viewOnly}
                />
            )}

            {/* ── 그룹 관리 모달 ── */}
            {isTeamManageOpen && (
                <TeamManageModal
                    onClose={() => { setIsTeamManageOpen(false); fetchTeams(); }}
                />
            )}

            {/* ── 그룹 생성 모달 ── */}
            {isGroupModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}
                     onClick={(e) => e.target === e.currentTarget && setIsGroupModalOpen(false)}
                >
                    <div style={{
                        background: '#fff', borderRadius: 12, width: 400,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.14)', padding: '24px 24px 20px',
                    }}>
                        {/* 헤더 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#2d2d2d' }}>👥 새 그룹 추가</span>
                            <button onClick={() => setIsGroupModalOpen(false)} style={{
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1,
                            }}>×</button>
                        </div>

                        {/* 그룹 이름 */}
                        <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>그룹 이름</label>
                        <input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="예: 개발팀, 스터디 모임"
                            style={{
                                display: 'block', width: '100%', boxSizing: 'border-box',
                                marginTop: 6, marginBottom: 20,
                                padding: '9px 12px', borderRadius: 8,
                                border: '1px solid rgba(0,0,0,0.12)',
                                fontSize: 14, outline: 'none',
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveGroup()}
                        />

                        {/* 팀 색상 선택 */}
                        <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>팀 색상</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 6 }}>
                            {TEAM_COLOR_PALETTE.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewGroupColor(color)}
                                    title={color}
                                    style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: color, border: 'none', cursor: 'pointer',
                                        outline: newGroupColor === color ? `3px solid ${color}` : '3px solid transparent',
                                        outlineOffset: 2,
                                        transform: newGroupColor === color ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'transform 0.1s',
                                        boxShadow: newGroupColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        {/* 직접 입력 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 20 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: newGroupColor, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0,
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
                                    flex: 1, padding: '6px 10px', borderRadius: 6,
                                    border: '1px solid rgba(0,0,0,0.12)',
                                    fontSize: 13, outline: 'none', letterSpacing: '0.05em',
                                    fontFamily: 'monospace',
                                }}
                            />
                            <input
                                type="color"
                                value={newGroupColor.length === 7 ? newGroupColor : '#4a80c4'}
                                onChange={(e) => setNewGroupColor(e.target.value)}
                                style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', padding: 2 }}
                                title="색상 직접 선택"
                            />
                        </div>

                        {/* 버튼 */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsGroupModalOpen(false)}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)',
                                    background: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer',
                                }}
                            >취소</button>
                            <button
                                onClick={handleSaveGroup}
                                style={{
                                    padding: '8px 20px', borderRadius: 8, border: 'none',
                                    background: newGroupColor.length === 7 ? newGroupColor : '#4a80c4',
                                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                }}
                            >저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 팀 수정 모달 ── */}
            {isEditTeamModalOpen && editingTeam && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}
                     onClick={(e) => e.target === e.currentTarget && setIsEditTeamModalOpen(false)}
                >
                    <div style={{
                        background: '#fff', borderRadius: 12, width: 400,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.14)', padding: '24px 24px 20px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#2d2d2d' }}>✏️ 그룹 수정</span>
                            <button onClick={() => setIsEditTeamModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>×</button>
                        </div>

                        <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>그룹 이름</label>
                        <input
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, marginBottom: 20, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, outline: 'none' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditTeam()}
                        />

                        <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>팀 색상</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 6 }}>
                            {TEAM_COLOR_PALETTE.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setEditTeamColor(color)}
                                    title={color}
                                    style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: color, border: 'none', cursor: 'pointer',
                                        transition: 'transform 0.1s',
                                        transform: editTeamColor === color ? 'scale(1.15)' : 'scale(1)',
                                        boxShadow: editTeamColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 20 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: editTeamColor, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={editTeamColor}
                                onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setEditTeamColor(v); }}
                                placeholder="#hex"
                                maxLength={7}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', letterSpacing: '0.05em', fontFamily: 'monospace' }}
                            />
                            <input
                                type="color"
                                value={editTeamColor.length === 7 ? editTeamColor : '#4a80c4'}
                                onChange={(e) => setEditTeamColor(e.target.value)}
                                style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', padding: 2 }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsEditTeamModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>취소</button>
                            <button onClick={handleSaveEditTeam} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: editTeamColor.length === 7 ? editTeamColor : '#4a80c4', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 팀 삭제 확인 모달 ── */}
            {isDeleteTeamModalOpen && deletingTeam && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}
                     onClick={(e) => e.target === e.currentTarget && setIsDeleteTeamModalOpen(false)}
                >
                    <div style={{
                        background: '#fff', borderRadius: 12, width: 360,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.14)', padding: '24px 24px 20px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#c94f4f' }}>🗑️ 그룹 삭제</span>
                            <button onClick={() => setIsDeleteTeamModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>×</button>
                        </div>

                        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.7 }}>
                                <strong style={{ color: '#991b1b' }}>{deletingTeam.team_name}</strong>을 삭제하면<br />
                                소속된 <strong style={{ color: '#991b1b' }}>모든 일정·할일</strong>도 함께 삭제됩니다.<br />
                                이 작업은 되돌릴 수 없습니다.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsDeleteTeamModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>취소</button>
                            <button onClick={handleConfirmDeleteTeam} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#c94f4f', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;