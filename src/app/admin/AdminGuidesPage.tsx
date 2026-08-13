import { useMemo, useState } from 'react';
import { doc, getDoc, getDocs, query, collection, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { runPreCheck, type PreCheckResult, humanizeFlag } from '@/services/guideVerification';
import type { GuideVerificationReview } from '@/types';

type GuideReviewStatus = GuideVerificationReview['reviewStatus'];

const STATUS_OPTIONS: { value: GuideReviewStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '검토 대기' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'needs_info', label: '보완 필요' },
  { value: 'approved', label: '승인' },
  { value: 'rejected', label: '거절' },
];

const AUTO_STATUS_BADGE: Record<PreCheckResult['status'], { label: string; tone: string }> = {
  ready: { label: '사전 점검 통과', tone: 'bg-emerald-50 text-emerald-700' },
  blocked: { label: '사전 점검 보류', tone: 'bg-amber-50 text-amber-700' },
};

const REVIEW_STATUS_BADGE: Record<GuideReviewStatus, { label: string; tone: string }> = {
  pending: { label: '대기', tone: 'bg-slate-100 text-slate-700' },
  reviewing: { label: '검토 중', tone: 'bg-blue-50 text-blue-700' },
  needs_info: { label: '보완 필요', tone: 'bg-orange-50 text-orange-700' },
  approved: { label: '승인', tone: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '거절', tone: 'bg-rose-50 text-rose-700' },
};

type AdminGuide = {
  uid: string;
  name: string;
  languages: string[];
  regions: string[];
  experienceRange: string;
  submittedAt?: string;
  reviewStatus: GuideReviewStatus;
  autoCheck: PreCheckResult;
};

