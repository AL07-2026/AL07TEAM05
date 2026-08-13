import { BadgeCheck, Building2, CalendarClock, Languages, MapPin, Phone, Plus, Search, UsersRound } from 'lucide-react';
import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { agencyPathId, getAgencyRequests, type AdminAgencyRequest } from '@/services/agencyRequests';
import { getGuideRegistrations, type AdminGuideRegistration } from '@/services/guideRegistrations';
export function AdminPartnersPage({ mode }: { mode:'agencies'|'guides' }) { return mode==='agencies'?<Agencies/>:<Guides/> }

type AgencySummary = {
  id: string;
  name: string;
  manager: string;
  phone: string;
  requests: number;
  active: number;
  last: string;
  grade: string;
  note: string;
};

function toAgencySummary(requests: AdminAgencyRequest[]): AgencySummary[] {
  const grouped = new Map<string, AdminAgencyRequest[]>();
  requests.forEach((request) => {
    const current = grouped.get(request.company) ?? [];
    current.push(request);
    grouped.set(request.company, current);
  });

  return [...grouped.entries()].map(([name, companyRequests]) => {
    const latest = companyRequests[0]!;
    const active = companyRequests.filter((request) => request.status !== '매칭 확정').length;
    return {
      id: agencyPathId(name),
      name,
      manager: latest.manager,
      phone: latest.phone,
      requests: companyRequests.length,
      active,
      last: latest.createdAt,
      grade: companyRequests.length >= 5 ? '핵심 파트너' : '일반',
      note: latest.companyDescription !== '-' ? latest.companyDescription : latest.task,
    };
  });
}

