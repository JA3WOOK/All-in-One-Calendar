import { X } from "lucide-react";

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

/**
 * 일정 상세 모달 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 콜백
 * @param {"completed" | "carriedOver"} props.type - 일정 타입
 * @param {"daily" | "weekly" | "monthly"} props.period - 기간
 * @param {Object} props.schedules - 카테고리별 일정 객체
 * @param {Object} props.categoryColors - 카테고리 색상 맵
 */
export function ScheduleDetailModal({
  isOpen,
  onClose,
  type,
  period,
  schedules,
  categoryColors,
}) {
  if (!isOpen) return null;

  const colors = typeColors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className={`${colors.bg} border-b ${colors.border} px-8 py-5`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-normal ${colors.text}`}>
                {typeLabels[type]}
              </h2>
              <p className="text-slate-500 mt-1 text-base font-light">
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
        <div className="overflow-y-auto max-h-[calc(85vh-96px)] p-8 bg-slate-50">
          <div className="space-y-6">
            {Object.entries(schedules).map(([category, items]) => (
              <div key={category} className="space-y-3">
                {/* 카테고리 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[category] }}
                  />
                  <h3 className="font-normal text-slate-900 text-lg">{category}</h3>
                  <span className={`${colors.badge} ${colors.text} px-4 py-1 rounded-full text-sm font-normal`}>
                    {items.length}개
                  </span>
                </div>

                {/* 일정 카드들 */}
                <div className="grid gap-3">
                  {items.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-normal text-slate-800 mb-2 text-base">
                            {schedule.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-slate-500 font-light">
                            <span className="flex items-center gap-1">
                              📅 {schedule.date}
                            </span>
                            <span className="flex items-center gap-1">
                              🕐 {schedule.time}
                            </span>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-sm font-normal text-white"
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
                <p className="text-lg font-light">일정이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}