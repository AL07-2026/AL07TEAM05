import { CalendarDays, ChevronRight, Filter, MapPin, MessageSquareText, Search, UserRound } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { getAgencyRequests, formatDateRange, formatGuideRequirement, updateAgencyRequestOperations, type AdminAgencyRequest } from '@/services/agencyRequests';
import { getTravelerRequests, updateTravelerRequestOperations } from '@/services/travelerRequests';
import { createAuditLog, getCurrentAdminAccess } from '@/services/adminAuth';
import {
  type AdminUnifiedRequest,
  adminStatusTone,
  buildUnifiedRequests,
  emptyValueFallback,
  filterUnifiedRequests,
  isAgencyRequest,
  normalizeAdminStatus,
} from '@/app/admin/adminUnifiedRequests';
import type { TravelerRequest } from '@/types';

const REQUEST_STATES = ['신규', '검토 중', '정보 보완', '가이드 탐색', '제안 완료', '매칭 확정'] as const;
type RequestState = typeof REQUEST_STATES[number];
type RequestTypeFilter = 'all' | 'agency' | 'traveler';

export function AdminRequestsPage() {
  const [filterType, setFilterType] = useState<RequestTypeFilter>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('전체');
  const [agencyRequests, setAgencyRequests] = useState<AdminAgencyRequest[]>([]);
  const [travelerRequests, setTravelerRequests] = useState<TravelerRequest[]>([]);
  const [selected, setSelected] = useState<AdminUnifiedRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([getAgencyRequests(), getTravelerRequests()])
      .then(([agency, traveler]) => {
        if (!isMounted) return;
        setAgencyRequests(agency);
        setTravelerRequests(traveler);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const agencyCount = agencyRequests.length;
  const travelerCount = travelerRequests.length;
  const totalCount = agencyCount + travelerCount;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const prepared = buildUnifiedRequests(agencyRequests, travelerRequests, filterType);
    return filterUnifiedRequests(prepared, normalizedQuery, status);
  }, [agencyRequests, travelerRequests, filterType, query, status]);

  const activeSelected = selected && filtered.some((row) => row.id === selected.id) ? selected : filtered[0] ?? null;

  const optimisticStatusUpdate = (request: AdminUnifiedRequest, nextStatus: string) => {
    if (isAgencyRequest(request)) {
      setAgencyRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: nextStatus as AdminAgencyRequest['status'] } : item));
    } else {
      setTravelerRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: nextStatus } : item));
    }
    setSelected((prev) => prev && prev.id === request.id ? { ...prev, status: nextStatus } : prev);
  };

  const optimisticAssigneeUpdate = (request: AdminUnifiedRequest, nextAssignee: string) => {
    if (isAgencyRequest(request)) {
      setAgencyRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, assignee: nextAssignee } : item));
    } else {
      setTravelerRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, assignee: nextAssignee } : item));
    }
    setSelected((prev) => prev && prev.id === request.id ? { ...prev, assignee: nextAssignee } : prev);
  };

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-rose-500">REQUESTS</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">매칭 요청 조회</h1>
          <p className="mt-2 text-sm text-slate-500">접수된 요청을 빠르게 훑고 필요한 정보를 확인하세요.</p>
        </div>
        <span className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500">운영 지원</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterButton label={`전체 ${totalCount}`} active={filterType === 'all'} onClick={() => { setFilterType('all'); setSelected(null); }} />
        <FilterButton label={`여행사 ${agencyCount}`} active={filterType === 'agency'} onClick={() => { setFilterType('agency'); setSelected(null); }} />
        <FilterButton label={`개인 여행자 ${travelerCount}`} active={filterType === 'traveler'} onClick={() => { setFilterType('traveler'); setSelected(null); }} />
      </div>
      <div className="mt-7 grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white xl:grid-cols-[1.45fr_.85fr]">
        <section className="min-w-0 border-r border-slate-100">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search className="size-4 text-slate-400" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="요청번호, 회사명, 행사명, 여행자, 지역 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm">
              <Filter className="size-4 text-slate-400" />
              <select className="bg-transparent outline-none" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>전체</option>
                {REQUEST_STATES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">요청 정보</th>
                  <th className="px-3 py-3">일정</th>
                  <th className="px-3 py-3">지역 / 언어</th>
                  <th className="px-3 py-3">상태</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                      매칭 요청을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                      매칭 요청을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                      <br />
                      <button
                        className="mt-3 font-semibold text-rose-500"
                        onClick={() => {
                          setIsLoading(true);
                          setLoadError(false);
                          void Promise.all([getAgencyRequests(), getTravelerRequests()])
                            .then(([agency, traveler]) => {
                              setAgencyRequests(agency);
                              setTravelerRequests(traveler);
                            })
                            .catch(() => setLoadError(true))
                            .finally(() => setIsLoading(false));
                        }}
                        type="button"
                      >
                        다시 시도
                      </button>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                      조건에 맞는 매칭 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const agency = isAgencyRequest(row);
                    return (
                      <tr
                        onClick={() => setSelected(row)}
                        className={`cursor-pointer hover:bg-slate-50 ${activeSelected?.id === row.id ? 'bg-rose-50/40' : ''}`}
                        key={row.id}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${agency ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                              {agency ? '여행사' : '개인 여행자'}
                            </span>
                            <b className="truncate">{agency ? row.event : row.requestDetails || '여행자 매칭 요청'}</b>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {row.id} · {agency ? row.company : row.travelerName}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <p className="truncate">{formatDateRange(row.startDate, row.endDate)}</p>
                          <p className="mt-1 truncate text-xs text-slate-400">{emptyValueFallback(row.region)}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          {agency ? (
                            <>
                              <p className="truncate">{row.languages.join(' · ') || '-'}</p>
                              <p className="mt-1 truncate text-xs text-slate-400">{row.guides}명</p>
                            </>
                          ) : (
                            <p className="truncate">{emptyValueFallback(row.language)}</p>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${adminStatusTone(row.status)}`}>
                            {normalizeAdminStatus(row.status)}
                          </span>
                        </td>
                        <td className="pr-3">
                          <ChevronRight className="size-4 text-slate-300" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-4 text-xs text-slate-400">검색 결과 {filtered.length}건</div>
        </section>
        <UnifiedRequestDetail
          request={activeSelected}
          onStatusUpdated={optimisticStatusUpdate}
          onAssigneeUpdated={optimisticAssigneeUpdate}
        />
      </div>
    </main>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-bold ${active ? 'bg-coral text-coral-foreground' : 'border border-border bg-white text-slate-600'}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function UnifiedRequestDetail({ request, onStatusUpdated, onAssigneeUpdated }: {
  request: AdminUnifiedRequest | null;
  onStatusUpdated?: (request: AdminUnifiedRequest, value: string) => void;
  onAssigneeUpdated?: (request: AdminUnifiedRequest, value: string) => void;
}) {
  if (!request) {
    return <aside className="bg-slate-50/40 p-5 text-sm text-slate-400 xl:p-6">선택할 매칭 요청이 없습니다.</aside>;
  }

  const isAgency = isAgencyRequest(request);
  const dateRange = isAgency ? formatDateRange(request.startDate, request.endDate) : `${request.startDate} - ${request.endDate}`;
  const guideRequirement = isAgency ? formatGuideRequirement(request.languages, request.guides) : emptyValueFallback(request.language);

  return (
    <aside className="bg-slate-50/40 p-5 xl:p-6" key={request.id}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${isAgency ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
              {isAgency ? '여행사' : '개인 여행자'}
            </span>
            <p className="text-[11px] font-medium text-slate-400">{emptyValueFallback(request.id)}</p>
          </div>
          <h2 className="mt-1 text-xl font-bold">{isAgency ? request.event : '여행자 매칭 요청'}</h2>
          <p className="mt-1 text-sm text-slate-400">{isAgency ? request.company : request.travelerName}</p>
        </div>
        {isAgency && request.urgency === '긴급' && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">긴급</span>}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <DetailBox label="진행 지역" value={emptyValueFallback(request.region)} icon={<MapPin className="size-4" />} />
        <DetailBox label="행사 일정" value={dateRange} icon={<CalendarDays className="size-4" />} />
      </div>
      <div className="mt-5 grid gap-3">
        <EditableField
          label="진행 상태"
          icon={<ChevronRight className="size-4" />}
          value={normalizeAdminStatus(request.status)}
          options={REQUEST_STATES}
          onSave={async (value) => {
            const admin = await getCurrentAdminAccess();
            if (isAgency) {
              await updateAgencyRequestOperations({ requestId: request.id, status: value });
            } else {
              await updateTravelerRequestOperations({ requestId: request.id, status: value });
            }
            onStatusUpdated?.(request, value);
            if (admin) {
              await createAuditLog({
                actorUid: admin.uid,
                actorRole: admin.role,
                action: 'request_status_updated',
                targetType: isAgency ? 'agencyRequest' : 'travelerRequest',
                targetId: request.id,
                before: { status: request.status },
                after: { status: value },
                createdAt: new Date().toISOString(),
              });
            }
          }}
        />
        <AssigneeField
          label="내부 담당자"
          icon={<UserRound className="size-4" />}
          value={request.assignee || '미지정'}
          onChange={async (value) => {
            const admin = await getCurrentAdminAccess();
            if (isAgency) {
              await updateAgencyRequestOperations({ requestId: request.id, assignee: value });
            } else {
              await updateTravelerRequestOperations({ requestId: request.id, assignee: value });
            }
            onAssigneeUpdated?.(request, value);
            if (admin) {
              await createAuditLog({
                actorUid: admin.uid,
                actorRole: admin.role,
                action: 'request_assignee_updated',
                targetType: isAgency ? 'agencyRequest' : 'travelerRequest',
                targetId: request.id,
                before: { assignee: request.assignee || '미지정' },
                after: { assignee: value },
                createdAt: new Date().toISOString(),
              });
            }
          }}
        />
        {isAgency ? (
          <>
            <DetailBox label="필요 가이드" value={guideRequirement} icon={<UserRound className="size-4" />} />
            {(request.preferredGuideId || request.preferredGuideName) && (
              <DetailBox label="선택 가이드" value={emptyValueFallback(request.preferredGuideName)} icon={<UserRound className="size-4" />} />
            )}
          </>
        ) : (
          <>
            <DetailBox label="필요 언어" value={emptyValueFallback(request.language)} icon={<MessageSquareText className="size-4" />} />
            <DetailBox label="연락처" value={emptyValueFallback(request.contactPhone)} icon={<MessageSquareText className="size-4" />} />
            {request.selectedGuideName && (
              <DetailBox label="선택 가이드" value={emptyValueFallback(request.selectedGuideName)} icon={<UserRound className="size-4" />} />
            )}
          </>
        )}
      </div>
      {isAgency ? (
        <>
          <div className="mt-5">
            <Label>여행사 담당자</Label>
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
              <b className="text-sm">{request.manager}</b>
              <p className="mt-1 text-xs text-slate-400">{emptyValueFallback(request.phone)}</p>
            </div>
          </div>
          <div className="mt-5">
            <Label>주요 업무</Label>
            <p className="mt-2 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{emptyValueFallback(request.task)}</p>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <Label>요청 내용</Label>
          <p className="mt-2 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{emptyValueFallback(request.requestDetails)}</p>
        </div>
      )}
      <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-500 ring-1 ring-slate-200">상태와 담당자만 변경할 수 있습니다.</p>
    </aside>
  );
}

function DetailBox({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
        {icon}
        {label}
      </span>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return <p className="text-xs font-bold text-slate-500">{children}</p>;
}

function EditableField({ label, icon, value, options, onSave }: { label: string; icon: ReactNode; value: string; options: readonly RequestState[]; onSave: (value: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">{icon}{label}</span>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${adminStatusTone(value)}`}>{value}</span>
        <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600" onClick={() => setOpen((prev) => !prev)}>
          {open ? '닫기' : '변경'}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            value={value}
            onChange={(event) => {
              setError(null);
              const next = event.target.value;
              if (next === value) {
                setOpen(false);
                return;
              }
              setSaving(true);
              void (async () => {
                try {
                  await onSave(next);
                } catch (caughtError) {
                  const message = caughtError instanceof Error ? caughtError.message : '저장에 실패했습니다.';
                  setError(message);
                  return;
                } finally {
                  setSaving(false);
                }
                setOpen(false);
              })();
            }}
            disabled={saving}
          >
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {saving && <p className="text-xs text-slate-400">저장 중...</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <p className="text-[11px] text-slate-400">상태 변경은 즉시 반영되며, 새로고침 후에도 유지됩니다.</p>
        </div>
      )}
    </div>
  );
}

function AssigneeField({ label, icon, value, onChange }: { label: string; icon: ReactNode; value: string; onChange: (value: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ displayName: string } | null>(null);

  useEffect(() => {
    void getCurrentAdminAccess().then((admin) => {
      if (admin) setCurrentAdmin({ displayName: admin.displayName });
    });
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">{icon}{label}</span>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{value}</span>
        <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600" onClick={() => setOpen((prev) => !prev)}>
          {open ? '닫기' : '변경'}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            value={value}
            onChange={(event) => {
              setError(null);
              const next = event.target.value;
              if (next === value) {
                setOpen(false);
                return;
              }
              setSaving(true);
              void (async () => {
                try {
                  await onChange(next);
                } catch (caughtError) {
                  const message = caughtError instanceof Error ? caughtError.message : '저장에 실패했습니다.';
                  setError(message);
                  return;
                } finally {
                  setSaving(false);
                }
                setOpen(false);
              })();
            }}
            disabled={saving}
          >
            <option value="미지정">미지정</option>
            {currentAdmin ? <option value={currentAdmin.displayName}>나에게 배정 ({currentAdmin.displayName})</option> : null}
          </select>
          {saving && <p className="text-xs text-slate-400">저장 중...</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <p className="text-[11px] text-slate-400">현재 관리자에게만 빠르게 배정할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