function Agencies(){
  const [query,setQuery]=useState('');
  const [requests,setRequests]=useState<AdminAgencyRequest[]>([]);
  const [selected,setSelected]=useState<AgencySummary | null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [hasError,setHasError]=useState(false);

  useEffect(() => {
    void getAgencyRequests()
      .then((loaded) => {
        setRequests(loaded);
        setSelected(toAgencySummary(loaded)[0] ?? null);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const agencies = useMemo(() => toAgencySummary(requests), [requests]);
  const filtered = agencies.filter((agency) => `${agency.name} ${agency.manager}`.includes(query));

  return <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8"><PageHead eyebrow="AGENCIES" title="여행사 관리" description="채용 요청을 등록한 여행사 정보와 누적 요청 이력을 관리하세요." button="여행사 등록" buttonHref="/agency/request" icon={<Building2 className="size-4"/>}/><div className="mt-7 grid gap-5 xl:grid-cols-[1.5fr_.75fr]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-4"><SearchBox value={query} onChange={setQuery} placeholder="여행사명 또는 담당자 검색"/></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">여행사</th><th>누적 요청</th><th>진행 중</th><th>최근 요청</th><th>등급</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">등록된 여행사를 불러오는 중입니다.</td></tr> : hasError ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">여행사 정보를 불러오지 못했습니다.</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">아직 채용 요청을 등록한 여행사가 없습니다.</td></tr> : filtered.map(a=><tr key={a.id} onClick={()=>setSelected(a)} className={`cursor-pointer hover:bg-slate-50 ${selected?.id===a.id?'bg-rose-50/40':''}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-500">{a.name[0]}</span><div><b>{a.name}</b><p className="mt-1 text-xs text-slate-400">{a.manager} 담당자</p></div></div></td><td className="font-semibold">{a.requests}건</td><td><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">{a.active}건</span></td><td className="text-slate-500">{a.last}</td><td><span className={a.grade==='핵심 파트너'?'text-rose-500 font-semibold':'text-slate-400'}>{a.grade}</span></td></tr>)}</tbody></table></div></section>{selected ? <AgencyDetail agency={selected}/> : <aside className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-400">여행사를 선택하면 상세 정보가 표시됩니다.</aside>}</div></main>
}

function AgencyDetail({agency}:{agency:AgencySummary}){return <aside className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-xl font-bold text-rose-500">{agency.name[0]}</div><h2 className="mt-4 text-xl font-bold">{agency.name}</h2><p className="mt-1 text-xs font-semibold text-rose-500">{agency.grade}</p><div className="mt-6 space-y-4 text-sm"><InfoRow icon={<UsersRound/>} label="담당자" value={agency.manager}/><InfoRow icon={<Phone/>} label="연락처" value={agency.phone}/><InfoRow icon={<CalendarClock/>} label="누적 요청" value={`${agency.requests}건`}/></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">채용 요청에 등록한 회사 설명</p><p className="mt-2 text-sm leading-6 text-slate-600">{agency.note}</p></div><a className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" href={`/admin/agencies/${agency.id}`}>여행사 상세 보기</a></aside>}

function Guides(){
  const [query,setQuery]=useState('');
  const [registrations,setRegistrations]=useState<AdminGuideRegistration[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  const [hasError,setHasError]=useState(false);

  useEffect(() => {
    void getGuideRegistrations()
      .then(setRegistrations)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered=useMemo(() => registrations.filter((guide) => `${guide.name} ${guide.languages.join(' ')} ${guide.regions.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query, registrations]);
  return <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8"><PageHead eyebrow="GUIDES" title="가이드 관리" description="등록된 가이드의 언어, 활동 지역, 경력과 자격증 정보를 관리하세요." button="가이드 등록" icon={<UsersRound className="size-4"/>}/><div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"><SearchBox value={query} onChange={setQuery} placeholder="이름, 언어, 활동 지역 검색"/></div><section className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{isLoading ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400 md:col-span-2 2xl:col-span-3">등록된 가이드를 불러오는 중입니다.</div> : hasError ? <div className="rounded-2xl border border-dashed border-rose-200 bg-white p-10 text-center text-sm text-rose-500 md:col-span-2 2xl:col-span-3">가이드 정보를 불러오지 못했습니다.</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400 md:col-span-2 2xl:col-span-3">아직 등록된 가이드가 없습니다.</div> : filtered.map((guide)=><article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg" key={guide.id}><div className="flex items-start"><span className="flex size-12 items-center justify-center rounded-full bg-slate-900 font-bold text-white">{guide.name.slice(0,1)}</span><div className="ml-3"><div className="flex items-center gap-1.5"><h2 className="font-bold">{guide.name}</h2><BadgeCheck className="size-4 text-blue-500"/></div><p className="mt-1 text-xs text-slate-400">등록 {guide.submittedAt}</p></div><span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold ${guide.status==='승인'?'bg-emerald-50 text-emerald-600':guide.status==='보완 요청'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}>{guide.status}</span></div><div className="mt-5 space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><Languages className="size-4 text-slate-400"/>{guide.languages.length ? guide.languages.join(' · ') : '언어 미입력'}</p><p className="flex items-center gap-2"><MapPin className="size-4 text-slate-400"/>{guide.regions.length ? guide.regions.join(' · ') : '지역 미입력'} · 경력 {guide.experience}</p><p className="flex items-center gap-2"><Phone className="size-4 text-slate-400"/>{guide.phone}</p></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-400">자격증 정보</p><p className="mt-1 font-semibold text-slate-700">{guide.certificateLanguage} · {guide.certificateNumber}</p></div>{guide.introduction !== '-' && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{guide.introduction}</p>}<button className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:border-rose-200 hover:text-rose-500">프로필 및 일정 보기</button></article>)}</section></main>
}

function PageHead({eyebrow,title,description,button,buttonHref,icon}:{eyebrow:string;title:string;description:string;button:string;buttonHref?:string;icon:ReactNode}){const className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white";const content=<><Plus className="size-4"/>{button}{icon}</>;return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-rose-500">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>{buttonHref?<a className={className} href={buttonHref}>{content}</a>:<button className={className} type="button">{content}</button>}</div>}
function SearchBox({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder:string}){return <label className="flex h-10 min-w-64 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="size-4 text-slate-400"/><input className="w-full bg-transparent text-sm outline-none" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
function InfoRow({icon,label,value}:{icon:ReactElement;label:string;value:string}){return <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">{icon}</span><div><p className="text-[11px] text-slate-400">{label}</p><p className="font-medium">{value}</p></div></div>}
