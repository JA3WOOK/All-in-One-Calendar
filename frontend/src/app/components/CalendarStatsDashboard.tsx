import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Calendar, TrendingUp, Clock, CheckCircle2, ArrowRight, Target, ChevronDown } from "lucide-react";
import { ScheduleDetailModal } from "./ScheduleDetailModal";
import { CalendarModal } from "./CalendarModal";

/* ========================================
   상수 정의
======================================== */

// /* ========================================
//    캘린더 연동용 날짜 유틸리티
//    - 캘린더 API 연동 시 아래 주석을 해제하여 사용
// ======================================== */
//
// /** 오늘 날짜 기준 선택된 기간(일/주/월)의 시작일과 종료일을 계산 */
// const getDateRange = (period: Period, baseDate: Date = new Date()): { startDate: Date; endDate: Date } => {
//   const start = new Date(baseDate);
//   const end = new Date(baseDate);
//
//   switch (period) {
//     case "daily":
//       // 일간: 선택된 날짜의 00:00:00 ~ 23:59:59
//       start.setHours(0, 0, 0, 0);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case "weekly":
//       // 주간: 선택된 날짜가 속한 주의 월요일 ~ 일요일
//       const dayOfWeek = start.getDay();
//       const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
//       start.setDate(start.getDate() + diffToMonday);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(start.getDate() + 6);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case "monthly":
//       // 월간: 선택된 날짜가 속한 달의 1일 ~ 말일
//       start.setDate(1);
//       start.setHours(0, 0, 0, 0);
//       end.setMonth(end.getMonth() + 1);
//       end.setDate(0); // 이전 달의 마지막 날
//       end.setHours(23, 59, 59, 999);
//       break;
//   }
//
//   return { startDate: start, endDate: end };
// };
//
// /** 날짜를 ISO 문자열(YYYY-MM-DD)로 포맷 */
// const formatDateToISO = (date: Date): string => {
//   return date.toISOString().split("T")[0];
// };
//
// /** 선택된 기간의 표시 레이블 생성 */
// const getDateRangeLabel = (period: Period, baseDate: Date): string => {
//   const { startDate, endDate } = getDateRange(period, baseDate);
//   const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
//
//   switch (period) {
//     case "daily":
//       return baseDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
//     case "weekly":
//       return `${startDate.toLocaleDateString("ko-KR", options)} ~ ${endDate.toLocaleDateString("ko-KR", options)}`;
//     case "monthly":
//       return baseDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
//   }
// };

// 카테고리 정의 (업무, 운동, 공부, 개인, 기타)
const CATEGORIES = [
  { name: "업무", color: "#3b82f6" },
  { name: "운동", color: "#10b981" },
  { name: "공부", color: "#f59e0b" },
  { name: "개인", color: "#8b5cf6" },
  { name: "기타", color: "#ec4899" },
];

// 기본 그룹 정의 (전체 일정, 개인 일정)
// 공유된 일정은 백엔드 API에서 동적으로 받아옵니다
const DEFAULT_GROUPS = [
  { id: 1, name: "전체 일정", color: "#3b82f6", icon: "📅" },
  { id: 2, name: "개인 일정", color: "#10b981", icon: "👤" },
];

// 기간 레이블
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

