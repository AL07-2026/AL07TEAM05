import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LineChart,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminRequestsPage } from '@/app/admin/AdminRequestsPage';

type AdminSection = 'dashboard' | 'analytics' | 'requests' | 'agencies' | 'guides' | 'messages' | 'settings';

type RequestStatus = '신규' | '검토 중' | '정보 보완' | '가이드 탐색' | '제안 완료' | '매칭 확정';

type AdminRequest = {
  id: string;
  company: string;
  manager: string;
  phone: string;
  email: string;
  event: string;
  region: string;
  date: string;
  languages: string[];
  guides: number;
  urgency: '긴급' | '보통';
  status: RequestStatus;
  assignee: string;
  task: string;
  budget: string;
  createdAt: string;
};

const seedRequests: AdminRequest[] = [
  { id: 'TM-1042', company: '트래블메이트', manager: '김민지', phone: '010-2841-9203', email: 'minji@travelmate.kr', event: '글로벌 파트너 초청 서울 투어', region: '서울', date: '2026. 08. 14 - 08. 16', languages: ['영어'], guides: 3, urgency: '긴급', status: '신규', assignee: '미지정', task: '해외 파트너 임직원 24명 인솔 및 서울 주요 명소 투어 진행', budget: '1인 35만원 / 일', createdAt: '오늘 09:42' },
  { id: 'TM-1041', company: '하나로투어', manager: '박서준', phone: '010-1138-7742', email: 'sjpark@hanaro.co.kr', event: '일본 바이어 산업 시찰', region: '경기 · 인천', date: '2026. 08. 20 - 08. 22', languages: ['일본어'], guides: 2, urgency: '보통', status: '검토 중', assignee: '이지은', task: '산업단지 방문 통역 및 일정 진행', budget: '협의', createdAt: '어제 16:18' },
  { id: 'TM-1040', company: 'K-컨벤션', manager: '이수현', phone: '010-5520-8819', email: 'shlee@kconvention.com', event: '2026 아시아 테크 포럼', region: '부산', date: '2026. 09. 02 - 09. 05', languages: ['영어', '중국어'], guides: 5, urgency: '보통', status: '가이드 탐색', assignee: '김도윤', task: '포럼 등록 안내, 세션 이동 및 VIP 수행', budget: '총 720만원', createdAt: '08. 08 11:30' },
  { id: 'TM-1039', company: '모두여행', manager: '최유진', phone: '010-9941-3012', email: 'yujin@modutravel.kr', event: '베트남 인센티브 투어', region: '제주', date: '2026. 09. 08 - 09. 11', languages: ['베트남어'], guides: 2, urgency: '보통', status: '제안 완료', assignee: '이지은', task: '기업 인센티브 단체 전 일정 동행', budget: '1인 40만원 / 일', createdAt: '08. 07 14:05' },
  { id: 'TM-1038', company: '브릿지트래블', manager: '정우석', phone: '010-4277-9931', email: 'ws@bridgetravel.io', event: '유럽 대학 교류단 방한', region: '서울 · 대전', date: '2026. 09. 15 - 09. 19', languages: ['영어'], guides: 2, urgency: '보통', status: '매칭 확정', assignee: '김도윤', task: '대학 교류단 의전 및 캠퍼스 투어', budget: '총 420만원', createdAt: '08. 06 10:20' },
];

