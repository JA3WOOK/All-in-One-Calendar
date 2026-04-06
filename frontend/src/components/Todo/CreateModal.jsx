import { useState } from "react";

// ── 색상 변수 ────────────────────────────────────
const BG      = "#ffffff";
const SURFACE = "#f8f8f6";
const BORDER  = "rgba(0,0,0,0.09)";
const TEXT    = "#2d2d2d";
const MUTED   = "#9ca3af";
const ACCENT  = "#5f6368";
const DOT_P   = "#e05555";
const DOT_T   = "#4a80c4";
const DANGER  = "#c94f4f";

// ── 상수 ────────────────────────────────────────
const CATEGORIES      = ["SELF_DEV", "WORK", "HOBBY", "EXERCISE", "ETC"];
const CATEGORY_LABELS = { SELF_DEV:"자기계발", WORK:"업무", HOBBY:"취미", EXERCISE:"운동", ETC:"기타" };
const PRIORITIES      = ["LOW", "MEDIUM", "HIGH"];
const PRIORITY_LABELS = { LOW:"낮음", MEDIUM:"보통", HIGH:"높음" };
const PRIORITY_COLORS = { LOW:"#5a9e6f", MEDIUM:"#c8952a", HIGH:"#c94f4f" };
const REPEAT_TYPES    = ["daily", "weekly", "monthly"];
const REPEAT_LABELS   = { daily:"일", weekly:"주", monthly:"월" };

/**
 * Props:
 *   defaultDate  "YYYY-MM-DD"   — 날짜 클릭 시 자동 입력 (신규 생성용)
 *   initialData  object | null  — 수정 모드: 기존 데이터
 *     { type, id, scope, title, content, startAt, endAt, description, location,
 *       dueDate, category, priority, isCarriedOver, isRepeat, repeatType,
 *       repeatInterval, repeatEndAt, repeatGroupId, teamId, assignBy, isDone }
 *   teams        [{ team_id, team_name }]
 *   teamMembers  { [team_id]: [{ user_id, name }] }
 *   onTeamSelect (team_id) => void
 *   onClose      () => void
 *   onSubmit     (data) => void
 *   onDelete     (data) => void | null
 */
