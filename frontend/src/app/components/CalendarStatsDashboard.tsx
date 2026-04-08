import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Calendar, TrendingUp, Clock, CheckCircle2, ArrowRight, Target, ChevronDown } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ScheduleDetailModal } from "./ScheduleDetailModal";
import { CalendarModal } from "./CalendarModal";
import axios from "axios"

/* ========================================
   상수 정의
======================================== */
const CATEGORIES = [
  { name: "업무", color: "#3b82f6" },
  { name: "운동", color: "#10b981" },
  { name: "공부", color: "#f59e0b" },
  { name: "개인", color: "#8b5cf6" },
  { name: "기타", color: "#ec4899" },
];

const DEFAULT_GROUPS = [
  { id: 1, name: "전체 일정", color: "#3b82f6", icon: "📅" },
  { id: 2, name: "개인 일정", color: "#10b981", icon: "👤" },
];

const PERIOD_LABELS = {
  daily: "일간",
  weekly: "주간",
  monthly: "월간",
};

/* ========================================
   타입 정의
======================================== */
type Period = "daily" | "weekly" | "monthly";
type ScheduleType = "completed" | "carriedOver";

/* ========================================
   유틸리티 함수
======================================== */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getFadedColor = (hexColor: string, opacity: number = 0.4) => {
  const rgb = hexToRgb(hexColor);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : hexColor;
};

