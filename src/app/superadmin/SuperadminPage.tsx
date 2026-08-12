import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { countActiveAdmins, countActiveSuperAdmins, getAuditLogs, listenAuditLogs } from '@/services/adminAuth';
import { getAgencyRequests } from '@/services/agencyRequests';
import { getGuideRegistrations } from '@/services/guideRegistrations';
import { getPublicGuideProfiles } from '@/services/publicGuideProfiles';
import { getTravelerRequests } from '@/services/travelerRequests';
import { SuperadminUsersPage } from '@/app/superadmin/SuperadminUsersPage';
import type { AdminRole, PlatformAuditLog } from '@/types';

type SuperadminSection = 'dashboard' | 'users';

type AuditLog = PlatformAuditLog & { id: string };

export function SuperadminDashboardPage({ onSignOut, currentUser }: { onSignOut?: () => void; currentUser?: { uid: string; role: AdminRole } }) {
  const [section, setSection] = useState<SuperadminSection>('dashboard');
  const [metrics, setMetrics] = useState({
    agencyRequests: 0,
    travelerRequests: 0,
    newRequests: 0,
    registeredGuides: 0,
    approvedGuides: 0,
    activeAdmins: 0,
    activeSuperAdmins: 0,
  });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const load = async () => {
      setIsLoading(true);
      try {
        const [agencyRequests, publicGuides, guideRegistrations, activeAdmins, activeSuperAdmins, auditLogs, travelerRequests] = await Promise.all([
          getAgencyRequests(),
          getPublicGuideProfiles(),
          getGuideRegistrations(),
          countActiveAdmins(),
          countActiveSuperAdmins(),
          getAuditLogs({ limitCount: 20 }),
          getTravelerRequests(),
        ]);

        const newRequests = agencyRequests.filter((req) => req.status === '신규').length;
        const approvedGuides = publicGuides.filter((guide) => guide.verified).length;

        setMetrics({
          agencyRequests: agencyRequests.length,
          travelerRequests: travelerRequests.length,
          newRequests,
          registeredGuides: guideRegistrations.length,
          approvedGuides,
          activeAdmins,
          activeSuperAdmins,
        });
        setLogs(auditLogs as AuditLog[]);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    const subscribe = async () => {
      await load();
      unsubscribe = listenAuditLogs((latest) => setLogs(latest as AuditLog[]), 20);
    };

    void subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        대시보드를 불러오는 중입니다.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold text-amber-600">SUPERADMIN</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">플랫폼 대시보드</h1>
          <p className="mt-2 text-sm text-slate-500">전체 요청, 가이드, 운영자 현황을 확인하세요.</p>
        </div>
        <div className="flex gap-2">
          <nav className="flex gap-2">
            <button onClick={() => setSection('dashboard')} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${section === 'dashboard' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>대시보드</button>
            <button onClick={() => setSection('users')} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${section === 'users' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>관리자</button>
          </nav>
          {onSignOut && (
            <button className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50" onClick={() => void onSignOut()}>
              로그아웃
            </button>
          )}
        </div>
      </div>

      {section === 'users' ? (
        <SuperadminUsersSection currentUser={currentUser ?? { uid: 'superadmin', role: 'superadmin' }} />
      ) : (
        <>
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="여행사 요청" value={metrics.agencyRequests} />
            <Metric label="개인 여행자 요청" value={metrics.travelerRequests} />
            <Metric label="신규 요청" value={metrics.newRequests} />
            <Metric label="등록 가이드" value={metrics.registeredGuides} />
            <Metric label="승인 가이드" value={metrics.approvedGuides} />
            <Metric label="활성 관리자" value={metrics.activeAdmins} />
            <Metric label="활성 슈퍼관리자" value={metrics.activeSuperAdmins} />
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold">최근 감사 로그</h2>
              <p className="mt-1 text-xs text-slate-400">최근 20건의 플랫폼 감사 로그입니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">시간</th>
                    <th className="px-4 py-3">작업자</th>
                    <th className="px-4 py-3">역할</th>
                    <th className="px-4 py-3">액션</th>
                    <th className="px-4 py-3">대상</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                        감사 로그가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-xs text-slate-500">{log.createdAt}</td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">{log.actorUid}</td>
                        <td className="px-4 py-4 text-xs">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${log.actorRole === 'superadmin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {log.actorRole === 'superadmin' ? '슈퍼 관리자' : '운영 관리자'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-700">{log.action}</td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {log.targetType}/{log.targetId}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function SuperadminUsersSection({ currentUser }: { currentUser: { uid: string; role: AdminRole } }) {
  return (
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-bold">관리자 계정</h2>
        <p className="mt-1 text-xs text-slate-400">역할 변경과 활성 상태만 지원합니다. 계정 삭제는 지원하지 않습니다.</p>
      </div>
      <SuperadminUsersPage currentUser={currentUser} />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