export default function CreateModal({
                                        defaultDate  = "",
                                        initialData  = null,
                                        teams        = [],
                                        teamMembers  = {},
                                        onTeamSelect,
                                        onClose,
                                        onSubmit,
                                        onDelete,
                                    }) {
    const isEdit = !!initialData;

    // ── 탭 / 스코프 ─────────────────────────────
    const [tab,   setTab]   = useState(initialData?.type  ?? "schedule");
    const [scope, setScope] = useState(initialData?.scope ?? "personal");

    // ── 공통 필드 ────────────────────────────────
    const [category,       setCategory]       = useState(initialData?.category       ?? "");
    const [priority,       setPriority]       = useState(initialData?.priority       ?? "MEDIUM");
    const [isRepeat,       setIsRepeat]       = useState(initialData?.isRepeat       ?? false);
    const [repeatType,     setRepeatType]     = useState(initialData?.repeatType     ?? "weekly");
    const [repeatInterval, setRepeatInterval] = useState(initialData?.repeatInterval ?? 1);
    const [repeatEndAt,    setRepeatEndAt]    = useState(initialData?.repeatEndAt    ?? "");

    // ── 팀 ──────────────────────────────────────
    const [teamId,   setTeamId]   = useState(String(initialData?.teamId   ?? ""));
    const [assignBy, setAssignBy] = useState(String(initialData?.assignBy ?? ""));

    // ── 일정 전용 ────────────────────────────────
    const defaultStart = defaultDate ? `${defaultDate}T09:00` : "";
    const defaultEnd   = defaultDate ? `${defaultDate}T10:00` : "";
    const [title,       setTitle]       = useState(initialData?.title       ?? "");
    const [startAt,     setStartAt]     = useState(initialData?.startAt     ?? defaultStart);
    const [endAt,       setEndAt]       = useState(initialData?.endAt       ?? defaultEnd);
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [location,    setLocation]    = useState(initialData?.location    ?? "");

    // ── Todo 전용 ────────────────────────────────
    const [content,       setContent]       = useState(initialData?.content       ?? "");
    const [dueDate,       setDueDate]       = useState(initialData?.dueDate       ?? defaultDate);
    const [isCarriedOver, setIsCarriedOver] = useState(initialData?.isCarriedOver ?? false);
    const [isDone,        setIsDone]        = useState(initialData?.isDone        ?? false);

    // ── 삭제 범위 (반복 Todo) ─────────────────────
    const [deleteScope,   setDeleteScope]   = useState("only");
    const hasRepeatGroup = !!(initialData?.repeatGroupId);

    // ── 핸들러 ──────────────────────────────────
    const handleTeamChange = (id) => {
        setTeamId(id);
        setAssignBy("");
        onTeamSelect?.(id);
    };

    const handleScopeChange = (s) => {
        if (isEdit) return;
        setScope(s);
        setTeamId("");
        setAssignBy("");
    };

    const handleSubmit = () => {
        const base = {
            id: initialData?.id ?? null,
            category, priority,
            isRepeat,
            repeatType:     isRepeat ? repeatType     : null,
            repeatInterval: isRepeat ? repeatInterval : 1,
            repeatEndAt:    isRepeat ? repeatEndAt    : null,
        };
        if (tab === "schedule") {
            onSubmit?.({ type:"schedule", scope, title, startAt, endAt, description, location,
                teamId: scope === "team" ? teamId : null, ...base });
        } else {
            onSubmit?.({ type:"todo", scope, content, dueDate, isCarriedOver, isDone,
                teamId:   scope === "team" ? teamId   : null,
                assignBy: scope === "team" ? assignBy : null,
                ...base });
        }
        onClose?.();
    };

    const handleDelete = () => {
        if (!window.confirm(
            deleteScope === "group"
                ? "반복되는 모든 일정을 삭제할까요?"
                : "이 일정을 삭제할까요?"
        )) return;
        onDelete?.({
            id:            initialData?.id,
            type:          tab,
            scope:         deleteScope,
            repeatGroupId: initialData?.repeatGroupId ?? null,
        });
        onClose?.();
    };

    const members  = teamId ? (teamMembers[teamId] ?? []) : [];
    const dotColor = scope === "personal" ? DOT_P : DOT_T;
    const dotLabel = scope === "personal" ? "개인" : "팀";

    return (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div style={s.modal}>

                {/* ── 헤더 ── */}
                <div style={s.header}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={s.iconBtn}><MenuSVG /></span>
                        {isEdit && (
                            <span style={{
                                fontSize:11, fontWeight:600, color:ACCENT,
                                background:SURFACE, border:`1px solid ${BORDER}`,
                                borderRadius:4, padding:"2px 8px", letterSpacing:"0.03em",
                            }}>수정 중</span>
                        )}
                    </div>
                    <button style={s.iconBtn} onClick={onClose}><CloseSVG /></button>
                </div>

                {/* ── 제목 ── */}
                <div style={s.titleSection}>
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
                    <div style={s.tabRow}>
                        <div style={s.tabBar}>
                            <TabBtn active={tab === "schedule"} onClick={() => !isEdit && setTab("schedule")} disabled={isEdit}>일정</TabBtn>
                            <TabBtn active={tab === "todo"}     onClick={() => !isEdit && setTab("todo")}     disabled={isEdit}>할 일</TabBtn>
                        </div>
                        <ScopeSwitch value={scope} onChange={handleScopeChange} disabled={isEdit} />
                    </div>
                </div>

                {/* ── 바디 ── */}
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
                                    <TeamSelect teams={teams} value={teamId} onChange={handleTeamChange} disabled={isEdit} />
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
                            {/* 완료 토글 — 수정 모드에서만 표시 */}
                            {isEdit && (
                                <Row icon={<DoneSVG />}>
                                    <div style={s.toggleRow}>
                                        <div style={{ flex:1 }}>
                                            <span style={{ ...s.rowLabel, display:"block",
                                                textDecoration: isDone ? "line-through" : "none",
                                                color: isDone ? MUTED : TEXT }}>완료 처리</span>
                                            <p style={s.rowSub}>{isDone ? "완료된 할 일입니다" : "체크하면 달력에서 취소선으로 표시"}</p>
                                        </div>
                                        <Toggle value={isDone} onChange={setIsDone} activeColor="#5a9e6f" />
                                    </div>
                                </Row>
                            )}
                            {scope === "team" && (
                                <Row icon={<TeamSVG />}>
                                    <TeamSelect teams={teams} value={teamId} onChange={handleTeamChange} disabled={isEdit} />
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
                                <div style={{ opacity: isCarriedOver ? 0.4 : 1, pointerEvents: isCarriedOver ? "none" : "auto", display:"flex" }}>
                                    <input type="date" style={s.dateInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                </div>
                            </Row>
                            <Row icon={<CarrySVG />}>
                                <div style={s.toggleRow}>
                                    <div style={{ flex:1, textAlign:"left" }}>
                                        <span style={{ ...s.rowLabel, display:"block" }}>자동 미루기</span>
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

                    <Row icon={<TagSVG />}>
                        <Chips list={CATEGORIES} labels={CATEGORY_LABELS} active={category} onChange={setCategory} />
                    </Row>
                    <Row icon={<PrioritySVG />}>
                        <Chips list={PRIORITIES} labels={PRIORITY_LABELS} active={priority} onChange={setPriority} colorFn={(p) => PRIORITY_COLORS[p]} />
                    </Row>

                    {/* 삭제 범위 선택 — 반복 Todo 수정 모드에서만 */}
                    {isEdit && onDelete && hasRepeatGroup && (
                        <div style={{ margin:"8px 16px 0", padding:"12px 14px",
                            background:SURFACE, borderRadius:8, border:`1px solid ${BORDER}` }}>
                            <p style={{ fontSize:12, color:MUTED, margin:"0 0 8px" }}>삭제 범위</p>
                            <div style={{ display:"flex", gap:6 }}>
                                {[["only","이 일정만"],["group","모든 반복 일정"]].map(([v, l]) => (
                                    <button key={v} onClick={() => setDeleteScope(v)} style={{
                                        flex:1, padding:"6px 10px", borderRadius:6, fontSize:12,
                                        cursor:"pointer", fontWeight: deleteScope === v ? 500 : 400,
                                        background: deleteScope === v ? DANGER + "15" : BG,
                                        border: `1px solid ${deleteScope === v ? DANGER : BORDER}`,
                                        color:  deleteScope === v ? DANGER : MUTED,
                                    }}>{l}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 푸터 ── */}
                <div style={s.footer}>
                    {isEdit && onDelete ? (
                        <button style={s.deleteBtn} onClick={handleDelete}>
                            <TrashSVG />삭제
                        </button>
                    ) : (
                        <span />
                    )}
                    <div style={{ display:"flex", gap:8 }}>
                        <button style={s.cancelBtn} onClick={onClose}>취소</button>
                        <button style={s.saveBtn}   onClick={handleSubmit}>
                            {isEdit ? "수정 저장" : "저장"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── 서브 컴포넌트 ─────────────────────────────────

function ScopeSwitch({ value, onChange, disabled }) {
    return (
        <div style={{ display:"flex", gap:2, background:SURFACE, borderRadius:8, padding:2,
            border:`1px solid ${BORDER}`, marginBottom:6,
            opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
            {[["personal","개인"],["team","팀"]].map(([v, l]) => (
                <button key={v} onClick={() => onChange(v)} style={{
                    background:   value === v ? "#fff" : "none",
                    border:       "none",
                    borderRadius: 6,
                    color:        value === v ? TEXT : MUTED,
                    fontSize:     13,
                    padding:      "4px 12px",
                    cursor:       disabled ? "default" : "pointer",
                    fontWeight:   value === v ? 500 : 400,
                    boxShadow:    value === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>{l}</button>
            ))}
        </div>
    );
}

function TeamSelect({ teams, value, onChange, disabled }) {
    return (
        <select style={{ ...s.select, width:"100%", opacity: disabled ? 0.6 : 1 }}
                value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            <option value="">팀 선택</option>
            {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
        </select>
    );
}

function TabBtn({ active, onClick, children, disabled }) {
    return (
        <button onClick={onClick} style={{
            background:   "none",
            border:       "none",
            borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
            color:        active ? ACCENT : MUTED,
            fontSize:     14,
            padding:      "8px 16px",
            cursor:       disabled ? "default" : "pointer",
            marginBottom: -1,
            fontWeight:   active ? 500 : 400,
            opacity:      disabled && !active ? 0.4 : 1,
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

function Toggle({ value, onChange, activeColor = ACCENT }) {
    return (
        <button onClick={() => onChange(!value)} style={{
            width:40, height:22, borderRadius:11, border:"none",
            cursor:"pointer", padding:0, position:"relative", flexShrink:0,
            background: value ? activeColor : "rgba(0,0,0,0.15)",
            transition: "background 0.2s",
        }}>
            <span style={{
                position:"absolute", top:3, left:0,
                width:16, height:16, borderRadius:8, background:"#fff",
                transform: value ? "translateX(18px)" : "translateX(2px)",
                display:"block", boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                transition: "transform 0.2s",
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
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:MUTED, minWidth:28 }}>매</span>
                <select style={{ flex:1, ...s.select }} value={repeatType} onChange={(e) => setRepeatType(e.target.value)}>
                    {REPEAT_TYPES.map((t) => <option key={t} value={t}>{REPEAT_LABELS[t]}</option>)}
                </select>
                <input type="number" min={1} max={99} style={{ width:56, ...s.select, textAlign:"center" }}
                       value={repeatInterval} onChange={(e) => setRepeatInterval(Number(e.target.value))} />
                <span style={{ fontSize:13, color:MUTED }}>회 반복</span>
            </div>
            <div style={{ height:1, background:BORDER }} />
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
                        fontSize:     12, padding:"5px 12px",
                        cursor:"pointer", fontWeight: on ? 500 : 400,
                    }}>{labels[v]}</button>
                );
            })}
        </div>
    );
}

// ── 아이콘 ───────────────────────────────────────
const Ic = ({ d }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
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
const DoneSVG     = () => <Ic d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />;
const TrashSVG    = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ display:"inline-block", verticalAlign:"middle", marginRight:5 }}>
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
);
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
    overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
    modal:       { background:BG, borderRadius:12, width:460, maxHeight:"90vh", overflowY:"auto", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(0,0,0,0.12)" },
    header:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px 0" },
    iconBtn:     { background:"none", border:"none", cursor:"pointer", color:MUTED, padding:4, borderRadius:4, display:"flex", alignItems:"center" },
    titleSection:{ padding:"8px 16px 0" },
    titleInput:  { width:"100%", background:"none", border:"none", borderBottom:`2px solid ${ACCENT}`, color:TEXT, fontSize:22, fontWeight:400, padding:"4px 0 8px", outline:"none", boxSizing:"border-box" },
    tabRow:      { display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12, borderBottom:`1px solid ${BORDER}` },
    tabBar:      { display:"flex" },
    body:        { padding:"8px 0 0" },
    dateRow:     { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
    dateInput:   { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, fontSize:13, padding:"6px 10px", outline:"none", colorScheme:"light" },
    dash:        { color:MUTED, fontSize:13 },
    select:      { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, fontSize:13, padding:"6px 10px", outline:"none", cursor:"pointer" },
    toggleRow:   { display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", gap:12 },
    rowLabel:    { color:TEXT, fontSize:14 },
    rowSub:      { color:MUTED, fontSize:12, margin:"2px 0 0" },
    inlineInput: { background:"none", border:"none", borderBottom:`1px solid ${BORDER}`, color:TEXT, fontSize:14, padding:"4px 0", outline:"none", width:"100%" },
    textarea:    { background:"none", border:"none", borderBottom:`1px solid ${BORDER}`, color:TEXT, fontSize:14, padding:"4px 0", outline:"none", width:"100%", resize:"none", fontFamily:"inherit" },
    footer:      { display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, padding:"12px 16px", borderTop:`1px solid ${BORDER}`, marginTop:8 },
    deleteBtn:   { display:"flex", alignItems:"center", background:"none", border:`1px solid ${DANGER}`, color:DANGER, fontSize:13, fontWeight:500, padding:"7px 14px", borderRadius:8, cursor:"pointer" },
    cancelBtn:   { background:"none", border:`1px solid ${BORDER}`, color:MUTED, fontSize:13, padding:"7px 14px", borderRadius:8, cursor:"pointer" },
    saveBtn:     { background:ACCENT, border:"none", color:"#fff", fontSize:14, fontWeight:500, padding:"8px 20px", borderRadius:8, cursor:"pointer" },
};