/* ========================================
   메인 컴포넌트
======================================== */
export function CalendarStatsDashboard() {
  /* ----------------------------------------
     상태 관리
  ---------------------------------------- */
  const [period, setPeriod] = useState<Period>("weekly");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ScheduleType>("completed");
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  
  const [selectedGroup, setSelectedGroup] = useState(DEFAULT_GROUPS[0]);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  // 백엔드에서 받아올 실제 데이터 상태
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [routineData, setRoutineData] = useState<any[]>([]);
  const [detailedSchedules, setDetailedSchedules] = useState<any>({ completed: {}, carriedOver: {} });

  /* ----------------------------------------
     백엔드 API 연동 (포트 3001)
  ---------------------------------------- */
  useEffect(() => {
  const today = new Date();
  let start = format(today, "yyyy-MM-dd");
  let end = format(today, "yyyy-MM-dd");

  if (period === "weekly") {
    start = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
    end = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  } else if (period === "monthly") {
    start = format(startOfMonth(today), "yyyy-MM-dd");
    end = format(endOfMonth(today), "yyyy-MM-dd");
  }

  // 로컬스토리지에 userId가 없으면 DB에 넣은 1번을 강제로 사용
  const userId = localStorage.getItem("userId") || 1; 
  let filterType = "all";
  let teamParam = "";

  if (selectedGroup.id === 2) {
    filterType = "personal"; 
  } else if (selectedGroup.id > 2) {
    filterType = "team";
    teamParam = `&teamId=${selectedGroup.id}`;
  }

  const url = `http://localhost:3001/api/stats?userId=${userId}&filterType=${filterType}${teamParam}&startDate=${start}&endDate=${end}`;
  console.log("요청 URL:", url); // 브라우저 주소창에 직접 쳐서 데이터 나오는지 확인용

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("네트워크 응답 에러");
      return res.json();
    })
    .then(response => {
      console.log("서버 응답 전체:", response); // 데이터 구조 확인용! 중요!

      if(response.success && response.data) {
        const payload = response.data;
        
        // 데이터가 비어있어도 []를 넣어 렌더링 에러 방지
        setScheduleData(payload.scheduleData || []);
        setRoutineData(payload.routineData || []);
        
        // detailedSchedules 구조가 {completed: {...}, carriedOver: {...}} 인지 확인
        setDetailedSchedules(payload.detailedSchedules || { completed: {}, carriedOver: {} });
      }
    })
    .catch(err => console.error("데이터 패칭 실패:", err));
}, [period, selectedGroup]);

  /* ----------------------------------------
     데이터 가공 및 메모이제이션
  ---------------------------------------- */
  const chartData = useMemo(() => 
    scheduleData.map((item, index) => ({ ...item, id: `${period}-${item.name}-${index}` })),
    [scheduleData, period]
  );

  const categoryColors = useMemo(() => 
    CATEGORIES.reduce((acc, cat) => { acc[cat.name] = cat.color; return acc; }, {} as { [key: string]: string }),
    []
  );

  const stats = useMemo(() => {
    const totalSchedules = scheduleData.reduce((acc, item) => acc + item.total, 0);
    const totalCompletedOnTime = scheduleData.reduce((acc, item) => acc + item.completedOnTime, 0);
    const totalCompletedCarriedOver = scheduleData.reduce((acc, item) => acc + item.completedCarriedOver, 0);
    const totalCompleted = totalCompletedOnTime + totalCompletedCarriedOver;
    
    return {
      totalSchedules,
      totalCompleted,
      totalCarriedOver: totalCompletedCarriedOver,
      overallCompletionRate: totalSchedules > 0 ? Math.round((totalCompleted / totalSchedules) * 100) : 0,
      carriedOverRate: totalSchedules > 0 ? Math.round((totalCompletedCarriedOver / totalSchedules) * 100) : 0,
    };
  }, [scheduleData]);

  const handleOpenModal = (type: ScheduleType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const getAllSchedules = () => {
    return [
      ...Object.values(detailedSchedules.completed).flat(),
      ...Object.values(detailedSchedules.carriedOver).flat()
    ];
  };

  /* ----------------------------------------
     렌더링
  ---------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 및 아코디언 */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-800">일정 통계 대시보드</h1>
            </div>
            <p className="text-slate-600">카테고리별 일정 달성율과 점유율을 확인하세요</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-3 bg-white hover:bg-slate-50 rounded-full pl-2 pr-4 py-2 shadow-lg border border-slate-200 transition-all"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: selectedGroup.color + "20" }}>
                {selectedGroup.icon}
              </div>
              <span className="font-medium text-slate-700 whitespace-nowrap">{selectedGroup.name}</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${groupDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {groupDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 w-full">
                {DEFAULT_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroup(group); setGroupDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${selectedGroup.id === group.id ? "bg-slate-50" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: group.color + "20" }}>
                      {group.icon}
                    </div>
                    <span className="font-medium text-slate-700">{group.name}</span>
                    {selectedGroup.id === group.id && <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 루틴 달성일 박스 */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">루틴 달성일</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {routineData.map((routine, idx) => (
              <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-300" />
                  <span className="text-white font-medium text-sm">{routine.name}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {routine.achievedDays}/{routine.targetDays}일
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 기간 선택 버튼 */}
        <div className="flex gap-2 mb-6">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-lg transition-all ${period === p ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* 전체 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 relative">
            <button onClick={() => setCalendarModalOpen(true)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors" title="달력 보기">
              <Calendar className="w-5 h-5 text-blue-600" />
            </button>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-600">전체 일정</h3>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.totalSchedules}</div>
            <p className="text-sm text-slate-500 mt-1">{PERIOD_LABELS[period]} 등록된 일정</p>
          </div>

          <button onClick={() => handleOpenModal("completed")} className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-50">달성한 일정</h3>
              <CheckCircle2 className="w-5 h-5 text-green-100" />
            </div>
            <div className="text-3xl font-bold">{stats.totalCompleted}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-sm font-semibold">{stats.overallCompletionRate}%</span>
              </div>
              <TrendingUp className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleOpenModal("carriedOver")} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-lg text-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-amber-50">이월된 일정</h3>
              <Clock className="w-5 h-5 text-amber-100" />
            </div>
            <div className="text-3xl font-bold">{stats.totalCarriedOver}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-sm font-semibold">{stats.carriedOverRate}%</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 달성율 프로그레스 바 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">카테고리별 달성율</h2>
            <div className="space-y-4">
              {scheduleData.map((item, index) => {
                const totalCompleted = item.completedOnTime + item.completedCarriedOver;
                const completionOnTimeRate = item.total > 0 ? (item.completedOnTime / item.total) * 100 : 0;
                const completionCarriedOverRate = item.total > 0 ? (item.completedCarriedOver / item.total) * 100 : 0;
                const completionRate = item.total > 0 ? Math.round((totalCompleted / item.total) * 100) : 0;
                const color = CATEGORIES.find(c => c.name === item.name)?.color || "#ccc";
                const fadedColor = getFadedColor(color, 0.4);

                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">{totalCompleted} / {item.total}</span>
                        <span className="font-bold text-slate-800 min-w-[45px] text-right">{completionRate}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                      <div className="h-full rounded-full transition-all duration-500 absolute left-0" style={{ backgroundColor: color, width: `${completionOnTimeRate}%` }} />
                      <div className="h-full rounded-full transition-all duration-500 absolute" style={{ backgroundColor: fadedColor, left: `${completionOnTimeRate}%`, width: `${completionCarriedOverRate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 점유율 도넛 차트 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">카테고리별 점유율</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={CATEGORIES.find(c => c.name === entry.name)?.color || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, "점유율"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 하단 상세 테이블 */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">상세 통계</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-600 font-semibold text-xl">카테고리</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-xl">전체</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-xl">정시달성</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-xl">이월달성</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-xl">미완료</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-xl">달성율</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-xl">점유율</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((item) => {
                  const totalCompleted = item.completedOnTime + item.completedCarriedOver;
                  const notCompleted = item.total - totalCompleted;
                  const completionRate = item.total > 0 ? Math.round((totalCompleted / item.total) * 100) : 0;
                  const color = CATEGORIES.find(c => c.name === item.name)?.color || "#ccc";
                  const fadedColor = getFadedColor(color, 0.6);

                  return (
                    <tr key={item.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-medium text-slate-700 text-xl">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold text-xl">{item.total}</td>
                      <td className="text-center py-4 px-4 font-bold text-xl" style={{ color: color }}>{item.completedOnTime}</td>
                      <td className="text-center py-4 px-4 font-bold text-xl" style={{ color: fadedColor }}>{item.completedCarriedOver}</td>
                      <td className="text-center py-4 px-4 text-slate-400 text-xl">{notCompleted}</td>
                      <td className="text-center py-4 px-4 font-bold text-slate-800 text-xl">{completionRate}%</td>
                      <td className="text-center py-4 px-4 text-slate-700 text-xl">{item.value}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ScheduleDetailModal 호출부 수정 (as any 추가) */}
      <ScheduleDetailModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        type={modalType} 
        period={period} 
        schedules={detailedSchedules[modalType] as any} 
        categoryColors={categoryColors} 
      />

      {/* CalendarModal 호출부 수정 (as any 추가) */}
      <CalendarModal 
        isOpen={calendarModalOpen} 
        onClose={() => setCalendarModalOpen(false)} 
        schedules={getAllSchedules() as any} 
        period={period} 
        categoryColors={categoryColors} 
      />
    </div>
  );
}