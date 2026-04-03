import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import './App.css';

function App() {
  const [dbEvents, setDbEvents] = useState([]);
  const [mainDate, setMainDate] = useState(new Date());
  const [miniDate, setMiniDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false); // 일정 생성 모달 상태
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); // 그룹 모달 
  const [currentView, setCurrentView] = useState('dayGridMonth'); // 기본값: 월간
  const [isGroupOpen, setIsGroupOpen] = useState(true); // 그룹 섹션 열림 여부
  const [isPersonalOpen, setIsPersonalOpen] = useState(true); // 개인 섹션 열림 여부
  const [selectedEvent, setSelectedEvent] = useState(null); // 클릭한 일정 저장용
  const [teams, setTeams] = useState([]); // 팀 목록 저장용 상태 추가


  const [filters, setFilters] = useState({
    personal: true, // 개인 일정 노출 여부
    teams: {},     // 팀 일정 노출 여부
    study: false,    // 스터디 그룹 
    holidays: true  // 공휴일 노출 여부
  });

  const calendarRef = useRef(null);

  // 1. 데이터 불러오기 (백엔드 연동 및 공휴일 구분)
  const fetchSchedules = () => {
    fetch('http://localhost:3001/api/schedules')
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item) => {
          // 공휴일 처리
          if (item.id && String(item.id).startsWith('holiday')) {
            return {
              id: item.id,
              title: item.title,
              start: item.start,
              backgroundColor: 'transparent',
              textColor: '#ff4d4f',
              borderColor: 'transparent',
              allDay: true,
              display: 'block'
            };
          }

          // 일반 일정 처리
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
      .catch((err) => console.error("데이터 로딩 에러:", err));
  };

  // 1-1. 팀 목록 불러오기 함수 정의 (fetchSchedules 아래에 추가)
  const fetchTeams = () => {
    fetch('http://localhost:3001/api/teams')
      .then((res) => res.json())
      .then((data) => {
        setTeams(data);

        // 불러온 팀들의 ID를 추출해서 모두 'true'로 초기 세팅합니다.
        const initialTeamFilters = {};
        data.forEach(team => {
          initialTeamFilters[team.team_id] = true;
        });

        setFilters(prev => ({
          ...prev,
          teams: initialTeamFilters
        }));
      })
      .catch((err) => console.error("팀 로딩 에러:", err));
  };

  useEffect(() => {
    fetchSchedules();
    fetchTeams();
  }, []);

  // 2. 미니 달력 제어
  const handleMiniPrev = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1));
  const handleMiniNext = () => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1));

  const renderMiniDays = () => {
    const year = miniDate.getFullYear();
    const month = miniDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = [];

    // 빈 칸 처리
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="mini-day empty"></div>);
    }

    // 날짜 출력 및 점(Dot) 로직
    for (let d = 1; d <= lastDay; d++) {
      // 해당 날짜에 일정이 있는지 확인하는 로직
      const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // 해당 날짜의 이벤트들 찾기
      const dayEvents = dbEvents.filter(event => event.start && event.start.startsWith(currentStr));

      // 점 표시 여부 판단
      const hasPersonal = dayEvents.some(e => !e.extendedProps?.team_id);
      const hasTeam = dayEvents.some(e => e.extendedProps?.team_id && !e.extendedProps?.is_study);
      const hasStudy = dayEvents.some(e => e.extendedProps?.is_study);

      days.push(
        <div
          key={d}
          className="mini-day"
          onClick={() => calendarRef.current.getApi().gotoDate(new Date(year, month, d))}
        >
          <span className="day-number">{d}</span>

          {/* 💡 시안처럼 날짜 아래에 점을 표시하는 컨테이너 */}
          <div className="mini-dot-container">
            {hasPersonal && <span className="mini-dot personal-dot"></span>}
            {hasTeam && <span className="mini-dot team-dot"></span>}
            {hasStudy && <span className="mini-dot study-dot"></span>}
          </div>
        </div>
      );
    }
    return days;
  };

  // 3. 일정 클릭 시 (수정/삭제 모달 열기)
  const handleEventClick = (info) => {
    // 공휴일은 클릭해도 아무 일 안 일어나게 방지
    if (info.event.id && String(info.event.id).startsWith('holiday')) return;

    // 클릭한 일정의 데이터를 모달에 미리 채워주기 위해 상태 업데이트
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      // 날짜 형식을 <input type="datetime-local">이 인식할 수 있는 YYYY-MM-DDTHH:mm 형태로 변환
      start: info.event.startStr.slice(0, 16),
      end: info.event.end ? info.event.endStr.slice(0, 16) : info.event.startStr.slice(0, 16),
    });

    // 모달 열기
    setIsModalOpen(true);
  };

  // 4. 일정 생성 & 수정 
  const handleSaveSchedule = (e) => {
    e.preventDefault();

    const formData = {
      title: e.target.title.value,
      start_at: e.target.start.value,
      end_at: e.target.end.value,
      description: "",     // 추가 설명 (일단 빈 값)
      priority: "MEDIUM",  // 우선순위 기본값
      category: "ETC",     // 카테고리 기본값
      user_id: 1,          // 생성 시 사용
      updated_by: 1        // 수정 시 모델이 찾는 이름
    };

    // 수정인지 생성인지에 따라 URL과 Method 결정
    const url = selectedEvent
      ? `http://localhost:3001/api/schedules/${selectedEvent.id}`
      : 'http://localhost:3001/api/schedules';

    const method = selectedEvent ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then((res) => {
        if (!res.ok) throw new Error('저장 실패');
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false); // 모달 닫기
        setSelectedEvent(null); // 선택 초기화
        fetchSchedules(); // 목록 새로고침
      })
      .catch((err) => {
        console.error("저장 에러:", err);
        alert("일정 저장에 실패했습니다.");
      });
  };
  // 5. 그룹 저장
  const handleSaveGroup = (e) => {
    e.preventDefault();
    const groupData = {
      name: e.target.groupName.value,
      user_id: 1 // 테스트용
    };

    fetch('http://localhost:3001/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData)
    })
      .then((res) => {
        if (!res.ok) throw new Error('그룹 생성 실패');
        return res.json();
      })
      .then(() => {
        alert("새 그룹이 생성되었습니다!");
        setIsGroupModalOpen(false);
        fetchTeams();
      })
      .catch((err) => alert(err.message));
  };

  // 필터링 로직 (오타 수정: filters.holiday -> filters.holidays)
  const filteredEvents = dbEvents.filter(event => {
    if (event.id && String(event.id).startsWith('holiday')) return filters.holidays;
    if (event.extendedProps?.team_id) return filters.team;
    return filters.personal;
  });

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="mini-calendar-card">
          <div className="mini-header">
            <ChevronLeft size={16} className="cursor-pointer" onClick={handleMiniPrev} />
            <strong className="mini-month-name">{miniDate.toLocaleString('en-US', { month: 'long' })}</strong>
            <ChevronRight size={16} className="cursor-pointer" onClick={handleMiniNext} />
          </div>
          <div className="mini-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (<div key={d} className="mini-day-label">{d}</div>))}
            {renderMiniDays()}
          </div>
        </div>

        {/* --- 그룹 섹션 --- */}
        <div className="category-section">
          <div className="category-header" onClick={() => setIsGroupOpen(!isGroupOpen)}>
            <span>그룹</span>
            <div className="header-icons">
              <Plus
                size={14}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // 폴더가 접히는 이벤트 방지
                  setIsGroupModalOpen(true);
                }}
              />
              <span className={`arrow ${isGroupOpen ? 'up' : 'down'}`}>▲</span>
            </div>
          </div>

          {isGroupOpen && (
            <div className="category-list">
              {teams.map((team) => (
                <div key={team.team_id} className="category-item">
                  <input
                    type="checkbox"
                    // 💡 핵심: 전체 team이 아니라, 현재 팀의 ID에 해당하는 값만 확인
                    checked={filters.teams[team.team_id] || false}
                    onChange={() => {
                      setFilters({
                        ...filters,
                        teams: {
                          ...filters.teams,
                          [team.team_id]: !filters.teams[team.team_id] // 클릭한 팀만 반전!
                        }
                      });
                    }}
                  />
                  <span>{team.team_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- 개인 섹션 --- */}
        <div className="category-section">
          <div className="category-header" onClick={() => setIsPersonalOpen(!isPersonalOpen)}>
            <span>개인</span>
            <span className={`arrow ${isPersonalOpen ? 'up' : 'down'}`}>▲</span>
          </div>

          {isPersonalOpen && (
            <div className="category-list">
              <div className="category-item">
                <input
                  type="checkbox"
                  checked={filters.personal}
                  onChange={() => setFilters({ ...filters, personal: !filters.personal })}
                  className="check-personal"
                />
                <span>개인 일정</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h2 className="main-month-title">{mainDate.getFullYear()}년 {mainDate.getMonth() + 1}월</h2>
          <div className="button-group">
            <button className="btn-outline" onClick={() => setIsGroupModalOpen(true)}>그룹 생성</button>
            <button className="btn-outline" onClick={() => setIsModalOpen(true)}>일정 생성</button>
            <div className="view-toggle">
              <button
                className={`toggle-btn ${currentView === 'timeGridDay' ? 'active' : ''}`}
                onClick={() => {
                  calendarRef.current.getApi().changeView('timeGridDay');
                  setCurrentView('timeGridDay');
                }}> 일간 </button>

              <button
                className={`toggle-btn ${currentView === 'timeGridWeek' ? 'active' : ''}`}
                onClick={() => {
                  calendarRef.current.getApi().changeView('timeGridWeek');
                  setCurrentView('timeGridWeek');
                }}> 주간 </button>

              <button
                className={`toggle-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`}
                onClick={() => {
                  calendarRef.current.getApi().changeView('dayGridMonth');
                  setCurrentView('dayGridMonth');
                }}> 월간 </button>
            </div>

          </div>
        </header>

        <div className="calendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]} // 👈 추가됨
            initialView="dayGridMonth"
            locale="ko"
            headerToolbar={{ left: 'prev,next today', center: '', right: '' }}
            height="82vh"
            events={filteredEvents}
            eventClick={handleEventClick}
            datesSet={(arg) => setMainDate(arg.view.currentStart)}
            dayMaxEvents={true}
          />
        </div>
      </main>

      {/* 일정 생성 모달 UI */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedEvent ? "📅 일정 수정/삭제" : "📅 새 일정 추가"}</h3>
            <form onSubmit={handleSaveSchedule}>
              <input name="title" defaultValue={selectedEvent?.title || ""} placeholder="일정 제목" required />
              <input name="start" type="datetime-local" defaultValue={selectedEvent?.start || ""} required />
              <input name="end" type="datetime-local" defaultValue={selectedEvent?.end || ""} required />

              <div className="modal-btns">
                <button type="submit" className="save-btn">
                  {selectedEvent ? "수정 저장" : "저장"}
                </button>

                {selectedEvent && (
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => {
                      if (window.confirm("정말 삭제할까요?")) {
                        fetch(`http://localhost:3001/api/schedules/${selectedEvent.id}`, { method: 'DELETE' })
                          .then(() => { setIsModalOpen(false); setSelectedEvent(null); fetchSchedules(); });
                      }
                    }}
                  >삭제</button>
                )}

                <button type="button" onClick={() => { setIsModalOpen(false); setSelectedEvent(null); }}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 그룹 생성 모달 (추가) */}
      {isGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>👥 새 그룹 추가</h3>
            <form onSubmit={handleSaveGroup}>
              <input name="groupName" placeholder="그룹 이름 (예: 팀 프로젝트)" required />
              <div className="modal-btns">
                <button type="submit" className="save-btn">저장</button>
                <button type="button" onClick={() => setIsGroupModalOpen(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;