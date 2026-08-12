import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MapPin, MessageSquareText, Search, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import { getPublicGuideProfiles } from '@/services/publicGuideProfiles';
import { createTravelerRequest, getTravelerRequest, listenTravelerRequests, mapTravelerRequestStatus } from '@/services/travelerRequests';
import { signInTraveler, signUpTraveler, useTravelerUser } from '@/services/travelerAuth';
import type { PublicGuideProfile, TravelerRequest } from '@/types';

const languageOptions = ['영어', '일본어', '중국어', '베트남어', '태국어', '스페인어', '기타'];
const regionOptions = ['서울', '경기', '부산', '대구', '대전', '광주', '제주', '인천', '강원', '전주'];

function Shell({ children, eyebrow, title, description }: { children: React.ReactNode; eyebrow: string; title: string; description: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-coral">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-10 text-center">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function TravelerHomePage() {
  const [guides, setGuides] = useState<PublicGuideProfile[]>([]);
  const [language, setLanguage] = useState('');
  const [region, setRegion] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const items = await getPublicGuideProfiles();
        if (!ignore) {
          setGuides(items);
          setIsLoading(false);
        }
      } catch {
        if (!ignore) setIsLoading(false);
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return guides.filter((guide) => {
      const matchesQuery = !query || guide.name.toLowerCase().includes(query.toLowerCase()) || guide.introduction.toLowerCase().includes(query.toLowerCase());
      const matchesLanguage = !language || guide.languages.includes(language);
      const matchesRegion = !region || guide.regions.includes(region);
      return matchesQuery && matchesLanguage && matchesRegion;
    });
  }, [guides, language, query, region]);

  return (
    <div>
      <Shell eyebrow="개인 여행자" title="검증된 가이드를 직접 찾아 매칭을 요청하세요" description="언어, 지역, 여행 일정에 맞는 가이드를 확인하고 바로 요청할 수 있습니다.">
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3">
            <Search className="size-4 text-muted-foreground" />
            <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="가이드 이름 또는 소개 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select className="h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="">언어 전체</option>
            {languageOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none" value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">지역 전체</option>
            {regionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </Shell>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        {isLoading ? (
          <EmptyState title="가이드를 불러오는 중입니다." body="검증된 가이드 목록을 가져오고 있습니다." />
        ) : filtered.length === 0 ? (
          <EmptyState title="표시할 가이드가 없습니다." body="검색 조건을 바꾸거나 나중에 다시 확인해 주세요." />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {filtered.map((guide) => (
              <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6" key={guide.id}>
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-coral-soft text-coral">
                    <UserRound className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{guide.name}</p>
                    <p className="text-xs text-muted-foreground">{guide.experienceRange}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {guide.languages.map((item) => (
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-bold" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{guide.introduction}</p>
                <div className="mt-auto flex flex-col gap-2 pt-5">
                  <Link className={['w-full rounded-xl border border-border py-2.5 text-center text-sm font-semibold transition', 'hover:border-coral/40 hover:text-coral'].join(' ')} to={`/traveler/guides/${guide.id}`}>
                    상세 보기
                  </Link>
                  <Link
                    className="w-full rounded-xl bg-coral py-2.5 text-center text-sm font-bold text-coral-foreground transition hover:bg-coral/90"
                    to="/traveler/request"
                    state={{ selectedGuideId: guide.id, selectedGuideName: guide.name }}
                  >
                    이 가이드로 매칭 요청
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function TravelerGuideDetailPage() {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<PublicGuideProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    if (!guideId) return;

    const load = async () => {
      try {
        const items = await getPublicGuideProfiles();
        const found = items.find((item) => item.id === guideId) || null;
        if (!ignore) setGuide(found);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [guideId]);

  if (isLoading) {
    return (
      <Shell eyebrow="가이드 상세" title="가이드 정보를 불러오는 중입니다." description="검증된 가이드 정보를 표시합니다.">
        <EmptyState title="로딩 중" body="잠시만 기다려 주세요." />
      </Shell>
    );
  }

  if (!guide) {
    return (
      <Shell eyebrow="가이드 상세" title="가이드를 찾을 수 없습니다." description="요청하신 가이드 정보가 존재하지 않습니다.">
        <div className="mt-6">
          <Link className={['inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold', 'transition hover:border-coral/40 hover:text-coral'].join(' ')} to="/traveler">
            <ArrowLeft className="size-4" />
            여행자 홈으로
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <div>
      <Shell eyebrow="가이드 상세" title={guide.name} description={`${guide.experienceRange} · 검증된 가이드 프로필`}>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-5 rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-coral-soft text-coral">
                <UserRound className="size-6" />
              </span>
              <div>
                <p className="font-bold">{guide.name}</p>
                <p className="text-xs text-muted-foreground">{guide.experienceRange}</p>
              </div>
              <span className="ml-auto rounded-full bg-coral-soft px-3 py-1 text-xs font-bold text-coral">{guide.verified ? '검증 완료' : '검증 대기'}</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{guide.introduction}</p>
            <div className="flex flex-wrap gap-2">
              {guide.languages.map((item) => (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-bold" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {guide.regions.map((item) => (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-bold text-slate-600" key={item}>
                  <MapPin className="size-3.5 text-coral" />
                  {item}
                </span>
              ))}
            </div>
          </section>
          <section className="space-y-4 rounded-2xl border border-border bg-white p-6">
            <p className="text-sm font-bold text-slate-700">요청 정보</p>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="text-xs text-slate-400">가이드</p>
                <p className="font-semibold">{guide.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">언어</p>
                <p className="font-semibold">{guide.languages.join(', ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">활동 지역</p>
                <p className="font-semibold">{guide.regions.join(', ') || '-'}</p>
              </div>
            </div>
            <button
              className="w-full rounded-xl bg-coral py-3 text-sm font-bold text-coral-foreground transition hover:bg-coral/90"
              onClick={() => navigate('/traveler/request', { state: { selectedGuideId: guide.id, selectedGuideName: guide.name } })}
              type="button"
            >
              이 가이드로 매칭 요청
            </button>
          </section>
        </div>
      </Shell>
    </div>
  );
}

export function TravelerRequestPage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useTravelerUser();
  const preselected = useMemo(() => {
    const state = window.history.state as { state?: { selectedGuideId?: string; selectedGuideName?: string } } | null;
    return state?.state ?? null;
  }, []);

  const [form, setForm] = useState({
    travelerName: '',
    contactPhone: '',
    selectedGuideId: preselected?.selectedGuideId || '',
    selectedGuideName: preselected?.selectedGuideName || '',
    region: '',
    customRegion: '',
    startDate: '',
    endDate: '',
    partySize: '',
    language: '',
    requestDetails: '',
    contactConsent: false,
    privacyConsent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (profileLoading) {
    return (
      <Shell eyebrow="개인 여행자 매칭 요청" title="로그인 상태를 확인하는 중입니다." description="잠시만 기다려 주세요.">
        <EmptyState title="불러오는 중" body="여행자 정보를 확인하고 있습니다." />
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell eyebrow="개인 여행자 매칭 요청" title="로그인이 필요합니다." description="매칭 요청을 작성하려면 먼저 로그인해 주세요.">
        <Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-coral-foreground transition hover:bg-coral/90" to="/traveler/login">
          로그인하기
        </Link>
      </Shell>
    );
  }

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.travelerName.trim()) next.travelerName = '이름을 입력해 주세요.';
    if (!form.contactPhone.trim()) next.contactPhone = '연락처를 입력해 주세요.';
    if (!form.region) next.region = '여행 지역을 선택해 주세요.';
    else if (form.region === '기타' && !form.customRegion.trim()) next.region = '지역을 직접 입력해 주세요.';
    if (!form.startDate) next.startDate = '시작 날짜를 선택해 주세요.';
    if (!form.endDate) next.endDate = '종료 날짜를 선택해 주세요.';
    if (!form.partySize) next.partySize = '인원을 입력해 주세요.';
    if (!form.language) next.language = '필요 언어를 선택해 주세요.';
    if (!form.requestDetails.trim()) next.requestDetails = '요청 내용을 입력해 주세요.';
    if (!form.privacyConsent) next.privacyConsent = '개인정보 수집 안내 확인이 필요합니다.';
    if (!form.contactConsent) next.contactConsent = '연락 동의가 필요합니다.';
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !profile) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      const resolvedRegion = form.region === '기타' ? form.customRegion.trim() : form.region;
      await createTravelerRequest({
        ownerUid: profile.ownerUid,
        travelerName: form.travelerName,
        contactPhone: form.contactPhone,
        selectedGuideId: form.selectedGuideId || undefined,
        selectedGuideName: form.selectedGuideName || undefined,
        region: resolvedRegion,
        startDate: form.startDate,
        endDate: form.endDate,
        partySize: form.partySize,
        language: form.language,
        requestDetails: form.requestDetails,
        status: 'submitted',
      });
      setIsSuccess(true);
    } catch {
      setErrors({ submit: '요청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <Shell eyebrow="매칭 요청" title="요청이 접수되었습니다." description="운영팀이 검토 후 적합한 가이드가 있으면 연락드립니다.">
        <Link className={['mt-6 inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-coral-foreground', 'transition hover:bg-coral/90'].join(' ')} to="/traveler/my-requests">
          내 요청 보기
        </Link>
      </Shell>
    );
  }

  return (
    <div>
      <Shell eyebrow="개인 여행자 매칭 요청" title="원하는 가이드와 조건으로 요청을 남기세요." description="선택한 가이드가 있으면 자동으로 함께 저장됩니다.">
        <div className="mt-8 max-w-2xl">
          {form.selectedGuideName && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 text-sm text-muted-foreground">
              <span>
                선택한 가이드: <span className="font-semibold text-ink">{form.selectedGuideName}</span>
              </span>
              <button className="text-xs font-bold text-coral underline decoration-coral/40 underline-offset-4" onClick={() => updateField('selectedGuideName', '')} type="button">
                선택 해제
              </button>
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold">
                이름 *
                <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required value={form.travelerName} onChange={(event) => updateField('travelerName', event.target.value)} />
                {errors.travelerName ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.travelerName}</p> : null}
              </label>
              <label className="block text-sm font-bold">
                연락처 *
                <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required value={form.contactPhone} onChange={(event) => updateField('contactPhone', event.target.value)} />
                {errors.contactPhone ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.contactPhone}</p> : null}
              </label>
              <label className="block text-sm font-bold">
                여행 지역 *
                <select
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                  required
                  value={form.region}
                  onChange={(event) => updateField('region', event.target.value)}
                >
                  <option value="">선택해 주세요</option>
                  {regionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="기타">기타</option>
                </select>
                {errors.region ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.region}</p> : null}
                {form.region === '기타' ? (
                  <input
                    className="mt-3 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                    placeholder="지역을 직접 입력해 주세요"
                    value={form.customRegion}
                    onChange={(event) => updateField('customRegion', event.target.value)}
                  />
                ) : null}
              </label>
              <label className="block text-sm font-bold">
                필요 언어 *
                <select className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required value={form.language} onChange={(event) => updateField('language', event.target.value)}>
                  <option value="">선택해 주세요</option>
                  {languageOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errors.language ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.language}</p> : null}
              </label>
              <label className="block text-sm font-bold">
                시작 날짜 *
                <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} />
                {errors.startDate ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.startDate}</p> : null}
              </label>
              <label className="block text-sm font-bold">
                종료 날짜 *
                <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="date" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} />
                {errors.endDate ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.endDate}</p> : null}
              </label>
            </div>
            <label className="block text-sm font-bold">
              인원 *
              <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" min={1} required type="number" value={form.partySize} onChange={(event) => updateField('partySize', event.target.value)} />
              {errors.partySize ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.partySize}</p> : null}
            </label>
            <label className="block text-sm font-bold">
              요청 내용 *
              <textarea className="mt-2 min-h-28 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required value={form.requestDetails} onChange={(event) => updateField('requestDetails', event.target.value)} />
              {errors.requestDetails ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.requestDetails}</p> : null}
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm">
                <input checked={form.privacyConsent} className="size-4 accent-coral" onChange={(event) => updateField('privacyConsent', event.target.checked)} type="checkbox" />
                <span>개인정보 수집 목적, 항목, 이용 안내를 확인했습니다.</span>
              </label>
              {errors.privacyConsent ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.privacyConsent}</p> : null}
              <label className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm">
                <input checked={form.contactConsent} className="size-4 accent-coral" onChange={(event) => updateField('contactConsent', event.target.checked)} type="checkbox" />
                <span>매칭 요청 처리를 위한 연락에 동의합니다.</span>
              </label>
              {errors.contactConsent ? <p className="mt-2 text-sm font-semibold text-red-700">{errors.contactConsent}</p> : null}
            </div>
            {errors.submit ? <p className="text-sm font-semibold text-red-700">{errors.submit}</p> : null}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold transition hover:bg-muted" onClick={() => navigate('/traveler')} type="button">
                <ArrowLeft className="size-4" />
                홈으로
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-coral-foreground transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? '전송 중...' : '매칭 요청 보내기'}
                <MessageSquareText className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </Shell>
    </div>
  );
}

export function TravelerMyRequestsPage() {
  const { profile, loading: profileLoading } = useTravelerUser();
  const [requests, setRequests] = useState<TravelerRequest[]>([]);
  const [selected, setSelected] = useState<TravelerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!profile?.ownerUid) return;
    let ignore = false;
    const unsubscribe = listenTravelerRequests(
      profile.ownerUid,
      (items) => {
        if (!ignore) {
          setRequests(items);
          setIsLoading(false);
        }
      },
      () => {
        if (!ignore) {
          setRequests([]);
          setIsLoading(false);
          setLoadError('요청을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      },
    );
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [profile?.ownerUid, retryKey]);

  if (profileLoading) {
    return (
      <Shell eyebrow="개인 여행자" title="내 매칭 요청" description="접수한 요청의 상태와 진행 상황을 확인하세요.">
        <EmptyState title="불러오는 중" body="로그인 상태를 확인하고 있습니다." />
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell eyebrow="개인 여행자" title="로그인이 필요합니다." description="내 요청을 보려면 먼저 로그인해 주세요.">
        <Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-coral-foreground transition hover:bg-coral/90" to="/traveler/login">
          로그인하기
        </Link>
      </Shell>
    );
  }

  return (
    <div>
      <Shell eyebrow="개인 여행자" title="내 매칭 요청" description="접수한 요청의 상태와 진행 상황을 확인하세요.">
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-4">
            {loadError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                <p className="font-semibold">{loadError}</p>
                <button
                  className="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700"
                  onClick={() => setRetryKey((prev) => prev + 1)}
                  type="button"
                >
                  다시 시도
                </button>
              </div>
            ) : isLoading ? (
              <EmptyState title="불러오는 중" body="요청 목록을 불러오고 있습니다." />
            ) : requests.length === 0 ? (
              <EmptyState title="접수된 요청이 없습니다." body="새 매칭 요청을 작성해 보세요." />
            ) : (
              requests.map((request) => (
                <button
                  className={`w-full rounded-2xl border p-5 text-left transition ${selected?.id === request.id ? 'border-coral bg-coral-soft' : 'border-border bg-white hover:border-coral/40'}`}
                  key={request.id}
                  onClick={() => setSelected(request)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{request.region}</p>
                      <p className="text-xs text-muted-foreground">{request.startDate} - {request.endDate}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-slate-600">{mapTravelerRequestStatus(request.status)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{request.requestDetails}</p>
                </button>
              ))
            )}
          </section>
          <aside className="rounded-2xl border border-border bg-white p-6">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">요청 ID</p>
                  <p className="text-sm font-semibold">{selected.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">지역</p>
                  <p className="text-sm font-semibold">{selected.region}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">일정</p>
                  <p className="text-sm font-semibold">{selected.startDate} - {selected.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">인원</p>
                  <p className="text-sm font-semibold">{selected.partySize}명</p>
                </div>
                {selected.selectedGuideName && (
                  <div>
                    <p className="text-xs text-slate-400">선택 가이드</p>
                    <p className="text-sm font-semibold">{selected.selectedGuideName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">상태</p>
                  <p className="text-sm font-semibold">{mapTravelerRequestStatus(selected.status)}</p>
                </div>
                <p className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-500 ring-1 ring-slate-200">상태와 담당자만 변경할 수 있습니다.</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">왼쪽 요청을 선택하면 상세 정보를 확인할 수 있습니다.</p>
            )}
          </aside>
        </div>
      </Shell>
    </div>
  );
}

export function TravelerPagesFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-slate-500">
      여행자 페이지를 찾을 수 없습니다.
    </main>
  );
}

export function TravelerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInTraveler(email, password);
      void navigate('/traveler/my-requests');
    } catch {
      setError('로그인 정보를 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,.08)] sm:p-8">
        <p className="text-sm font-bold text-coral">TRAVELER</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">여행자 로그인</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">가이드 매칭 요청 상태를 확인하려면 로그인하세요.</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold">
            이메일
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            비밀번호
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p> : null}
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral text-sm font-bold text-coral-foreground transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            로그인
          </button>
          <p className="text-center text-xs text-slate-500">
            계정이 없으신가요? <Link className="font-semibold text-coral underline decoration-coral/40 underline-offset-4" to="/traveler/register">회원가입</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export function TravelerRegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signUpTraveler(displayName, email, password, phone);
      void navigate('/traveler/my-requests');
    } catch {
      setError('회원가입에 실패했습니다. 입력값을 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,.08)] sm:p-8">
        <p className="text-sm font-bold text-coral">TRAVELER</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">여행자 회원가입</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">가이드 매칭 요청을 등록하려면 계정이 필요합니다.</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold">
            이름
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            이메일
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            비밀번호
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            연락처
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p> : null}
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral text-sm font-bold text-coral-foreground transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            가입하기
          </button>
          <p className="text-center text-xs text-slate-500">
            이미 계정이 있으신가요? <Link className="font-semibold text-coral underline decoration-coral/40 underline-offset-4" to="/traveler/login">로그인</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export function TravelerRequestDetailPage() {
  const { requestId } = useParams<{ requestId?: string }>();
  const [request, setRequest] = useState<TravelerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!requestId) return;

    let ignore = false;

    void getTravelerRequest(requestId)
      .then((item) => {
        if (!ignore) setRequest(item);
      })
      .catch(() => {
        if (!ignore) setRequest(null);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        요청을 불러오는 중입니다.
      </main>
    );
  }

  if (!request) {
    return (
      <Shell eyebrow="개인 여행자" title="요청을 찾을 수 없습니다." description="요청이 삭제되었거나 접근할 수 없습니다.">
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold" onClick={() => navigate('/traveler/my-requests')} type="button">
          <ArrowLeft className="size-4" />
          내 요청으로
        </button>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="개인 여행자" title={`매칭 요청 ${request.id}`} description="요청 상태와 상세 내용을 확인하세요.">
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="space-y-5 rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">{request.region}</p>
              <p className="text-sm text-slate-500">{request.startDate} - {request.endDate}</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-slate-600">{request.status}</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{request.requestDetails || '-'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="인원" value={`${request.partySize}명`} />
            <Info label="언어" value={request.language} />
            <Info label="연락처" value={request.contactPhone} />
            <Info label="선택 가이드" value={request.selectedGuideName || '-'} />
          </div>
        </section>
        <section className="space-y-4 rounded-2xl border border-border bg-white p-6">
          <p className="text-sm font-bold text-slate-700">요청 정보</p>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <p className="text-xs text-slate-400">요청 ID</p>
              <p className="font-semibold">{request.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">여행자</p>
              <p className="font-semibold">{request.travelerName}</p>
            </div>
          </div>
          <button className="w-full rounded-xl border border-border bg-white py-2.5 text-sm font-semibold" onClick={() => navigate('/traveler/my-requests')} type="button">
            내 요청 목록
          </button>
        </section>
      </div>
    </Shell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value || '-'}</p>
    </div>
  );
}

