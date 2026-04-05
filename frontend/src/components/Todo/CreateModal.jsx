import { useState } from "react";

// ── 색상 변수 (달력 테마 맞춤) ───────────────────
const BG      = "#ffffff";
const SURFACE = "#f8f8f6";
const BORDER  = "rgba(0,0,0,0.09)";
const TEXT    = "#2d2d2d";
const MUTED   = "#9ca3af";
const ACCENT  = "#5f6368";   // 달력 버튼 색상
const DOT_P   = "#e05555";   // 달력 개인 빨강 점
const DOT_T   = "#4a80c4";   // 달력 팀 파랑 점

// ── 상수 ────────────────────────────────────────
const CATEGORIES    = ["SELF_DEV", "WORK", "HOBBY", "EXERCISE", "ETC"];
const CATEGORY_LABELS = { SELF_DEV:"자기계발", WORK:"업무", HOBBY:"취미", EXERCISE:"운동", ETC:"기타" };
const PRIORITIES    = ["LOW", "MEDIUM", "HIGH"];
const PRIORITY_LABELS = { LOW:"낮음", MEDIUM:"보통", HIGH:"높음" };
const PRIORITY_COLORS = { LOW:"#5a9e6f", MEDIUM:"#c8952a", HIGH:"#c94f4f" };
const REPEAT_TYPES  = ["daily", "weekly", "monthly"];
const REPEAT_LABELS = { daily:"일", weekly:"주", monthly:"월" };

/**
 * Props:
 *   teams        [{ team_id, team_name }]
 *   teamMembers  { [team_id]: [{ user_id, name }] }
 *   onTeamSelect (team_id) => void
 *   onClose      () => void
 *   onSubmit     (data) => void
 */
