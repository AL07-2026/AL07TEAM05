import { useEffect, useState } from 'react';
import { Loader2, UserRound } from 'lucide-react';

import { getAdminUsers, updateAdminUserRole } from '@/services/adminAuth';
import { createAuditLog, listenAuditLogs } from '@/services/adminAuth';
import type { AdminRole, AdminUser, PlatformAuditLog } from '@/types';

type AdminUserRow = AdminUser & { safeId: string };

export function SuperadminUsersPage({ currentUser }: { currentUser: { uid: string; role: AdminRole } }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [logs, setLogs] = useState<{ id: string; actorUid: string; action: string; targetId: string; createdAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const items = await getAdminUsers();
        const rows: AdminUserRow[] = items.map((item) => ({ ...item, safeId: item.uid || item.email }));
        if (!ignore) {
          setUsers(rows);
        }
      } catch {
        if (!ignore) setError('관리자 목록을 불러오지 못했습니다.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void load();

    const unsubscribe = listenAuditLogs(
      (latest: PlatformAuditLog[]) => {
        const actions = new Set(['ADMIN_ROLE_UPDATED', 'ADMIN_ACTIVATED', 'ADMIN_DEACTIVATED']);
        const filtered = latest
          .filter((log) => actions.has(log.action))
          .map((log) => ({ id: log.targetId, actorUid: log.actorUid, action: log.action, targetId: log.targetId, createdAt: log.createdAt }));
        if (!ignore) setLogs(filtered.slice(0, 20));
      },
      20,
    );

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  const updateRole = async (uid: string, nextRole: AdminRole) => {
    if (uid === currentUser.uid) {
      alert('본인 권한은 변경할 수 없습니다.');
      return;
    }
    const target = users.find((item) => item.uid === uid);
    if (!target) return;

    if (nextRole !== 'superadmin') {
      const activeSuperAdmins = users.filter((item) => item.role === 'superadmin' && item.active && item.uid !== uid);
      if (target.role === 'superadmin' && activeSuperAdmins.length === 0) {
        alert('마지막 superadmin은 해제할 수 없습니다.');
        return;
      }
    }

    await updateAdminUserRole(uid, nextRole);
    await createAuditLog({
      actorUid: currentUser.uid,
      actorRole: currentUser.role,
      action: 'ADMIN_ROLE_UPDATED',
      targetType: 'adminUser',
      targetId: uid,
      before: { role: target.role },
      after: { role: nextRole },
      createdAt: new Date().toISOString(),
    });
    setUsers((current) => current.map((item) => (item.uid === uid ? { ...item, role: nextRole } : item)));
  };

  const toggleActive = async (uid: string, nextActive: boolean) => {
    if (uid === currentUser.uid) {
      alert('본인 계정은 비활성화할 수 없습니다.');
      return;
    }
    const target = users.find((item) => item.uid === uid);
    if (!target) return;

    if (target.role === 'superadmin' && !nextActive) {
      alert('superadmin을 비활성화할 수 없습니다.');
      return;
    }

    const activeSuperAdmins = users.filter((item) => item.role === 'superadmin' && item.active && item.uid !== uid);
    if (target.role === 'superadmin' && nextActive === false && activeSuperAdmins.length === 0) {
      alert('마지막 superadmin은 비활성화할 수 없습니다.');
      return;
    }

    await updateAdminUserRole(uid, target.active ? 'admin' : 'superadmin');
    await createAuditLog({
      actorUid: currentUser.uid,
      actorRole: currentUser.role,
      action: nextActive ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED',
      targetType: 'adminUser',
      targetId: uid,
      before: { active: target.active },
      after: { active: nextActive },
      createdAt: new Date().toISOString(),
    });
    setUsers((current) => current.map((item) => (item.uid === uid ? { ...item, active: nextActive } : item)));
  };

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold text-amber-600">SUPERADMIN</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">관리자 계정</h1>
          <p className="mt-2 text-sm text-slate-500">admin / superadmin 역할과 활성 상태를 관리하세요.</p>
        </div>
      </div>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold">전체 관리자</h2>
          <p className="mt-1 text-xs text-slate-400">역할 변경과 활성 상태만 지원합니다. 계정 삭제는 지원하지 않습니다.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">관리자</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">역할</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
                    {error}
                    <br />
                    <button className="mt-3 font-semibold text-rose-500" onClick={() => window.location.reload()}>
                      다시 시도
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.safeId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                          {user.displayName?.[0] ?? <UserRound className="size-4" />}
                        </span>
                        <div>
                          <p className="font-semibold">{user.displayName}</p>
                          <p className="text-xs text-slate-400">{user.safeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">{user.email}</td>
                    <td className="px-4 py-4">
                      <select
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                        value={user.role}
                        onChange={(event) => void updateRole(user.uid, event.target.value as AdminRole)}
                      >
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${user.active ? 'border border-slate-200 hover:bg-slate-50' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                        onClick={() => void toggleActive(user.uid, !user.active)}
                      >
                        {user.active ? '비활성화' : '활성화'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-400">총 {users.length}명</div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold">최근 관리자 변경 로그</h2>
          <p className="mt-1 text-xs text-slate-400">역할/활성 변경 기록을 확인하세요.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">시간</th>
                <th className="px-4 py-3">작업자</th>
                <th className="px-4 py-3">액션</th>
                <th className="px-4 py-3">대상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-400" colSpan={4}>
                    변경 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-xs text-slate-500">{log.createdAt}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">{log.actorUid}</td>
                    <td className="px-4 py-4 text-xs text-slate-700">{log.action}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{log.targetId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
