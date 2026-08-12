import { ArrowLeft, Building2, Mail, MessageSquareText, Phone, Plus, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { agencyPathId, getAgencyRequests, type AdminAgencyRequest } from '@/services/agencyRequests';
import { adminStatusTone, normalizeAdminStatus } from '@/app/admin/adminUnifiedRequests';

const activeStatuses = new Set(['신규', '검토 중', '정보 보완', '가이드 탐색', '제안 완료']);

export function AdminAgencyDetailPage({ agencyId }: { agencyId: string }) {
  const [requests, setRequests] = useState<AdminAgencyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    void getAgencyRequests()
      .then(setRequests)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const agencyRequests = useMemo(
    () => requests.filter((request) => agencyPathId(request.company) === agencyId),
    [agencyId, requests],
  );
  const latest = agencyRequests[0];

  if (isLoading) return <StatusPage message="여행사 정보를 불러오는 중입니다." />;
  if (hasError) return <StatusPage message="여행사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />;
  if (!latest) return <StatusPage message="해당 여행사의 채용 요청 정보를 찾을 수 없습니다." />;

  const activeCount = agencyRequests.filter((request) => activeStatuses.has(normalizeAdminStatus(request.status))).length;
  const confirmedCount = agencyRequests.filter((request) => normalizeAdminStatus(request.status) === '매칭 확정').length;

  return <main className="mx-auto max-w-[1300px] p-4 sm:p-7 lg:p-8">
    <a className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" href="/admin?view=agencies"><ArrowLeft className="size-4"/>여행사 목록으로</a>
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl font-bold text-rose-500">{latest.company[0]}</span><div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{latest.company}</h1><span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-500">{agencyRequests.length >= 5 ? '핵심 파트너' : '일반'}</span></div><p className="mt-1 text-sm text-slate-400">채용 요청 {agencyRequests.length}건 · 최근 접수 {latest.createdAt}</p></div></div><div className="flex gap-2"><a href="/agency/request" className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4"/>새 매칭 요청</a></div></div>

    <section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="누적 요청" value={`${agencyRequests.length}건`} note="Firestore 등록 요청"/><Metric label="진행 중" value={`${activeCount}건`} note="현재 처리 중인 요청" highlight/><Metric label="매칭 확정" value={`${confirmedCount}건`} note="누적 확정 건수"/></section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><div className="space-y-5"><Card title="채용 요청에 등록한 회사 정보"><p className="mb-5 text-sm leading-6 text-slate-600">{latest.companyDescription !== '-' ? latest.companyDescription : '회사 설명이 등록되지 않았습니다.'}</p><div className="grid gap-4 sm:grid-cols-2"><Info icon={<Building2/>} label="회사명" value={latest.company}/><Info icon={<UserRound/>} label="담당자" value={latest.manager}/><Info icon={<Phone/>} label="연락처" value={latest.phone}/><Info icon={<Mail/>} label="이메일" value={latest.email}/><Info icon={<Building2/>} label="행사 유형" value={latest.eventType}/><Info icon={<Building2/>} label="주요 활동 지역" value={latest.region}/></div></Card><Card title="실제 채용 요청 이력"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-y border-slate-100 bg-slate-50 text-[11px] text-slate-400"><tr><th className="px-3 py-3">요청</th><th>행사 기간</th><th>조건</th><th>상태</th></tr></thead><tbody className="divide-y divide-slate-100">{agencyRequests.map((request) => <tr key={request.id} className="hover:bg-slate-50"><td className="px-3 py-4"><b>{request.event}</b><p className="mt-1 text-[11px] text-slate-400">{request.id} · {request.createdAt}</p></td><td className="text-slate-500">{request.date}</td><td><p>{request.languages.length ? request.languages.join(' · ') : '언어 미정'}</p><p className="text-xs text-slate-400">가이드 {request.guides}명 · {request.region}</p></td><td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${adminStatusTone(request.status)}`}>{normalizeAdminStatus(request.status)}</span></td></tr>)}</tbody></table></div></Card></div>

      <div className="space-y-5"><Card title="요청 담당자"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound className="size-5"/></span><div><b>{latest.manager}</b><p className="text-xs text-slate-400">채용 요청 등록 담당자</p></div></div><div className="mt-5 space-y-3"><Contact icon={<Phone/>} value={latest.phone}/><Contact icon={<Mail/>} value={latest.email}/><Contact icon={<MessageSquareText/>} value={latest.preferredContactMethod}/></div><button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold"><MessageSquareText className="size-4"/>담당자에게 메시지</button></Card><Card title="최근 요청 상세"><Detail label="행사명" value={latest.event}/><Detail label="참가 인원" value={latest.participantCount}/><Detail label="예산" value={latest.budget}/><Detail label="주요 업무" value={latest.task}/><Detail label="추가 메모" value={latest.additionalNotes}/></Card></div>
    </div>
  </main>;
}

function StatusPage({ message }: { message: string }) { return <main className="mx-auto max-w-[1300px] p-4 sm:p-7 lg:p-8"><a className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" href="/admin?view=agencies"><ArrowLeft className="size-4"/>여행사 목록으로</a><div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">{message}</div></main>; }
function Card({title,children}:{title:string;children:ReactNode}){return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="mb-5 font-bold">{title}</h2>{children}</section>}
function Metric({label,value,note,highlight}:{label:string;value:string;note:string;highlight?:boolean}){return <div className={`rounded-2xl border p-5 ${highlight?'border-rose-100 bg-rose-50':'border-slate-200 bg-white'}`}><p className="text-xs font-semibold text-slate-400">{label}</p><p className={`mt-2 text-2xl font-bold ${highlight?'text-rose-500':''}`}>{value}</p><p className="mt-2 text-[11px] text-slate-400">{note}</p></div>}
function Info({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="flex gap-3"><span className="mt-1 text-slate-400">{icon}</span><div><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div>}
function Contact({icon,value}:{icon:ReactNode;value:string}){return <div className="flex items-center gap-2 text-sm text-slate-600"><span className="text-slate-400">{icon}</span>{value}</div>}
function Detail({label,value}:{label:string;value:string}){return <div className="border-b border-slate-100 py-3 last:border-0"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm leading-6 text-slate-600">{value !== '-' ? value : '미입력'}</p></div>}
