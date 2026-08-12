import { CalendarDays, ChevronRight, Filter, Search, UserRound } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import {
  getAgencyRequests,
  type AdminAgencyRequest,
  type AdminRequestStatus,
} from '@/services/agencyRequests';

type RequestState = AdminRequestStatus;
type RequestRow = AdminAgencyRequest & { language: string; priority: '긴급' | '보통' };

const states: RequestState[] = ['신규', '검토 중', '정보 보완', '가이드 탐색', '제안 완료', '매칭 확정'];
const stateColors: Record<RequestState, string> = {
  신규: 'bg-rose-50 text-rose-600',
  '검토 중': 'bg-amber-50 text-amber-700',
  '정보 보완': 'bg-orange-50 text-orange-700',
  '가이드 탐색': 'bg-blue-50 text-blue-700',
  '제안 완료': 'bg-violet-50 text-violet-700',
  '매칭 확정': 'bg-emerald-50 text-emerald-700',
};

function toRequestRow(request: AdminAgencyRequest): RequestRow {
  return {
    ...request,
    language: request.languages.join(' · ') || '-',
    priority: request.urgency,
  };
}

export function AdminRequestsPage() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('전체');
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadRequests = () => {
    setIsLoading(true);
    setLoadError(false);
    void getAgencyRequests()
      .then((items) => setRequests(items.map(toRequestRow)))
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(loadRequests);
  }, []);

  const rows = useMemo(
    () =>
      requests.filter(
        (request) =>
          `${request.id} ${request.company} ${request.event}`.toLowerCase().includes(query.toLowerCase()) &&
          (state === '전체' || request.status === state),
      ),
    [query, requests, state],
  );

  const activeSelected = rows.find((row) => row.id === selected?.id) ?? rows[0] ?? null;

  return <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-rose-500">REQUESTS</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">매칭 요청 조회</h1><p className="mt-2 text-sm text-slate-500">접수된 요청을 빠르게 훑고 필요한 정보를 확인하세요.</p></div><span className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500">현재 조회 전용</span></div>
    <div className="mt-7 grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white xl:grid-cols-[1.45fr_.85fr]">
      <section className="min-w-0 border-r border-slate-100"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row"><label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="size-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none" placeholder="요청번호, 여행사, 행사명 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm"><Filter className="size-4 text-slate-400" /><select className="bg-transparent outline-none" value={state} onChange={(event) => setState(event.target.value)}><option>전체</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">요청 정보</th><th className="px-3 py-3">일정</th><th className="px-3 py-3">조건</th><th className="px-3 py-3">상태</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={5}>매칭 요청을 불러오는 중입니다.</td></tr> : loadError ? <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={5}>매칭 요청을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.<br /><button className="mt-3 font-semibold text-rose-500" onClick={loadRequests}>다시 시도</button></td></tr> : rows.length === 0 ? <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={5}>아직 접수된 매칭 요청이 없습니다.</td></tr> : rows.map((row) => <tr onClick={() => setSelected(row)} className={`cursor-pointer hover:bg-slate-50 ${selected?.id === row.id ? 'bg-rose-50/40' : ''}`} key={row.id}><td className="px-4 py-4"><div className="flex items-center gap-2"><b>{row.event}</b>{row.priority === '긴급' && <span className="rounded bg-rose-100 px-1.5 py-.5 text-[10px] font-bold text-rose-600">긴급</span>}</div><p className="mt-1 text-xs text-slate-400">{row.id} · {row.company}</p></td><td className="px-3 py-4"><p>{row.date}</p><p className="mt-1 text-xs text-slate-400">{row.region}</p></td><td className="px-3 py-4"><p>{row.language}</p><p className="mt-1 text-xs text-slate-400">{row.guides}명</p></td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateColors[row.status]}`}>{row.status}</span></td><td className="pr-3"><ChevronRight className="size-4 text-slate-300" /></td></tr>)}</tbody></table></div><div className="border-t border-slate-100 p-4 text-xs text-slate-400">검색 결과 {rows.length}건</div>
      </section>
      <RequestDetail request={activeSelected} />
    </div>
  </main>;
}

function RequestDetail({ request }: { request: RequestRow | null }) {
  if (!request) {
    return <aside className="bg-slate-50/40 p-5 text-sm text-slate-400 xl:p-6">선택할 매칭 요청이 없습니다.</aside>;
  }

  return <aside className="bg-slate-50/40 p-5 xl:p-6" key={request.id}><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-rose-500">{request.id}</p><h2 className="mt-1 text-xl font-bold">{request.event}</h2><p className="mt-1 text-sm text-slate-400">{request.company}</p></div>{request.priority === '긴급' && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">긴급</span>}</div><div className="mt-6 grid grid-cols-2 gap-3"><DetailBox label="행사 일정" value={request.date} icon={<CalendarDays className="size-4" />} /><DetailBox label="필요 가이드" value={`${request.language} · ${request.guides}명`} icon={<UserRound className="size-4" />} /></div><div className="mt-5 grid gap-3"><DetailBox label="진행 상태" value={request.status} icon={<ChevronRight className="size-4" />} /><DetailBox label="내부 담당자" value={request.assignee} icon={<UserRound className="size-4" />} /></div><p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-500 ring-1 ring-slate-200">현재 화면은 조회 전용입니다. 상태 저장과 담당자 배정은 다음 단계에서 지원됩니다.</p><div className="mt-5"><Label>여행사 담당자</Label><div className="mt-2 rounded-xl border border-slate-200 bg-white p-4"><b className="text-sm">{request.manager}</b><p className="mt-1 text-xs text-slate-400">{request.phone}</p></div></div><div className="mt-5"><Label>주요 업무</Label><p className="mt-2 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{request.task}</p></div></aside>;
}

function DetailBox({ label, value, icon }: { label: string; value: string; icon: ReactNode }) { return <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="flex items-center gap-1.5 text-[11px] text-slate-400">{icon}{label}</span><p className="mt-2 text-sm font-semibold">{value}</p></div>; }
function Label({ children }: { children: string }) { return <p className="text-xs font-bold text-slate-500">{children}</p>; }