export function AdminGuidesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<GuideReviewStatus | 'all'>('all');
  const [selected, setSelected] = useState<AdminGuide | null>(null);
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadGuides = async () => {
    setIsLoading(true);
    setLoadError(false);
    setActionError(null);

    try {
      const profileSnap = await getDocs(query(collection(db, 'guideProfiles'), orderBy('updatedAt', 'desc')));
      const registrationSnap = await getDocs(collection(db, 'guideRegistrations'));
      const registrationByUid = new Map<string, Record<string, unknown>>();
      registrationSnap.docs.forEach((docSnap) => registrationByUid.set(docSnap.id, docSnap.data()));

      const reviewSnap = await getDocs(collection(db, 'guideVerificationReviews'));
      const reviewByUid = new Map<string, GuideVerificationReview>();
      reviewSnap.docs.forEach((docSnap) => reviewByUid.set(docSnap.id, docSnap.data() as GuideVerificationReview));

      const items: AdminGuide[] = [];

      for (const profileDoc of profileSnap.docs) {
        const uid = profileDoc.id;
        const profile = profileDoc.data() as Record<string, unknown>;
        const registration = registrationByUid.get(uid);
        if (!registration) continue;

        const precheck = await runPreCheck(uid).catch(() => ({ status: 'blocked' as const, flags: ['PRE_CHECK_ERROR'] }));
        const review = reviewByUid.get(uid);

        const name = typeof profile.name === 'string' ? profile.name : uid;
        const languages = Array.isArray(profile.languages) ? profile.languages.filter((item): item is string => typeof item === 'string') : [];
        const regions = Array.isArray(profile.regions) ? profile.regions.filter((item): item is string => typeof item === 'string') : [];
        const experienceRange = typeof profile.experienceRange === 'string' ? profile.experienceRange : '';
        const submittedAt = typeof registration.submittedAt === 'string' ? registration.submittedAt : undefined;

        items.push({
          uid,
          name,
          languages,
          regions,
          experienceRange,
          submittedAt,
          reviewStatus: review?.reviewStatus ?? 'pending',
          autoCheck: precheck,
        });
      }

      setGuides(items);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useState(() => {
    void loadGuides();
  });

  const filtered = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    return guides.filter((guide) => {
      const matchesQuery = !lowered || `${guide.name} ${guide.languages.join(' ')} ${guide.regions.join(' ')}`.toLowerCase().includes(lowered);
      const matchesStatus = status === 'all' || guide.reviewStatus === status;
      return matchesQuery && matchesStatus;
    });
  }, [guides, searchQuery, status]);

  const stats = useMemo(() => ({
    pending: guides.filter((g) => g.reviewStatus === 'pending').length,
    ready: guides.filter((g) => g.autoCheck.status === 'ready').length,
    blocked: guides.filter((g) => g.autoCheck.status === 'blocked').length,
    approved: guides.filter((g) => g.reviewStatus === 'approved').length,
  }), [guides]);

  const applyReview = async (uid: string, nextStatus: GuideReviewStatus, note?: string) => {
    setActionLoading(`${uid}:${nextStatus}`);
    setActionError(null);

    try {
      const profileRef = doc(db, 'guideProfiles', uid);
      const registrationRef = doc(db, 'guideRegistrations', uid);
      const profileSnap = await getDoc(profileRef);
      const registrationSnap = await getDoc(registrationRef);

      if (!profileSnap.exists() || !registrationSnap.exists()) {
        throw new Error('REQUIRED_DOCUMENT_MISSING');
      }

      const profileData = profileSnap.data() as Record<string, unknown>;
      const currentStatus = (profileData.profileStatus as string | undefined) ?? 'pending';
      if (currentStatus === nextStatus) {
        await loadGuides();
        return;
      }

      const now = new Date().toISOString();
      const batch = writeBatch(db);

      if (nextStatus === 'approved') {
        const latestPreCheck = await runPreCheck(uid).catch(() => ({ status: 'blocked' as const, flags: ['PRE_CHECK_ERROR'] }));
        if (latestPreCheck.status === 'blocked') {
          throw new Error('BLOCKED_PRE_CHECK');
        }

        batch.update(profileRef, { profileStatus: 'verified', updatedAt: now });
        batch.update(registrationRef, { verificationStatus: 'verified', updatedAt: now });
        batch.set(doc(db, 'publicGuideProfiles', uid), {
          id: uid,
          ownerUid: uid,
          name: profileData.name,
          languages: profileData.languages,
          regions: profileData.regions,
          experienceRange: profileData.experienceRange,
          introduction: profileData.introduction,
          profilePhotoUrl: profileData.profilePhotoUrl ?? null,
          verified: true,
          featured: false,
          displayOrder: null,
          publishedAt: now,
          updatedAt: now,
        });
      } else if (nextStatus === 'needs_info') {
        batch.update(profileRef, { profileStatus: 'needs_info', updatedAt: now });
        batch.update(registrationRef, { verificationStatus: 'needs_info', updatedAt: now });
        const publicRef = doc(db, 'publicGuideProfiles', uid);
        const publicSnap = await getDoc(publicRef);
        if (publicSnap.exists()) {
          batch.delete(publicRef);
        }
      } else if (nextStatus === 'rejected') {
        batch.update(profileRef, { profileStatus: 'rejected', updatedAt: now });
        batch.update(registrationRef, { verificationStatus: 'rejected', updatedAt: now });
        const publicRef = doc(db, 'publicGuideProfiles', uid);
        const publicSnap = await getDoc(publicRef);
        if (publicSnap.exists()) {
          batch.delete(publicRef);
        }
      }

      const reviewRef = doc(db, 'guideVerificationReviews', uid);
      batch.set(reviewRef, {
        guideUid: uid,
        reviewStatus: nextStatus,
        autoCheckStatus: profileData.autoCheckStatus ?? 'blocked',
        flags: Array.isArray(profileData.flags) ? profileData.flags : [],
        reviewedBy: 'admin',
        reviewedAt: now,
        updatedAt: now,
        adminNote: note ?? '',
      });

      const logRef = doc(collection(db, 'guideVerificationLogs'));
      batch.set(logRef, {
        guideUid: uid,
        action: nextStatus,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        adminUid: 'admin',
        createdAt: now,
      });

      await batch.commit();
      await loadGuides();
      setSelected((current) => {
        if (current && current.uid === uid) {
          return { ...current, reviewStatus: nextStatus };
        }
        return current;
      });
    } catch {
      setActionError('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold text-rose-500">GUIDES</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">가이드 검증 관리</h1>
          <p className="mt-2 text-sm text-slate-500">자동 사전 점검 결과를 확인하고 검증 상태를 관리하세요.</p>
        </div>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="검토 대기" value={stats.pending} />
        <Metric label="사전 점검 통과" value={stats.ready} />
        <Metric label="보완 필요" value={stats.blocked} />
        <Metric label="승인" value={stats.approved} />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">가이드 검증 목록</h2>
            <p className="mt-1 text-xs text-slate-400">자동 점검 결과와 검증 상태를 관리하세요.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 min-w-64 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <span className="text-slate-400">🔍</span>
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="이름, 언어, 활동 지역 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as GuideReviewStatus | 'all')}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">가이드</th>
                <th className="px-4 py-3">활동 정보</th>
                <th className="px-4 py-3">자동 점검</th>
                <th className="px-4 py-3">검증 상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                    가이드 정보를 불러오는 중입니다.
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
                    불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                    <br />
                    <button className="mt-3 font-semibold text-rose-500" onClick={loadGuides}>
                      다시 시도
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-400" colSpan={5}>
                    표시할 가이드가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((guide) => {
                  const autoBadge = AUTO_STATUS_BADGE[guide.autoCheck.status];
                  const reviewBadge = REVIEW_STATUS_BADGE[guide.reviewStatus];
                  return (
                    <tr
                      key={guide.uid}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                      onClick={() => setSelected(guide)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
                            {guide.name.slice(0, 1)}
                          </span>
                          <div>
                            <button
                              type="button"
                              className="text-left font-semibold hover:text-rose-500 hover:underline"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected(guide);
                              }}
                              aria-label={`${guide.name} 가이드 검증 상세 보기`}
                            >
                              {guide.name}
                            </button>
                            <p className="mt-1 text-xs text-slate-400">{guide.experienceRange}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center gap-1">
                          {guide.languages.map((language) => (
                            <span key={language} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
                              {language}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                          {guide.regions.join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${autoBadge.tone}`}>
                          {autoBadge.label}
                        </span>
                        {guide.autoCheck.flags.length > 0 && (
                          <p className="mt-1 text-[11px] text-slate-400">{guide.autoCheck.flags.map(humanizeFlag).join(', ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${reviewBadge.tone}`}>
                          {reviewBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-slate-300">›</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
          <span>총 {filtered.length}건</span>
        </div>
      </section>

      {selected && (
        <GuideDrawer
          guide={selected}
          onClose={() => setSelected(null)}
          onAction={applyReview}
          actionLoading={actionLoading}
          actionError={actionError}
        />
      )}
    </main>
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

function GuideDrawer({
  guide,
  onClose,
  onAction,
  actionLoading,
  actionError,
}: {
  guide: AdminGuide;
  onClose: () => void;
  onAction: (uid: string, status: GuideReviewStatus, note?: string) => Promise<void>;
  actionLoading: string | null;
  actionError: string | null;
}) {
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (next: GuideReviewStatus) => {
    setLocalError(null);
    if (next === 'approved') {
      if (guide.reviewStatus === 'approved') {
        setLocalError('이미 승인된 가이드입니다.');
        return;
      }

      const latestPreCheck = await runPreCheck(guide.uid).catch(() => ({ status: 'blocked' as const, flags: ['PRE_CHECK_ERROR'] }));
      if (latestPreCheck.status === 'blocked') {
        setLocalError('사전 점검 보류 항목을 먼저 확인해 주세요.');
        return;
      }
    }

    if (next === 'needs_info' && !note.trim()) {
      setLocalError('보완 요청 사유를 입력해 주세요.');
      return;
    }
    await onAction(guide.uid, next, note.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-rose-500">{guide.uid}</p>
            <h2 className="mt-1 text-lg font-bold">가이드 검증 상세</h2>
          </div>
          <button className="rounded-xl border border-slate-200 p-2" onClick={onClose}>
            <span className="text-slate-500">✕</span>
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">기본 정보</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="이름" value={guide.name} />
              <Info label="경력" value={guide.experienceRange} />
              <Info label="활동 언어" value={guide.languages.join(', ')} />
              <Info label="활동 지역" value={guide.regions.join(', ')} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">자동 사전 점검</h3>
            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${AUTO_STATUS_BADGE[guide.autoCheck.status].tone}`}>
              {AUTO_STATUS_BADGE[guide.autoCheck.status].label}
            </div>
            {guide.autoCheck.flags.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                {guide.autoCheck.flags.map((flag) => (
                  <li key={flag}>{humanizeFlag(flag)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">특이사항이 없습니다.</p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">검증 작업</h3>
            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${REVIEW_STATUS_BADGE[guide.reviewStatus].tone}`}>
              현재 상태: {REVIEW_STATUS_BADGE[guide.reviewStatus].label}
            </div>
            <label className="block text-xs text-slate-500">
              관리자 메모
              <textarea
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="보완 요청 사유 또는 내부 메모를 입력하세요."
              />
            </label>
            {(actionError || localError) && <p className="text-sm text-red-700">{actionError || localError}</p>}
            {guide.autoCheck.status === 'blocked' && (
              <p className="text-xs text-slate-500">사전 점검 보류 항목을 먼저 확인해 주세요.</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={actionLoading !== null || guide.reviewStatus === 'approved' || guide.autoCheck.status === 'blocked'}
                onClick={() => submit('approved')}
              >
                {actionLoading === `${guide.uid}:approved` ? '처리 중...' : guide.reviewStatus === 'approved' ? '승인됨' : '승인'}
              </button>
              <button
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-800 disabled:opacity-60"
                disabled={actionLoading !== null || guide.reviewStatus === 'needs_info'}
                onClick={() => submit('needs_info')}
              >
                {actionLoading === `${guide.uid}:needs_info` ? '처리 중...' : guide.reviewStatus === 'needs_info' ? '보완 요청됨' : '보완 요청'}
              </button>
              <button
                className="flex-1 rounded-xl border border-rose-200 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
                disabled={actionLoading !== null || guide.reviewStatus === 'rejected'}
                onClick={() => submit('rejected')}
              >
                {actionLoading === `${guide.uid}:rejected` ? '처리 중...' : guide.reviewStatus === 'rejected' ? '거절됨' : '거절'}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