export default function CreateModal({ teams = [], teamMembers = {}, onTeamSelect, onClose, onSubmit }) {
    const [tab,   setTab]   = useState("schedule");
    const [scope, setScope] = useState("personal");

    const [title,       setTitle]       = useState("");
    const [content,     setContent]     = useState("");
    const [category,    setCategory]    = useState("");
    const [priority,    setPriority]    = useState("MEDIUM");
    const [isRepeat,    setIsRepeat]    = useState(false);
    const [repeatType,  setRepeatType]  = useState("weekly");
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [repeatEndAt, setRepeatEndAt] = useState("");

    const [teamId,   setTeamId]   = useState("");
    const [assignBy, setAssignBy] = useState("");

    const [startAt,     setStartAt]     = useState("");
    const [endAt,       setEndAt]       = useState("");
    const [description, setDescription] = useState("");
    const [location,    setLocation]    = useState("");

    const [dueDate,       setDueDate]       = useState("");
    const [isCarriedOver, setIsCarriedOver] = useState(false);

    const handleTeamChange = (id) => {
        setTeamId(id);
        setAssignBy("");
        onTeamSelect?.(id);
    };

    const handleScopeChange = (s) => {
        setScope(s);
        setTeamId("");
        setAssignBy("");
    };

    const handleSubmit = () => {
        const base = {
            category, priority,
            isRepeat,
            repeatType:     isRepeat ? repeatType    : null,
            repeatInterval,
            repeatEndAt:    isRepeat ? repeatEndAt   : null,
        };
        if (tab === "schedule") {
            onSubmit?.({ type:"schedule", scope, title, startAt, endAt, description, location,
                teamId: scope === "team" ? teamId : null, ...base });
        } else {
            onSubmit?.({ type:"todo", scope, content, dueDate, isCarriedOver,
                teamId:   scope === "team" ? teamId   : null,
                assignBy: scope === "team" ? assignBy : null,
                ...base });
        }
        onClose?.();
    };

    const members = teamId ? (teamMembers[teamId] ?? []) : [];
    const dotColor = scope === "personal" ? DOT_P : DOT_T;
    const dotLabel = scope === "personal" ? "개인" : "팀";

    return (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div style={s.modal}>

                {/* 헤더 */}
                <div style={s.header}>
                    <span style={s.iconBtn}><MenuSVG /></span>
                    <button style={s.iconBtn} onClick={onClose}><CloseSVG /></button>
                </div>

                {/* 제목 */}
                <div style={s.titleSection}>
                    {/* 달력 점 배지 */}
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <span style={{ width:7, height:7, borderRadius:"50%", background:dotColor, display:"inline-block" }} />
                        <span style={{ fontSize:11, color:dotColor, fontWeight:500 }}>{dotLabel}</span>
                    </div>

                    <input
                        style={s.titleInput}
                        placeholder="제목 추가"
                        value={tab === "todo" ? content : title}
                        onChange={(e) => tab === "todo" ? setContent(e.target.value) : setTitle(e.target.value)}
                    />

                    {/* 탭 + 개인/팀 스위치 */}
                    <div style={s.tabRow}>
                        <div style={s.tabBar}>
                            <TabBtn active={tab === "schedule"} onClick={() => setTab("schedule")}>일정</TabBtn>
                            <TabBtn active={tab === "todo"}     onClick={() => setTab("todo")}>할 일</TabBtn>
                        </div>
                        <ScopeSwitch value={scope} onChange={handleScopeChange} />
                    </div>
                </div>

                {/* 바디 */}
                <div style={s.body}>
                    {tab === "schedule" ? (
                        <>
                            <Row icon={<ClockSVG />}>
                                <div style={s.dateRow}>
                                    <input type="datetime-local" style={s.dateInput} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                                    <span style={s.dash}>시작</span>
                                    <input type="datetime-local" style={s.dateInput} value={endAt}   onChange={(e) => setEndAt(e.target.value)} />
                                    <span style={s.dash}>종료</span>
                                </div>
                            </Row>
                            {scope === "team" && (
                                <Row icon={<TeamSVG />}>
                                    <TeamSelect teams={teams} value={teamId} onChange={handleTeamChange} />
                                </Row>
                            )}
                            <Row icon={<RepeatSVG />}>
                                <ToggleRow label="반복" value={isRepeat} onChange={setIsRepeat} />
                                {isRepeat && <RepeatOptions {...{ repeatType, setRepeatType, repeatInterval, setRepeatInterval, repeatEndAt, setRepeatEndAt }} />}
                            </Row>
                            <Row icon={<LocationSVG />}>
                                <input style={s.inlineInput} placeholder="위치 추가" value={location} onChange={(e) => setLocation(e.target.value)} />
                            </Row>
                            <Row icon={<NoteSVG />}>
                                <textarea style={s.textarea} rows={2} placeholder="설명 또는 첨부파일 추가" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </Row>
                        </>
                    ) : (
                        <>
                            {scope === "team" && (
                                <Row icon={<TeamSVG />}>
                                    <TeamSelect teams={teams} value={teamId} onChange={handleTeamChange} />
                                </Row>
                            )}
                            {scope === "team" && teamId && members.length > 0 && (
                                <Row icon={<AssignSVG />}>
                                    <select style={{ ...s.select, width:"100%" }} value={assignBy} onChange={(e) => setAssignBy(e.target.value)}>
                                        <option value="">담당자 선택 (선택사항)</option>
                                        {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
                                    </select>
                                </Row>
                            )}
                            <Row icon={<ClockSVG />}>
                                <div style={{ opacity: isCarriedOver ? 0.4 : 1, pointerEvents: isCarriedOver ? "none" : "auto", display: "flex" }}>
                                    <input type="date" style={s.dateInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                </div>
                            </Row>
                            <Row icon={<CarrySVG />}>
                                <div style={s.toggleRow}>
                                    <div style={{ flex:1 , textAlign: "left"}}>
                                        <span style={{ ...s.rowLabel, display:"block", }}>자동 미루기</span>
                                        <p style={s.rowSub}>완료 못하면 다음 날로 자동 이동</p>
                                    </div>
                                    <Toggle value={isCarriedOver} onChange={setIsCarriedOver} />
                                </div>
                            </Row>
                            <Row icon={<RepeatSVG />}>
                                <ToggleRow label="반복" value={isRepeat} onChange={setIsRepeat} />
                                {isRepeat && <RepeatOptions {...{ repeatType, setRepeatType, repeatInterval, setRepeatInterval, repeatEndAt, setRepeatEndAt }} />}
                            </Row>
                        </>
                    )}

                    {/* 카테고리 */}
                    <Row icon={<TagSVG />}>
                        <Chips list={CATEGORIES} labels={CATEGORY_LABELS} active={category} onChange={setCategory} />
                    </Row>
                    {/* 우선순위 */}
                    <Row icon={<PrioritySVG />}>
                        <Chips list={PRIORITIES} labels={PRIORITY_LABELS} active={priority} onChange={setPriority} colorFn={(p) => PRIORITY_COLORS[p]} />
                    </Row>
                </div>

                {/* 푸터 */}
                <div style={s.footer}>
                    <button style={s.moreBtn}>옵션 더보기</button>
                    <button style={s.saveBtn} onClick={handleSubmit}>저장</button>
                </div>
            </div>
        </div>
    );
}

// ── 서브 컴포넌트 ────────────────────────────────

function ScopeSwitch({ value, onChange }) {
    return (
        <div style={{ display:"flex", gap:2, background:SURFACE, borderRadius:8, padding:2, border:`1px solid ${BORDER}`, marginBottom:6 }}>
            {[["personal","개인"],["team","팀"]].map(([v,l]) => (
                <button key={v} onClick={() => onChange(v)} style={{
                    background:   value === v ? "#fff" : "none",
                    border:       "none",
                    borderRadius: 6,
                    color:        value === v ? TEXT : MUTED,
                    fontSize:     13,
                    padding:      "4px 12px",
                    cursor:       "pointer",
                    fontWeight:   value === v ? 500 : 400,
                    boxShadow:    value === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>{l}</button>
            ))}
        </div>
    );
}

function TeamSelect({ teams, value, onChange }) {
    return (
        <select style={{ ...s.select, width:"100%" }} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">팀 선택</option>
            {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
        </select>
    );
}

function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            background:   "none",
            border:       "none",
            borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
            color:        active ? ACCENT : MUTED,
            fontSize:     14,
            padding:      "8px 16px",
            cursor:       "pointer",
            marginBottom: -1,
            fontWeight:   active ? 500 : 400,
        }}>{children}</button>
    );
}

function Row({ icon, children }) {
    return (
        <div style={{ display:"flex", gap:14, padding:"10px 16px", alignItems:"flex-start" }}>
            <span style={{ marginTop:2, flexShrink:0, color:MUTED }}>{icon}</span>
            <div style={{ flex:1, minWidth:0 }}>{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }) {
    return (
        <button onClick={() => onChange(!value)} style={{
            width:        40,
            height:       22,
            borderRadius: 11,
            border:       "none",
            cursor:       "pointer",
            padding:      0,
            position:     "relative",
            flexShrink:   0,
            background:   value ? ACCENT : "rgba(0,0,0,0.15)",
        }}>
      <span style={{
          position:   "absolute",
          top:        3,
          left:       0,
          width:      16,
          height:     16,
          borderRadius: 8,
          background: "#fff",
          transform:  value ? "translateX(18px)" : "translateX(2px)",
          display:    "block",
          boxShadow:  "0 1px 3px rgba(0,0,0,0.2)",
      }} />
        </button>
    );
}

function ToggleRow({ label, value, onChange }) {
    return (
        <div style={s.toggleRow}>
            <span style={s.rowLabel}>{label}</span>
            <Toggle value={value} onChange={onChange} />
        </div>
    );
}

function RepeatOptions({ repeatType, setRepeatType, repeatInterval, setRepeatInterval, repeatEndAt, setRepeatEndAt }) {
    return (
        <div style={{ marginTop:10, background:SURFACE, borderRadius:8, padding:"12px 14px",
            display:"flex", flexDirection:"column", gap:12, border:`1px solid ${BORDER}` }}>

            {/* 반복 주기 */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:MUTED, minWidth:28 }}>매</span>
                <select style={{ flex:1, ...s.select }} value={repeatType} onChange={(e) => setRepeatType(e.target.value)}>
                    {REPEAT_TYPES.map((t) => <option key={t} value={t}>{REPEAT_LABELS[t].replace("매","")}</option>)}
                </select>
                <input type="number" min={1} max={99} style={{ width:56, ...s.select, textAlign:"center" }}
                       value={repeatInterval} onChange={(e) => setRepeatInterval(Number(e.target.value))} />
                <span style={{ fontSize:13, color:MUTED }}>회 반복</span>
            </div>

            {/* 구분선 */}
            <div style={{ height:1, background:BORDER }} />

            {/* 종료일 */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:MUTED, minWidth:28 }}>종료</span>
                <input type="date" style={{ flex:1, ...s.dateInput }}
                       value={repeatEndAt} onChange={(e) => setRepeatEndAt(e.target.value)} />
            </div>

        </div>
    );
}