const statusStyle: Record<RequestStatus, string> = {
  '신규': 'bg-rose-50 text-rose-600 ring-rose-100',
  '검토 중': 'bg-amber-50 text-amber-700 ring-amber-100',
  '정보 보완': 'bg-orange-50 text-orange-700 ring-orange-100',
  '가이드 탐색': 'bg-blue-50 text-blue-700 ring-blue-100',
  '제안 완료': 'bg-violet-50 text-violet-700 ring-violet-100',
  '매칭 확정': 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

function loadLatestRequest(): AdminRequest | null {
  try {
    const raw = localStorage.getItem('latestAgencyRequest');
    if (!raw) return null;
    const item = JSON.parse(raw) as Record<string, string | string[]>;
    return {
      id: typeof item.id === 'string' ? item.id.replace('agency-', 'TM-') : 'TM-NEW',
      company: String(item.companyName || '신규 여행사'), manager: String(item.contactName || '-'),
      phone: String(item.contactPhone || '-'), email: String(item.contactEmail || '-'), event: String(item.eventName || '가이드 매칭 요청'),
      region: String(item.region || '-'), date: `${item.startDate || '-'} - ${item.endDate || '-'}`, languages: Array.isArray(item.languages) ? item.languages.map(String) : [],
      guides: Number(item.guideCount || 1), urgency: String(item.urgency).includes('긴급') ? '긴급' : '보통', status: '신규', assignee: '미지정',
      task: String(item.taskDescription || '상세 업무 미입력'), budget: String(item.budget || '협의'), createdAt: '방금 전',
    };
  } catch { return null; }
}

export function AdminPage() {
  const [activePage, setActivePageState] = useState<AdminSection>(() =>
    new URLSearchParams(window.location.search).get('view') === 'analytics' ? 'analytics' : 'dashboard',
  );
  const setActivePage = (page: AdminSection) => {
    setActivePageState(page);
    window.history.replaceState(null, '', page === 'analytics' ? '/admin?view=analytics' : '/admin');
  };
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('전체 상태');
  const [selected, setSelected] = useState<AdminRequest | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const requests = useMemo(() => {
    const latest = loadLatestRequest();
    return latest ? [latest, ...seedRequests] : seedRequests;
  }, []);
  const filtered = requests.filter((request) => {
    const matchesQuery = `${request.company} ${request.event} ${request.id}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === '전체 상태' || request.status === status);
  });

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <Sidebar activePage={activePage} onNavigate={setActivePage} open={mobileMenu} onClose={() => setMobileMenu(false)} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <button className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setMobileMenu(true)}><Menu className="size-5" /></button>
          <div className="hidden text-sm text-slate-500 sm:block">운영 현황을 확인하고 매칭 요청을 관리하세요.</div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" /></button>
            <div className="ml-1 flex items-center gap-2 rounded-xl px-2 py-1.5"><span className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">AD</span><div className="hidden sm:block"><p className="text-xs font-semibold">김관리</p><p className="text-[11px] text-slate-400">운영 관리자</p></div><ChevronDown className="size-3.5 text-slate-400" /></div>
          </div>
        </header>

        {activePage === 'analytics' ? <AnalyticsPage /> : activePage === 'requests' ? <AdminRequestsPage /> : <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="mb-1 text-sm font-semibold text-rose-500">OVERVIEW</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">안녕하세요, 김관리님</h1><p className="mt-2 text-sm text-slate-500">오늘 확인해야 할 신규 요청이 <b className="text-slate-800">{requests.filter((r) => r.status === '신규').length}건</b> 있습니다.</p></div>
            <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm"><Sparkles className="size-4" />가이드 후보 찾기</button>
          </div>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="신규 요청" value={requests.filter((r) => r.status === '신규').length} note="어제보다 2건 증가" tone="rose" icon={ClipboardList} />
            <Metric label="검토 중" value={requests.filter((r) => r.status === '검토 중').length} note="오늘 처리 3건" tone="amber" icon={Clock3} />
            <Metric label="매칭 진행 중" value={requests.filter((r) => ['가이드 탐색', '제안 완료'].includes(r.status)).length + 6} note="제안 대기 4건" tone="blue" icon={UsersRound} />
            <Metric label="이번 달 확정" value={21} note="전월 대비 18% 증가" tone="green" icon={Sparkles} />
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-bold">매칭 요청</h2><p className="mt-1 text-xs text-slate-400">최근 접수된 요청부터 표시됩니다.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex h-10 min-w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search className="size-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="회사명, 행사명, 요청번호 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
                <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" value={status} onChange={(e) => setStatus(e.target.value)}><option>전체 상태</option>{Object.keys(statusStyle).map((item) => <option key={item}>{item}</option>)}</select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3.5">요청 / 여행사</th><th className="px-4 py-3.5">행사 일정</th><th className="px-4 py-3.5">조건</th><th className="px-4 py-3.5">담당자</th><th className="px-4 py-3.5">상태</th><th className="px-4 py-3.5" /></tr></thead>
                <tbody className="divide-y divide-slate-100">{filtered.map((request) => <tr className="cursor-pointer transition hover:bg-slate-50/70" key={request.id} onClick={() => setSelected(request)}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-500">{request.company.slice(0, 1)}</span><div><div className="flex items-center gap-2"><span className="font-semibold">{request.event}</span>{request.urgency === '긴급' && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">긴급</span>}</div><p className="mt-1 text-xs text-slate-400">{request.id} · {request.company} · {request.createdAt}</p></div></div></td><td className="px-4 py-4"><p className="font-medium">{request.date}</p><p className="mt-1 text-xs text-slate-400">{request.region}</p></td><td className="px-4 py-4"><div className="flex gap-1">{request.languages.map((language) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium" key={language}>{language}</span>)}</div><p className="mt-1.5 text-xs text-slate-400">가이드 {request.guides}명</p></td><td className="px-4 py-4 text-slate-600">{request.assignee}</td><td className="px-4 py-4"><StatusBadge status={request.status} /></td><td className="px-4 py-4"><ChevronRight className="size-4 text-slate-300" /></td></tr>)}</tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-400"><span>총 {filtered.length}건</span><button className="font-semibold text-slate-600">전체 요청 보기 →</button></div>
          </section>
        </main>}
      </div>
      {selected && <RequestDrawer request={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Sidebar({ activePage, onNavigate, open, onClose }: { activePage: AdminSection; onNavigate: (page: AdminSection) => void; open: boolean; onClose: () => void }) {
  const navigate = (page: AdminSection) => { onNavigate(page); onClose(); };
  return <><button aria-label="메뉴 닫기" className={`fixed inset-0 z-30 bg-slate-950/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} /><aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-16 items-center justify-between border-b border-slate-100 px-5"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-xl bg-rose-500 text-white"><Sparkles className="size-4" /></span><div><p className="font-bold tracking-tight">TourMatch</p><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-400">Admin</p></div></div><button className="lg:hidden" onClick={onClose}><X className="size-5" /></button></div><nav className="flex-1 p-3"><p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspace</p><SideItem icon={LayoutDashboard} label="대시보드" active={activePage === 'dashboard'} onClick={() => navigate('dashboard')} /><SideItem icon={LineChart} label="Google Analytics" active={activePage === 'analytics'} onClick={() => navigate('analytics')} /><SideItem icon={ClipboardList} label="매칭 요청" count="12" active={activePage === 'requests'} onClick={() => navigate('requests')} /><SideItem icon={Building2} label="여행사 관리" active={activePage === 'agencies'} onClick={() => navigate('agencies')} /><SideItem icon={UsersRound} label="가이드 관리" active={activePage === 'guides'} onClick={() => navigate('guides')} /><p className="px-3 pb-2 pt-7 text-[10px] font-bold uppercase tracking-widest text-slate-400">Management</p><SideItem icon={MessageSquareText} label="메시지" count="3" active={activePage === 'messages'} onClick={() => navigate('messages')} /><SideItem icon={Settings} label="설정" active={activePage === 'settings'} onClick={() => navigate('settings')} /></nav><div className="m-3 rounded-2xl bg-slate-50 p-4"><CircleHelp className="size-5 text-rose-500" /><p className="mt-3 text-xs font-bold">도움이 필요하신가요?</p><p className="mt-1 text-[11px] leading-4 text-slate-400">운영 가이드와 자주 묻는 질문을 확인하세요.</p><button className="mt-3 text-[11px] font-bold text-rose-500">운영 가이드 보기 →</button></div></aside></>;
}

function SideItem({ icon: Icon, label, active, count, onClick }: { icon: typeof LayoutDashboard; label: string; active?: boolean; count?: string; onClick?: () => void }) { return <button onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}><Icon className="size-[18px]" /><span>{label}</span>{count && <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-white' : 'bg-slate-100'}`}>{count}</span>}</button>; }

function AnalyticsPage() {
  const localEvents = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agencyAnalyticsEvents') || '[]') as { eventName?: string }[]; } catch { return []; }
  }, []);
  const localViews = localEvents.filter((event) => event.eventName === 'agency_page_view').length;
  const funnel = [
    { label: '여행사 페이지 조회', value: 1248 + localViews, rate: '100%', width: '100%' },
    { label: '매칭 요청 시작', value: 486 + localEvents.filter((e) => e.eventName === 'agency_request_start').length, rate: '38.9%', width: '72%' },
    { label: '제출 시도', value: 184 + localEvents.filter((e) => e.eventName === 'agency_request_submit_attempt').length, rate: '14.7%', width: '47%' },
    { label: '요청 완료', value: 142 + localEvents.filter((e) => e.eventName === 'agency_request_submit_success').length, rate: '11.4%', width: '31%' },
  ];
  const traffic = [{ name: 'Google 검색', value: 46, color: 'bg-blue-500' }, { name: '직접 유입', value: 28, color: 'bg-rose-500' }, { name: '네이버 검색', value: 17, color: 'bg-emerald-500' }, { name: '기타 추천', value: 9, color: 'bg-amber-400' }];
  return <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-rose-500 to-amber-400 text-white"><LineChart className="size-4" /></span><p className="text-sm font-semibold text-slate-500">Google Analytics 4</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">데모 데이터</span></div><h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">서비스 분석</h1><p className="mt-2 text-sm text-slate-500">여행사의 유입부터 매칭 요청 완료까지 전환 흐름을 확인하세요.</p></div><select className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"><option>최근 30일</option><option>최근 7일</option><option>이번 달</option></select></div>
    <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AnalyticsMetric label="활성 사용자" value="1,248" change="+12.4%" /><AnalyticsMetric label="페이지 조회" value="3,892" change="+8.7%" /><AnalyticsMetric label="매칭 요청" value="142" change="+18.3%" /><AnalyticsMetric label="요청 전환율" value="11.4%" change="+1.8%p" /></section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.7fr_1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold">사용자 추이</h2><p className="mt-1 text-xs text-slate-400">일별 활성 사용자와 요청 완료</p></div><div className="flex gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-500" />활성 사용자</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-rose-500" />요청 완료</span></div></div><div className="relative mt-8 h-64 border-b border-l border-slate-100"><div className="absolute inset-0 flex flex-col justify-between">{[0,1,2,3].map((i) => <div className="border-t border-dashed border-slate-100" key={i} />)}</div><svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 240"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b82f6" stopOpacity=".22"/><stop offset="1" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs><path d="M0 190 C70 180 80 145 140 155 S225 120 280 130 S370 70 420 92 S500 55 560 75 S640 28 700 42 L700 240 L0 240Z" fill="url(#area)"/><path d="M0 190 C70 180 80 145 140 155 S225 120 280 130 S370 70 420 92 S500 55 560 75 S640 28 700 42" fill="none" stroke="#3b82f6" strokeWidth="4" vectorEffect="non-scaling-stroke"/><path d="M0 222 C80 218 95 207 140 211 S230 197 280 201 S370 180 420 187 S500 173 560 178 S640 160 700 164" fill="none" stroke="#f43f5e" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg><div className="absolute -bottom-7 flex w-full justify-between text-[10px] text-slate-400"><span>7/12</span><span>7/18</span><span>7/24</span><span>7/30</span><span>8/05</span><span>8/10</span></div></div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">유입 채널</h2><p className="mt-1 text-xs text-slate-400">신규 사용자 기준</p><div className="mx-auto mt-7 flex size-40 items-center justify-center rounded-full" style={{background:'conic-gradient(#3b82f6 0 46%, #f43f5e 46% 74%, #10b981 74% 91%, #fbbf24 91%)'}}><div className="flex size-24 flex-col items-center justify-center rounded-full bg-white"><b className="text-xl">1,248</b><span className="text-[10px] text-slate-400">사용자</span></div></div><div className="mt-7 space-y-3">{traffic.map((item) => <div className="flex items-center text-xs" key={item.name}><span className={`mr-2 size-2 rounded-full ${item.color}`} /><span className="text-slate-500">{item.name}</span><b className="ml-auto">{item.value}%</b></div>)}</div></div></section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">매칭 요청 퍼널</h2><p className="mt-1 text-xs text-slate-400">agency 이벤트 기반 단계별 전환</p><div className="mt-6 space-y-3">{funnel.map((item, index) => <div className="flex items-center gap-4" key={item.label}><span className="w-28 shrink-0 text-xs text-slate-500">{item.label}</span><div className="h-10 flex-1 rounded-lg bg-slate-50"><div className={`flex h-full items-center rounded-lg px-3 text-xs font-bold text-white ${index === 3 ? 'bg-rose-500' : 'bg-slate-800'}`} style={{width:item.width}}>{item.value.toLocaleString()}</div></div><span className="w-12 text-right text-xs font-bold">{item.rate}</span></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">인기 페이지</h2><p className="mt-1 text-xs text-slate-400">페이지 경로별 조회수</p><div className="mt-5 divide-y divide-slate-100">{[['/agency','여행사 메인','1,248'],['/agency/request','매칭 요청서','684'],['/jobs','가이드 채용 정보','421'],['/agency/complete','요청 완료','142']].map(([path,name,value], i) => <div className="flex items-center py-3 text-sm" key={path}><span className="mr-3 text-xs font-bold text-slate-300">0{i+1}</span><div><p className="font-medium">{name}</p><p className="text-[11px] text-slate-400">{path}</p></div><b className="ml-auto">{value}</b></div>)}</div></div></section>
    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-700"><b>GA4 연결 안내</b> · 현재 화면은 데모 데이터와 브라우저에 기록된 실제 MVP 이벤트를 함께 표시합니다. 실제 운영 지표를 사용하려면 GA4 속성 ID와 서버 측 Google Analytics Data API 연결이 필요합니다.</div>
  </main>;
}

function AnalyticsMetric({ label, value, change }: { label: string; value: string; change: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-400">{label}</p><div className="mt-3 flex items-end justify-between"><b className="text-2xl tracking-tight">{value}</b><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">{change}</span></div></div>; }

function Metric({ label, value, note, tone, icon: Icon }: { label: string; value: number; note: string; tone: 'rose' | 'amber' | 'blue' | 'green'; icon: typeof ClipboardList }) {
  const tones = { rose: 'bg-rose-50 text-rose-500', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p></div><span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span></div><p className="mt-4 text-[11px] text-slate-400">{note}</p></div>;
}

function StatusBadge({ status }: { status: RequestStatus }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle[status]}`}>{status}</span>; }

function RequestDrawer({ request, onClose }: { request: AdminRequest; onClose: () => void }) {
  const [status, setStatus] = useState<RequestStatus>(request.status);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><div><p className="text-xs font-semibold text-rose-500">{request.id}</p><h2 className="mt-1 text-lg font-bold">매칭 요청 상세</h2></div><button className="rounded-xl border border-slate-200 p-2" onClick={onClose}><X className="size-4" /></button></div><div className="space-y-6 p-6"><div className="rounded-2xl bg-slate-900 p-5 text-white"><div className="flex items-start justify-between"><div><p className="text-xs text-slate-400">{request.company}</p><h3 className="mt-1 text-xl font-bold">{request.event}</h3></div>{request.urgency === '긴급' && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold">긴급</span>}</div><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-slate-400">행사 일정</p><p className="mt-1">{request.date}</p></div><div><p className="text-xs text-slate-400">진행 지역</p><p className="mt-1">{request.region}</p></div></div></div><section><SectionTitle>처리 상태</SectionTitle><div className="grid grid-cols-2 gap-3"><label className="rounded-xl border border-slate-200 p-3 text-xs text-slate-400">현재 상태<select className="mt-1.5 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)}>{Object.keys(statusStyle).map((item) => <option key={item}>{item}</option>)}</select></label><label className="rounded-xl border border-slate-200 p-3 text-xs text-slate-400">담당자<select className="mt-1.5 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" defaultValue={request.assignee}><option>{request.assignee}</option><option>이지은</option><option>김도윤</option></select></label></div></section><section><SectionTitle>여행사 담당자</SectionTitle><div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-slate-100"><UserRound className="size-5 text-slate-500" /></span><div><p className="font-semibold">{request.manager}</p><p className="text-xs text-slate-400">{request.company}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-400">연락처</p><p className="mt-1 font-medium">{request.phone}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-400">이메일</p><p className="mt-1 truncate font-medium">{request.email}</p></div></div></div></section><section><SectionTitle>가이드 조건</SectionTitle><div className="grid grid-cols-3 gap-3"><Info label="필요 언어" value={request.languages.join(', ')} /><Info label="필요 인원" value={`${request.guides}명`} /><Info label="예산" value={request.budget} /></div></section><section><SectionTitle>주요 업무</SectionTitle><p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{request.task}</p></section><section><SectionTitle>내부 메모</SectionTitle><textarea className="min-h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-rose-300" placeholder="운영팀만 볼 수 있는 메모를 입력하세요." /></section><div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white py-4"><button className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">정보 보완 요청</button><button className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white">변경사항 저장</button></div></div></aside></div>;
}

function SectionTitle({ children }: { children: string }) { return <h4 className="mb-3 text-sm font-bold">{children}</h4>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
