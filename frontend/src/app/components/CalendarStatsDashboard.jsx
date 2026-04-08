import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Calendar, TrendingUp, Clock, CheckCircle2, ArrowRight, Target, ChevronDown } from "lucide-react";
import { ScheduleDetailModal } from "./ScheduleDetailModal.jsx";
import { CalendarModal } from "./CalendarModal.jsx";
import API from '../../api/axios';

/* ========================================
   상수 및 유틸리티
======================================== */

const getDateRange = (period, baseDate = new Date()) => {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      const dayOfWeek = start.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); 
      end.setHours(23, 59, 59, 999);
      break;
  }
  return { startDate: start, endDate: end };
};

const getDateRangeLabel = (period, baseDate) => {
  const { startDate, endDate } = getDateRange(period, baseDate);
  const options = { month: "short", day: "numeric" };

  switch (period) {
    case "daily":
      return baseDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    case "weekly":
      return `${startDate.toLocaleDateString("ko-KR", options)} ~ ${endDate.toLocaleDateString("ko-KR", options)}`;
    case "monthly":
      return baseDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  }
};

const CATEGORIES = [
  { name: "자기계발", color: "#f59e0b" },
  { name: "업무", color: "#3b82f6" },
  { name: "취미", color: "#8b5cf6" },
  { name: "운동", color: "#10b981" },
  { name: "기타", color: "#ec4899" },
];

const DEFAULT_GROUPS = [
  { id: "ALL", name: "전체 일정", color: "#3b82f6", icon: "📅" },
  { id: "PERSONAL", name: "개인 일정", color: "#10b981", icon: "👤" },
];

const PERIOD_LABELS = { daily: "일간", weekly: "주간", monthly: "월간" };

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getFadedColor = (hexColor, opacity = 0.4) => {
  const rgb = hexToRgb(hexColor);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : hexColor;
};

const normalizeCategory = (cat) => {
  if (!cat) return "기타";
  const upperCat = String(cat).toUpperCase();
  if (["자기계발", "DEVELOPMENT", "SELF_DEVELOPMENT", "STUDY", "공부"].includes(upperCat)) return "자기계발";
  if (["업무", "WORK", "BUSINESS"].includes(upperCat)) return "업무";
  if (["취미", "HOBBY", "PERSONAL", "개인"].includes(upperCat)) return "취미";
  if (["운동", "EXERCISE", "HEALTH", "SPORTS", "WORKOUT"].includes(upperCat)) return "운동";
  return "기타";
};

/* ========================================
   메인 컴포넌트
======================================== */