function Chips({ list, labels, active, onChange, colorFn }) {
    return (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {list.map((v) => {
                const on  = active === v;
                const col = colorFn?.(v) ?? "";
                return (
                    <button key={v} onClick={() => onChange(v)} style={{
                        background:   on ? (col ? col + "15" : "#f0f0f0") : SURFACE,
                        border:       `1px solid ${on ? (col || ACCENT) : BORDER}`,
                        borderRadius: 6,
                        color:        on ? (col || TEXT) : MUTED,
                        fontSize:     12,
                        padding:      "5px 12px",
                        cursor:       "pointer",
                        fontWeight:   on ? 500 : 400,
                    }}>{labels[v]}</button>
                );
            })}
        </div>
    );
}

// ── 아이콘 ───────────────────────────────────────
const Ic = ({ d }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const ClockSVG    = () => <Ic d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l4 2" />;
const RepeatSVG   = () => <Ic d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4m14 2v2a4 4 0 0 1-4 4H3" />;
const LocationSVG = () => <Ic d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />;
const NoteSVG     = () => <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />;
const TagSVG      = () => <Ic d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" />;
const PrioritySVG = () => <Ic d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
const CarrySVG    = () => <Ic d="M5 12h14M12 5l7 7-7 7" />;
const TeamSVG     = () => <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />;
const AssignSVG   = () => <Ic d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
const MenuSVG = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);
const CloseSVG = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

