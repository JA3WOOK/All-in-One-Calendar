import { X, Clock, MapPin } from "lucide-react";

type Period = "daily" | "weekly" | "monthly";

interface Schedule {
  id: string;
  title: string;
  category: string;
  time: string;
  date: string;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: Period;
  schedules: Schedule[];
  categoryColors?: { [key: string]: string };
}

const periodLabels = {
  daily: "일간",
  weekly: "주간",
  monthly: "월간",
};

// 시간별 슬롯 생성 (일간용)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
};

// 요일 생성 (주간용)
const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
const weekDates = ["04/07", "04/08", "04/09", "04/10", "04/11", "04/12", "04/13"];

// 월간 날짜 생성 (4월은 30일까지)
const generateMonthDays = () => {
  const days = [];
  for (let i = 1; i <= 30; i++) {
    days.push(i);
  }
  return days;
};

export function CalendarModal({
  isOpen,
  onClose,
  period,
  schedules,
  categoryColors,
}: CalendarModalProps) {
  if (!isOpen) return null;

  // 일정을 시간/날짜별로 그룹화
  const groupSchedulesByTime = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    schedules.forEach((schedule) => {
      const key = period === "daily" ? schedule.time.slice(0, 2) + ":00" : schedule.date;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(schedule);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByTime();

  const renderDailyView = () => {
    const timeSlots = generateTimeSlots();
    return (
      <div className="space-y-1">
        {timeSlots.map((time) => {
          const hourSchedules = groupedSchedules[time] || [];
          return (
            <div
              key={time}
              className="flex items-start gap-3 py-3 px-4 border-b border-slate-100 hover:bg-slate-50 min-h-[60px]"
            >
              <div className="text-sm font-semibold text-slate-600 w-16 flex-shrink-0 pt-1">
                {time}
              </div>
              <div className="flex-1 space-y-2">
                {hourSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: categoryColors ? categoryColors[schedule.category] + "20" : "transparent",
                      borderLeft: categoryColors ? `3px solid ${categoryColors[schedule.category]}` : "none",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColors ? categoryColors[schedule.category] : "transparent" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm truncate">
                        {schedule.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{schedule.time}</span>
                        <span className="px-2 py-0.5 rounded-full" style={{
                          backgroundColor: categoryColors ? categoryColors[schedule.category] : "transparent",
                          color: 'white'
                        }}>
                          {schedule.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeeklyView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dateSchedules = groupedSchedules[`2026-${weekDates[index]}`] || [];
          return (
            <div key={day} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 py-2 px-3 text-center">
                <div className="font-bold text-slate-700">{day}</div>
                <div className="text-xs text-slate-500">{weekDates[index]}</div>
              </div>
              <div className="p-2 space-y-1 min-h-[300px] max-h-[400px] overflow-y-auto">
                {dateSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-2 rounded text-xs"
                    style={{
                      backgroundColor: categoryColors ? categoryColors[schedule.category] + "30" : "transparent",
                      borderLeft: categoryColors ? `2px solid ${categoryColors[schedule.category]}` : "none",
                    }}
                  >
                    <div className="font-semibold text-slate-800 mb-1 truncate">
                      {schedule.title}
                    </div>
                    <div className="text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthlyView = () => {
    const days = generateMonthDays();
    return (
      <div className="grid grid-cols-7 gap-2">
        {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
          <div key={day} className="text-center font-bold text-slate-600 py-2">
            {day}
          </div>
        ))}
        {/* 4월 1일이 화요일부터 시작 (월요일 빈 칸 1개) */}
        {/* 빈 칸 추가 */}
        <div className="border border-transparent p-2 min-h-[80px]" />
        {days.map((day) => {
          const dateStr = `2026-04-${day.toString().padStart(2, "0")}`;
          const daySchedules = groupedSchedules[dateStr] || [];
          const hasSchedules = daySchedules.length > 0;
          
          return (
            <div
              key={day}
              className={`border border-slate-200 rounded-lg p-2 min-h-[80px] ${
                hasSchedules ? "bg-blue-50" : "bg-white"
              }`}
            >
              <div className="font-semibold text-slate-700 mb-1">{day}</div>
              {hasSchedules && (
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map((schedule) => (
                    <div
                      key={schedule.id}
                      className="text-xs p-1 rounded truncate"
                      style={{
                        backgroundColor: categoryColors ? categoryColors[schedule.category] + "40" : "transparent",
                      }}
                      title={schedule.title}
                    >
                      {schedule.title}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-slate-500 font-semibold">
                      +{daySchedules.length - 2}개
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {periodLabels[period]} 캘린더
              </h2>
              <p className="text-blue-100 mt-1">2026년 4월</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6">
          {period === "daily" && renderDailyView()}
          {period === "weekly" && renderWeeklyView()}
          {period === "monthly" && renderMonthlyView()}
        </div>
      </div>
    </div>
  );
}