export function CalendarStatsDashboard() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState("monthly");
  const [modalOpen, setModalOpen] = useState(false); 
  const [modalType, setModalType] = useState("completed"); 
  const [calendarModalOpen, setCalendarModalOpen] = useState(false); 
  const [selectedGroup, setSelectedGroup] = useState(DEFAULT_GROUPS[0]); 
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  const [rawSchedules, setRawSchedules] = useState([]);
  const [rawTodos, setRawTodos] = useState([]);
  const [teams, setTeams] = useState([]);

  const dateRange = useMemo(() => getDateRange(period, selectedDate), [period, selectedDate]);
  const dateRangeLabel = useMemo(() => getDateRangeLabel(period, selectedDate), [period, selectedDate]);

  /* ----------------------------------------
     1. 데이터 Fetching
  ---------------------------------------- */
  useEffect(() => {
    const loadBaseData = async () => {
      try {
        const [teamsRes, schedRes] = await Promise.all([
          API.get('/api/teams').catch(() => ({ data: [] })),
          API.get('/api/schedules').catch(() => ({ data: [] }))
        ]);
        setTeams(teamsRes.data || []);
        setRawSchedules(schedRes.data || []);
      } catch (e) { console.error("기본 데이터 로드 실패", e); }
    };
    loadBaseData();
  }, []);

  useEffect(() => {
    const loadTodos = async () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      try {
        const personalRes = await API.get('/api/todos/calendar', { params: { year, month } }).catch(() => ({ data: { data: {} } }));
        const personalGrouped = personalRes.data?.data || {};

        const teamResults = await Promise.all(
          teams.map(team =>
            API.get('/api/todos/calendar', { params: { year, month, team_id: team.team_id } })
               .then(r => r.data?.data || {})
               .catch(() => ({}))
          )
        );

        const flatTodos = [];
        Object.values(personalGrouped).forEach(arr => flatTodos.push(...arr));
        teamResults.forEach(grouped => {
          Object.values(grouped).forEach(arr => flatTodos.push(...arr));
        });
        
        setRawTodos(flatTodos);
      } catch (e) { console.error("할일 로드 실패", e); }
    };

    if (teams) {
      loadTodos();
    }
  }, [selectedDate, teams]);

  /* ----------------------------------------
     2. 데이터 필터링 및 가공
  ---------------------------------------- */
  const sharedGroups = useMemo(() => teams.map(t => ({
    id: String(t.team_id),
    name: t.team_name,
    color: t.team_color || '#f59e0b',
    icon: "👥"
  })), [teams]);

  const allGroups = useMemo(() => [...DEFAULT_GROUPS, ...sharedGroups], [sharedGroups]);

  const filteredEvents = useMemo(() => {
    const { startDate, endDate } = dateRange;
    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    const inRange = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr).getTime();
      return d >= startTs && d <= endTs;
    };

    const groupFilter = (teamId) => {
      if (selectedGroup.id === "ALL") return true;
      if (selectedGroup.id === "PERSONAL") return !teamId;
      return String(teamId) === selectedGroup.id;
    };

    const validSchedules = rawSchedules.filter(s => {
      if (s.id && String(s.id).startsWith('holiday')) return false;
      return inRange(s.start_at) && groupFilter(s.team_id);
    }).map(s => ({ ...s, eventType: 'schedule' }));

    const validTodos = rawTodos.filter(t => {
      return inRange(t.due_date || t.dueDate || t.start) && groupFilter(t.team_id);
    }).map(t => ({ ...t, eventType: 'todo' }));

    return [...validSchedules, ...validTodos];
  }, [rawSchedules, rawTodos, dateRange, selectedGroup]);

  // 카테고리별 통계 데이터 가공
  const currentData = useMemo(() => {
    const statsMap = {
      "자기계발": { completedOnTime: 0, completedCarriedOver: 0, total: 0 },
      "업무": { completedOnTime: 0, completedCarriedOver: 0, total: 0 },
      "취미": { completedOnTime: 0, completedCarriedOver: 0, total: 0 },
      "운동": { completedOnTime: 0, completedCarriedOver: 0, total: 0 },
      "기타": { completedOnTime: 0, completedCarriedOver: 0, total: 0 },
    };

    filteredEvents.forEach(ev => {
      const cat = normalizeCategory(ev.category);
      statsMap[cat].total++;

      const isDone = ev.is_done || ev.isDone;
      if (isDone) {
        if (ev.is_carried_over || ev.isCarriedOver) {
          statsMap[cat].completedCarriedOver++;
        } else {
          statsMap[cat].completedOnTime++;
        }
      }
    });

    const dataArray = CATEGORIES.map(c => ({
      name: c.name,
      value: 0, // 실제 점유율(%) 표시용
      completedOnTime: statsMap[c.name].completedOnTime,
      completedCarriedOver: statsMap[c.name].completedCarriedOver,
      total: statsMap[c.name].total
    }));

    // 전체 개수 중 해당 카테고리가 차지하는 비중(점유율) 계산
    const overallTotal = dataArray.reduce((sum, item) => sum + item.total, 0);
    if (overallTotal > 0) {
      dataArray.forEach(item => {
        item.value = Math.round((item.total / overallTotal) * 100);
      });
    }

    return dataArray;
  }, [filteredEvents]);

  // 카테고리별 일정 달성일 계산 (날짜별 체크)
  const categoryRoutineData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const eventsInCat = filteredEvents.filter(ev => normalizeCategory(ev.category) === cat.name);
      const daysMap = new Map();

      eventsInCat.forEach(ev => {
        const dateStr = (ev.start_at || ev.dueDate || ev.due_date || ev.start || '').substring(0, 10);
        if (!dateStr) return;

        // 해당 날짜가 맵에 없으면 며칠 중 하루로 등록 (기본 미달성 상태)
        if (!daysMap.has(dateStr)) {
          daysMap.set(dateStr, false);
        }

        // 해당 날짜에 하나라도 완료된 일정이 있으면 그 날짜는 달성으로 간주
        const isDone = ev.is_done || ev.isDone;
        if (isDone) {
          daysMap.set(dateStr, true);
        }
      });

      const targetDays = daysMap.size;
      const achievedDays = Array.from(daysMap.values()).filter(Boolean).length;

      return {
        id: cat.name,
        name: cat.name,
        color: cat.color,
        targetDays,
        achievedDays
      };
    });
  }, [filteredEvents]);

  const detailedSchedules = useMemo(() => {
    const completed = { 자기계발: [], 업무: [], 취미: [], 운동: [], 기타: [] };
    const carriedOver = { 자기계발: [], 업무: [], 취미: [], 운동: [], 기타: [] };

    filteredEvents.forEach(ev => {
      const cat = normalizeCategory(ev.category);
      const isDone = ev.is_done || ev.isDone;

      if (isDone) {
        const item = {
          id: ev.sched_id || ev.todo_id || ev.id,
          title: ev.title || ev.content,
          category: cat,
          date: ev.start_at || ev.dueDate || ev.due_date,
          time: ev.start_at ? ev.start_at.substring(11, 16) : ''
        };

        if (ev.is_carried_over || ev.isCarriedOver) {
          carriedOver[cat].push(item);
        } else {
          completed[cat].push(item);
        }
      }
    });
    return { completed, carriedOver };
  }, [filteredEvents]);

  const stats = useMemo(() => {
    const totalCompletedOnTime = currentData.reduce((acc, item) => acc + item.completedOnTime, 0);
    const totalCompletedCarriedOver = currentData.reduce((acc, item) => acc + item.completedCarriedOver, 0);
    const totalCompleted = totalCompletedOnTime + totalCompletedCarriedOver;
    const totalSchedules = currentData.reduce((acc, item) => acc + item.total, 0);
    const overallCompletionRate = totalSchedules > 0 ? Math.round((totalCompleted / totalSchedules) * 100) : 0;
    const carriedOverRate = totalSchedules > 0 ? Math.round((totalCompletedCarriedOver / totalSchedules) * 100) : 0;

    return { totalSchedules, totalCompleted, totalCarriedOver: totalCompletedCarriedOver, overallCompletionRate, carriedOverRate };
  }, [currentData]);

  /* ----------------------------------------
     이벤트 핸들러
  ---------------------------------------- */
  const navigateDate = (direction) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      if (period === "daily") newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      else if (period === "weekly") newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      else if (period === "monthly") newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };
  
  const goToToday = () => setSelectedDate(new Date());

  const handleOpenModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const getAllSchedules = () => {
    return filteredEvents.map(ev => ({
      id: ev.sched_id || ev.todo_id || ev.id,
      title: ev.title || ev.content || '제목 없음',
      category: normalizeCategory(ev.category),
      date: ev.start_at || ev.dueDate || ev.due_date || ev.start,
      time: ev.start_at ? ev.start_at.substring(11, 16) : ''
    }));
  };

  const categoryColors = useMemo(() => CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.color }), {}), []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-slate-700" />
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">일정 통계</h1>
            </div>

            <div className="relative">
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 rounded-full pl-3 pr-4 py-2 border border-slate-200 transition-all shadow-sm"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: selectedGroup.color + "15" }}>
                  {selectedGroup.icon}
                </div>
                <span className="font-medium text-slate-700 whitespace-nowrap">{selectedGroup.name}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${groupDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {groupDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-slate-200 py-2 z-50 shadow-lg min-w-[200px]">
                  {allGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => { setSelectedGroup(group); setGroupDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${selectedGroup.id === group.id ? "bg-slate-50" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: group.color + "15" }}>
                        {group.icon}
                      </div>
                      <span className="font-medium text-slate-700">{group.name}</span>
                      {selectedGroup.id === group.id && <CheckCircle2 className="w-5 h-5 text-slate-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => navigate('/calendar')} className="w-12 h-12 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-all shadow-sm" title="캘린더로 돌아가기">
            <ArrowRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
            {["daily", "weekly", "monthly"].map((p) => (
                <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-md transition-all font-medium text-sm ${
                    period === p ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"
                }`}
                >
                {PERIOD_LABELS[p]}
                </button>
            ))}
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm">
                <button onClick={() => navigateDate("prev")} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                    <ChevronDown className="w-5 h-5 rotate-90 text-slate-500" />
                </button>
                <span className="font-semibold text-slate-800 min-w-[160px] text-center text-[15px]">
                    {dateRangeLabel}
                </span>
                <button onClick={() => navigateDate("next")} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                    <ChevronDown className="w-5 h-5 -rotate-90 text-slate-500" />
                </button>
                <button onClick={goToToday} className="ml-2 px-4 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    오늘
                </button>
            </div>
        </div>

        {/* 일정 달성일 (카테고리별 일수 계산) */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">일정 달성일</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {categoryRoutineData.map((routine) => (
              <div key={`routine-${routine.id}`} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: routine.color }} />
                  <span className="text-slate-700 font-medium text-sm truncate">{routine.name}</span>
                </div>
                <div className="text-3xl font-light text-slate-900 mb-2">
                  {routine.achievedDays}<span className="text-xl text-slate-400">/{routine.targetDays}일</span>
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {routine.targetDays}일 중 {routine.achievedDays}일 달성
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 전체 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 relative shadow-sm">
            <button onClick={() => setCalendarModalOpen(true)} className="absolute top-6 right-6 p-2.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
              <Calendar className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center mb-4">
              <h3 className="text-slate-500 font-medium text-sm">전체 일정 (일정+할일)</h3>
            </div>
            <div className="text-5xl font-light text-slate-900 mb-3">{stats.totalSchedules}</div>
            <p className="text-sm text-slate-400 font-medium">{PERIOD_LABELS[period]} 등록된 총 개수</p>
          </div>

          <button onClick={() => handleOpenModal("completed")} className="bg-emerald-50/50 rounded-2xl p-8 border border-emerald-100 text-left hover:bg-emerald-50 transition-all cursor-pointer shadow-sm group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-emerald-700 font-medium text-sm">달성한 일정</h3>
              <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-5xl font-light text-emerald-900 mb-3">{stats.totalCompleted}</div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100/80 rounded-full px-3 py-1">
                <span className="text-xs font-bold text-emerald-700">{stats.overallCompletionRate}%</span>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </button>

          <button onClick={() => handleOpenModal("carriedOver")} className="bg-amber-50/50 rounded-2xl p-8 border border-amber-100 text-left hover:bg-amber-50 transition-all cursor-pointer shadow-sm group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber-700 font-medium text-sm">이월된 일정</h3>
              <Clock className="w-6 h-6 text-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-5xl font-light text-amber-900 mb-3">{stats.totalCarriedOver}</div>
            <div className="flex items-center gap-2">
              <div className="bg-amber-100/80 rounded-full px-3 py-1">
                <span className="text-xs font-bold text-amber-700">{stats.carriedOverRate}%</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600" />
            </div>
          </button>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8">카테고리별 달성율</h2>
            <div className="space-y-7">
              {currentData.map((item, index) => {
                const totalCompleted = item.completedOnTime + item.completedCarriedOver;
                const completionOnTimeRate = item.total > 0 ? (item.completedOnTime / item.total) * 100 : 0;
                const completionCarriedOverRate = item.total > 0 ? (item.completedCarriedOver / item.total) * 100 : 0;
                const completionRate = item.total > 0 ? Math.round((totalCompleted / item.total) * 100) : 0;
                const category = CATEGORIES[index];
                const fadedColor = getFadedColor(category.color, 0.4);

                return (
                  <div key={`bar-${item.name}`} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="font-medium text-slate-700 text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs text-slate-400 font-medium tracking-wide">
                          {totalCompleted}/{item.total}
                        </span>
                        <span className="font-bold text-slate-900 min-w-[40px] text-right text-sm">
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                      <div className="h-full rounded-full transition-all duration-700 absolute left-0" style={{ backgroundColor: category.color, width: `${completionOnTimeRate}%` }} />
                      <div className="h-full rounded-full transition-all duration-700 absolute" style={{ backgroundColor: fadedColor, left: `${completionOnTimeRate}%`, width: `${completionCarriedOverRate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">카테고리별 점유율</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">선택된 기간 내 카테고리 비중</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={currentData.filter(d => d.total > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="total">
                  {currentData.filter(d => d.total > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORIES.find(c => c.name === entry.name)?.color || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {currentData.filter(d => d.total > 0).map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORIES.find(c => c.name === entry.name)?.color || '#ccc' }} />
                  <span className="text-slate-600 text-sm font-medium">
                    {entry.name} ({entry.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== 상세 통계 테이블 ========== */}
        <div className="mt-8 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">상세 통계</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-slate-500 font-medium text-sm">카테고리</th>
                  <th className="text-center py-4 px-6 text-slate-500 font-medium text-sm">전체</th>
                  <th className="text-center py-4 px-6 text-slate-500 font-medium text-sm">정시달성</th>
                  <th className="text-center py-4 px-6 text-slate-500 font-medium text-sm">이월달성</th>
                  <th className="text-center py-4 px-6 text-slate-500 font-medium text-sm">미완료</th>
                  <th className="text-center py-4 px-6 text-slate-500 font-medium text-sm">달성율</th>
                  <th className="text-center py-4 px-6 text-slate-500 font-medium text-sm">점유율</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => {
                  const totalCompleted = item.completedOnTime + item.completedCarriedOver;
                  const notCompleted = item.total - totalCompleted;
                  const completionRate = item.total > 0 ? Math.round((totalCompleted / item.total) * 100) : 0;
                  const category = CATEGORIES[index];
                  const fadedColor = getFadedColor(category.color, 0.6);

                  return (
                    <tr key={`table-${item.name}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="font-medium text-slate-700 text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6 text-slate-700 font-medium text-sm">{item.total}</td>
                      <td className="text-center py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 font-medium text-sm" style={{ color: category.color }}>
                          <CheckCircle2 className="w-4 h-4" />
                          {item.completedOnTime}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 font-medium text-sm" style={{ color: fadedColor }}>
                          <CheckCircle2 className="w-4 h-4" />
                          {item.completedCarriedOver}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-sm">
                          <Clock className="w-4 h-4" />
                          {notCompleted}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className="font-bold text-slate-900 text-sm">{completionRate}%</span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className="text-slate-500 font-medium text-sm">{item.value}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <ScheduleDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        period={period}
        schedules={detailedSchedules[modalType]}
        categoryColors={categoryColors}
      />

      <CalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        schedules={getAllSchedules()}
        period={period}
        categoryColors={categoryColors}
      />
    </div>
  );
}