// ── 스타일 ───────────────────────────────────────
const s = {
    overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
    modal:        { background:BG, borderRadius:12, width:460, maxHeight:"90vh", overflowY:"auto", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(0,0,0,0.12)" },
    header:       { display:"flex", justifyContent:"space-between", padding:"12px 16px 0" },
    iconBtn:      { background:"none", border:"none", cursor:"pointer", color:MUTED, padding:4, borderRadius:4, display:"flex", alignItems:"center" },
    titleSection: { padding:"8px 16px 0" },
    titleInput:   { width:"100%", background:"none", border:"none", borderBottom:`2px solid ${ACCENT}`, color:TEXT, fontSize:22, fontWeight:400, padding:"4px 0 8px", outline:"none", boxSizing:"border-box" },
    tabRow:       { display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12, borderBottom:`1px solid ${BORDER}` },
    tabBar:       { display:"flex" },
    body:         { padding:"8px 0 0" },
    dateRow:      { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
    dateInput:    { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, fontSize:13, padding:"6px 10px", outline:"none", colorScheme: "light" },
    dash:         { color:MUTED, fontSize:13 },
    select:       { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, fontSize:13, padding:"6px 10px", outline:"none", cursor:"pointer" },
    toggleRow:    { display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", gap:12 },
    rowLabel:     { color:TEXT, fontSize:14 },
    rowSub:       { color:MUTED, fontSize:12, margin:"2px 0 0" },
    inlineInput:  { background:"none", border:"none", borderBottom:`1px solid ${BORDER}`, color:TEXT, fontSize:14, padding:"4px 0", outline:"none", width:"100%" },
    textarea:     { background:"none", border:"none", borderBottom:`1px solid ${BORDER}`, color:TEXT, fontSize:14, padding:"4px 0", outline:"none", width:"100%", resize:"none", fontFamily:"inherit" },
    footer:       { display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8, padding:"12px 16px", borderTop:`1px solid ${BORDER}`, marginTop:8 },
    moreBtn:      { background:"none", border:"none", color:MUTED, fontSize:13, cursor:"pointer", padding:"6px 12px", borderRadius:6 },
    saveBtn:      { background:ACCENT, border:"none", color:"#fff", fontSize:14, fontWeight:500, padding:"8px 20px", borderRadius:8, cursor:"pointer" },
};