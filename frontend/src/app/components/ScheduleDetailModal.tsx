import { X } from "lucide-react";

type ScheduleType = "completed" | "carriedOver";
type Period = "daily" | "weekly" | "monthly";

interface Schedule {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
}

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ScheduleType;
  period: Period;
  schedules: { [key: string]: Schedule[] };
  categoryColors: { [key: string]: string };
}

const periodLabels = {
  daily: "일간",
  weekly: "주간",
  monthly: "월간",
};

const typeLabels = {
  completed: "달성한 일정",
  carriedOver: "이월된 일정",
};

const typeColors = {
  completed: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100",
  },
  carriedOver: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100",
  },
};

export function ScheduleDetailModal({
  isOpen,
  onClose,
  type,
  period,
  schedules,
  categoryColors,
}: ScheduleDetailModalProps) {
  if (!isOpen) return null;

  const colors = typeColors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* 헤더 */}
        <div className={`${colors.bg} border-b ${colors.border} px-6 py-5`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${colors.text}`}>
                {typeLabels[type]}
              </h2>
              <p className="text-slate-600 mt-1">
                {periodLabels[period]} 카테고리별 일정 목록
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="overflow-y-auto max-h-[calc(85vh-88px)] p-6">
          <div className="space-y-6">
            {Object.entries(schedules).map(([category, items]) => (
              <div key={category} className="space-y-3">
                {/* 카테고리 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoryColors[category] }}
                  />
                  <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
                  <span className={`${colors.badge} ${colors.text} px-3 py-1 rounded-full text-sm font-semibold`}>
                    {items.length}개
                  </span>
                </div>

                {/* 일정 카드들 */}
                <div className="grid gap-3">
                  {items.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 mb-2">
                            {schedule.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              📅 {schedule.date}
                            </span>
                            <span className="flex items-center gap-1">
                              🕐 {schedule.time}
                            </span>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: categoryColors[category] }}
                        >
                          {category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(schedules).length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg">일정이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