// HEX 색상을 RGB로 변환
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// 채도를 낮춘 색상 생성 (이월 달성 표시용)
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
  const [period, setPeriod] = useState<Period>("weekly"); // 선택된 기간 (일/주/월)
  const [modalOpen, setModalOpen] = useState(false); // 상세 일정 모달 열림 여부
  const [modalType, setModalType] = useState<ScheduleType>("completed"); // 모달 타입 (달성/이월)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false); // 달력 모달 열림 여부
  const [selectedGroup, setSelectedGroup] = useState(DEFAULT_GROUPS[0]); // 선택된 그룹
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false); // 그룹 드롭다운 열림 여부
  const [hasPersonalSchedule] = useState(true); // 개인 일정 유무 (true면 드롭다운에 표시)

  // /* ----------------------------------------
  //    캘린더 연동용 날짜 상태
  //    - 캘린더 API 연동 시 아래 주석을 해제하여 사용
  // ---------------------------------------- */
  // const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 사용자가 선택한 기준 날짜
  //
  // // 선택된 기간(일/주/월)과 기준 날짜로 조회 범위 계산
  // const dateRange = useMemo(() => getDateRange(period, selectedDate), [period, selectedDate]);
  //
  // // 화면에 표시할 날짜 범위 레이블
  // const dateRangeLabel = useMemo(() => getDateRangeLabel(period, selectedDate), [period, selectedDate]);
  //
  // // API 요청용 ISO 포맷 날짜 문자열
  // const startDateISO = useMemo(() => formatDateToISO(dateRange.startDate), [dateRange]);
  // const endDateISO = useMemo(() => formatDateToISO(dateRange.endDate), [dateRange]);
  //
  // // 이전/다음 기간으로 이동
  // const navigateDate = (direction: "prev" | "next") => {
  //   setSelectedDate((prev) => {
  //     const newDate = new Date(prev);
  //     switch (period) {
  //       case "daily":
  //         newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
  //         break;
  //       case "weekly":
  //         newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
  //         break;
  //       case "monthly":
  //         newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
  //         break;
  //     }
  //     return newDate;
  //   });
  // };
  //
  // // 오늘 날짜로 복귀
  // const goToToday = () => {
  //   setSelectedDate(new Date());
  // };
  //
  // // CalendarModal에서 날짜 선택 시 콜백
  // const handleDateSelect = (date: Date) => {
  //   setSelectedDate(date);
  //   setCalendarModalOpen(false);
  // };

  /* ----------------------------------------
     데이터 처리
  ---------------------------------------- */
  
  // TODO: API 쿼리 - 공유된 일정 그룹 목록
  // GET /api/groups/shared
  // Response: Array<{ id: number; name: string; color: string; icon: string }>
  // 예시: [{ id: 3, name: "팀 프로젝트 일정", color: "#f59e0b", icon: "👥" }, ...]
  const sharedGroups: Array<{ id: number; name: string; color: string; icon: string }> = [];

  // 기본 그룹 + 공유된 일정 그룹을 합쳐서 전체 그룹 목록 생성
  const allGroups = useMemo(
    () => [...DEFAULT_GROUPS, ...sharedGroups],
    [sharedGroups]
  );

  // TODO: API 쿼리 - 일정 통계 데이터
  // GET /api/schedules/stats?period=${period}&groupId=${selectedGroup.id}
  // 캘린더 연동 시: GET /api/schedules/stats?startDate=${startDateISO}&endDate=${endDateISO}&groupId=${selectedGroup.id}
  const currentData = [
    { name: "업무", value: 0, completedOnTime: 0, completedCarriedOver: 0, total: 0 },
    { name: "운동", value: 0, completedOnTime: 0, completedCarriedOver: 0, total: 0 },
    { name: "공부", value: 0, completedOnTime: 0, completedCarriedOver: 0, total: 0 },
    { name: "개인", value: 0, completedOnTime: 0, completedCarriedOver: 0, total: 0 },
    { name: "기타", value: 0, completedOnTime: 0, completedCarriedOver: 0, total: 0 },
  ];

  // TODO: API 쿼리 - 루틴 달성일 데이터 (개별 루틴 스케줄)
  // GET /api/routines/achievements?period=${period}&groupId=${selectedGroup.id}
  // 캘린더 연동 시: GET /api/routines/achievements?startDate=${startDateISO}&endDate=${endDateISO}&groupId=${selectedGroup.id}
  // Response: Array<{ id: number; name: string; category: string; color: string; achievedDays: number; targetDays: number }>
  // - id: 루틴 고유 ID
  // - name: 루틴 이름 (예: "아침 조깅", "영어 공부", "프로젝트 회의")
  // - category: 카테고리 이름 (업무/운동/공부/개인/기타)
  // - color: 루틴 색상 (HEX 코드, 예: "#3b82f6")
  // - achievedDays: 달성한 일수
  // - targetDays: 목표 일수
  const currentRoutineData: Array<{ 
    id: number; 
    name: string; 
    category: string; 
    color: string; 
    achievedDays: number; 
    targetDays: number 
  }> = [];

  // TODO: API 쿼리 - 상세 일정 데이터 (달성/이월 구분)
  // GET /api/schedules/details?period=${period}&groupId=${selectedGroup.id}
  // 캘린더 연동 시: GET /api/schedules/details?startDate=${startDateISO}&endDate=${endDateISO}&groupId=${selectedGroup.id}
  // Response: { completed: Record<string, Array<Schedule>>, carriedOver: Record<string, Array<Schedule>> }
  // Schedule: { id: string; title: string; category: string; date: string; time: string }
  const detailedSchedules = {
    completed: {
      업무: [],
      운동: [],
      공부: [],
      개인: [],
      기타: [],
    },
    carriedOver: {
      업무: [],
      운동: [],
      공부: [],
      개인: [],
      기타: [],
    },
  };

  // 표시할 그룹 필터링 (개인 일정이 있을 때만 표시)
  const visibleGroups = useMemo(
    () => allGroups.filter((group) => group.name !== "개인 일정" || hasPersonalSchedule),
    [allGroups, hasPersonalSchedule]
  );

  // 차트 데이터에 고유 ID 추가 (Recharts 중복 키 경고 방지)
  const chartData = useMemo(
    () =>
      currentData.map((item, index) => ({
        ...item,
        id: `${period}-${item.name}-${index}`,
      })),
    [currentData, period]
  );

  // 카테고리 색상 맵 생성
  const categoryColors = useMemo(
    () =>
      CATEGORIES.reduce((acc, cat) => {
        acc[cat.name] = cat.color;
        return acc;
      }, {} as { [key: string]: string }),
    []
  );

  /* ----------------------------------------
     통계 계산
  ---------------------------------------- */
  const stats = useMemo(() => {
    const totalCompletedOnTime = currentData.reduce((acc, item) => acc + item.completedOnTime, 0);
    const totalCompletedCarriedOver = currentData.reduce((acc, item) => acc + item.completedCarriedOver, 0);
    const totalCompleted = totalCompletedOnTime + totalCompletedCarriedOver;
    const totalSchedules = currentData.reduce((acc, item) => acc + item.total, 0);
    const overallCompletionRate = totalSchedules > 0 ? Math.round((totalCompleted / totalSchedules) * 100) : 0;
    const carriedOverRate = totalSchedules > 0 ? Math.round((totalCompletedCarriedOver / totalSchedules) * 100) : 0;

    return {
      totalSchedules,
      totalCompleted,
      totalCarriedOver: totalCompletedCarriedOver,
      overallCompletionRate,
      carriedOverRate,
    };
  }, [currentData]);

  /* ----------------------------------------
     이벤트 핸들러
  ---------------------------------------- */
  
  // 상세 일정 모달 열기
  const handleOpenModal = (type: ScheduleType) => {
    setModalType(type);
    setModalOpen(true);
  };

  // 모든 일정 통합 (달력 모달용)
  const getAllSchedules = () => {
    const completed = detailedSchedules.completed;
    const carriedOver = detailedSchedules.carriedOver;
    const all: any[] = [];

    Object.values(completed).forEach((schedules) => {
      all.push(...schedules);
    });
    Object.values(carriedOver).forEach((schedules) => {
      all.push(...schedules);
    });

    return all;
  };

  /* ----------------------------------------
     렌더링
  ---------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ========== 헤더 ========== */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-800">일정 통계 대시보드</h1>
            </div>
            <p className="text-slate-600">카테고리별 일정 달성율과 점유율을 확인하세요</p>
          </div>

          {/* 그룹 선택 드롭다운 (알약 형태) */}
          <div className="relative">
            <button
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-3 bg-white hover:bg-slate-50 rounded-full pl-2 pr-4 py-2 shadow-lg border border-slate-200 transition-all"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: selectedGroup.color + "20" }}
              >
                {selectedGroup.icon}
              </div>
              <span className="font-medium text-slate-700 whitespace-nowrap">{selectedGroup.name}</span>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 transition-transform ${
                  groupDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* 드롭다운 메뉴 */}
            {groupDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                style={{ width: "100%" }}
              >
                {visibleGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setGroupDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                      selectedGroup.id === group.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: group.color + "20" }}
                    >
                      {group.icon}
                    </div>
                    <span className="font-medium text-slate-700">{group.name}</span>
                    {selectedGroup.id === group.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========== 루틴 달성일 박스 ========== */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">루틴 달성일</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentRoutineData.map((routine) => {
              return (
                <div key={routine.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: routine.color }} />
                    <span className="text-white font-medium text-sm">{routine.name}</span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {routine.achievedDays}/{routine.targetDays}일
                  </div>
                  <div className="text-xs text-white/80">
                    {routine.targetDays}일 중 {routine.achievedDays}일 달성
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== 기간 선택 버튼 ========== */}
        <div className="flex gap-2 mb-6">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-lg transition-all ${
                period === p
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* ========== 전체 요약 카드 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 전체 일정 카드 (달력 버튼 포함) */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 relative">
            <button
              onClick={() => setCalendarModalOpen(true)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="달력 보기"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
            </button>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-600">전체 일정</h3>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.totalSchedules}</div>
            <p className="text-sm text-slate-500 mt-1">{PERIOD_LABELS[period]} 등록된 일정</p>
          </div>

          {/* 달성한 일정 카드 */}
          <button
            onClick={() => handleOpenModal("completed")}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
          >
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

          {/* 이월된 일정 카드 */}
          <button
            onClick={() => handleOpenModal("carriedOver")}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-lg text-white hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
          >
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

        {/* ========== 메인 차트 영역 ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 카테고리별 달성율 (프로그레스 바) */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">카테고리별 달성율</h2>
            <div className="space-y-4">
              {currentData.map((item, index) => {
                const totalCompleted = item.completedOnTime + item.completedCarriedOver;
                const completionOnTimeRate = item.total > 0 ? (item.completedOnTime / item.total) * 100 : 0;
                const completionCarriedOverRate = item.total > 0 ? (item.completedCarriedOver / item.total) * 100 : 0;
                const completionRate = item.total > 0 ? Math.round((totalCompleted / item.total) * 100) : 0;
                const category = CATEGORIES[index];
                const fadedColor = getFadedColor(category.color, 0.4);

                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                          {totalCompleted} / {item.total}
                        </span>
                        <span className="font-bold text-slate-800 min-w-[45px] text-right">
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                    {/* 이중 프로그레스 바 (정시 달성 + 이월 달성) */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                      {/* 정시 달성 (진한 색) */}
                      <div
                        className="h-full rounded-full transition-all duration-500 absolute left-0"
                        style={{
                          backgroundColor: category.color,
                          width: `${completionOnTimeRate}%`,
                        }}
                      />
                      {/* 이월 달성 (연한 색) */}
                      <div
                        className="h-full rounded-full transition-all duration-500 absolute"
                        style={{
                          backgroundColor: fadedColor,
                          left: `${completionOnTimeRate}%`,
                          width: `${completionCarriedOverRate}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 카테고리별 점유율 (도넛 차트) */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200" key={`chart-container-${period}`}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              카테고리별 점유율 ({PERIOD_LABELS[period]})
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart key={`piechart-${period}`}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.id} fill={CATEGORIES[index].color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number) => [`${value}%`, "점유율"]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* 범례 */}
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {chartData.map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-2 whitespace-nowrap">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORIES[index].color }}
                  />
                  <span className="text-slate-700 text-sm">
                    {entry.name} ({entry.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== 상세 통계 테이블 ========== */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">상세 통계</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-600 font-semibold text-2xl">카테고리</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-2xl">전체</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-2xl">정시달성</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-2xl">이월달성</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-2xl">미완료</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-2xl">달성율</th>
                  <th className="text-center py-3 px-4 text-slate-600 font-semibold text-2xl">점유율</th>
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
                    <tr key={item.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="font-medium text-slate-700 text-2xl">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 text-slate-700 font-semibold text-2xl">{item.total}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-2xl" style={{ color: category.color }}>
                          <CheckCircle2 className="w-5 h-5" />
                          {item.completedOnTime}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-2xl" style={{ color: fadedColor }}>
                          <CheckCircle2 className="w-5 h-5" />
                          {item.completedCarriedOver}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-2xl">
                          <Clock className="w-5 h-5" />
                          {notCompleted}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="font-bold text-slate-800 text-2xl">{completionRate}%</span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-slate-700 font-medium text-2xl">{item.value}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== 모달 ========== */}
      
      {/* 상세 일정 모달 (달성/이월 일정 상세보기) */}
      <ScheduleDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        period={period}
        schedules={detailedSchedules[modalType]}
        categoryColors={categoryColors}
      />

      {/* 달력 모달 (전체 일정 달력 보기) */}
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