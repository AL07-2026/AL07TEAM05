import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Globe2,
  Handshake,
  Languages,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, Outlet, RouterProvider, createBrowserRouter, useLocation, useNavigate } from 'react-router';
import GuideRegisterPage from './pages/GuideRegisterPage';

import { AdminAuthGate } from '@/app/admin/AdminAuthGate';
import { FeaturedGuidesSection } from '@/components/FeaturedGuidesSection';
import { createAgencyRequest } from '@/services/agencyRequests';
import { getFeaturedGuides } from '@/services/featuredGuides';
import type { PublicGuideProfile } from '@/types';

export type AgencyRequest = {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContactMethod: string;
  companyDescription: string;
  eventName: string;
  eventType: string;
  region: string;
  startDate: string;
  endDate: string;
  participantCount: string;
  guideCount: string;
  languages: string[];
  customLanguage: string;
  taskDescription: string;
  certificatePriority: string;
  sourcingExperience: string;
  urgency: string;
  preferredExperience: string;
  similarEventExperience: string;
  drivingRequired: string;
  budget: string;
  additionalNotes: string;
  privacyConsent: boolean;
  contactConsent: boolean;
};

type StoredAgencyRequest = AgencyRequest & {
  id: string;
  status: 'submitted';
  createdAt: string;
};

type AgencyEventName =
  | 'agency_page_view'
  | 'agency_request_start'
  | 'agency_request_submit_attempt'
  | 'agency_request_submit_success'
  | 'agency_request_submit_error';

const initialRequest: AgencyRequest = {
  companyName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  preferredContactMethod: '',
  companyDescription: '',
  eventName: '',
  eventType: '',
  region: '',
  startDate: '',
  endDate: '',
  participantCount: '',
  guideCount: '',
  languages: [],
  customLanguage: '',
  taskDescription: '',
  certificatePriority: '',
  sourcingExperience: '',
  urgency: '',
  preferredExperience: '',
  similarEventExperience: '',
  drivingRequired: '',
  budget: '',
  additionalNotes: '',
  privacyConsent: false,
  contactConsent: false,
};

const languageOptions = ['영어', '일본어', '중국어', '베트남어', '태국어', '스페인어', '기타'];

const eventTypes = [
  '인바운드 단체 관광',
  '기업 인센티브 투어',
  '국제 행사',
  '전시 및 박람회',
  '의료 관광',
  '비즈니스 사전 답사',
  '지역 사업',
  '기타',
];

const certificatePriorityOptions = [
  '반드시 필요',
  '있으면 좋지만 경력도 중요',
  '자격증보다 추천과 실제 경험이 중요',
  '아직 모르겠음',
];

const sourcingExperienceOptions = [
  '해당 언어 또는 지역의 가이드를 처음 찾음',
  '이전에 찾았지만 현재 연락 가능한 사람이 없음',
  '기존 가이드가 있지만 추가 인력이 필요',
  '기존 가이드를 대체할 인력이 필요',
];

const urgencyOptions = ['오늘 안에 확인 필요', '3일 이내', '일주일 이내', '일정 협의 가능'];

const primaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-coral-foreground transition hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const inputClass =
  'mt-2 min-h-12 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20';

const selectClass = `${inputClass} appearance-none`;

const textareaClass =
  'mt-2 min-h-28 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20';

const requestSteps = [
  { title: '회사 정보', description: '연락 가능한 기본 정보를 입력합니다.' },
  { title: '행사 정보', description: '일정과 규모를 정리합니다.' },
  { title: '가이드 조건', description: '언어, 업무, 우선순위를 선택합니다.' },
  { title: '제출 확인', description: '요청 내용을 검토하고 보냅니다.' },
] as const;

const processSteps: Array<[string, string, string, LucideIcon]> = [
  ['1', '요청 작성', '회사와 행사 정보를 입력합니다.', FileText],
  ['2', '조건 검토', '일정, 언어, 지역을 확인합니다.', ClipboardCheck],
  ['3', '후보 탐색', '조건에 맞는 가이드를 찾습니다.', Search],
  ['4', '담당자 안내', '확인된 내용을 연락드립니다.', Send],
];

function trackAgencyEvent(eventName: AgencyEventName, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
  try {
    const stored = JSON.parse(localStorage.getItem('agencyAnalyticsEvents') || '[]') as unknown[];
    stored.push({ eventName, detail, createdAt: new Date().toISOString() });
    localStorage.setItem('agencyAnalyticsEvents', JSON.stringify(stored.slice(-500)));
  } catch {
    // Analytics must never interrupt the request flow.
  }
}

function Layout() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link className="flex items-center gap-2 text-base font-bold tracking-tight" to="/">
            <span className="flex size-8 items-center justify-center rounded-xl bg-coral text-white">
              <Sparkles className="size-4" />
            </span>
            TourMatch
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
            <NavLink to="/">안내</NavLink>
            <NavLink to="/agency/request">매칭 요청</NavLink>
            <NavLink to="/guide/register">가이드 등록</NavLink>
            <NavLink to="/jobs">채용정보</NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>2026 TourMatch. 여행사와 검증된 가이드를 더 선명하게 연결합니다.</p>
          <Link className="w-fit font-bold text-slate-700 underline decoration-slate-400 underline-offset-4 hover:text-ink" to="/admin">
            관리자 페이지
          </Link>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link className="rounded-full px-3 py-2 transition hover:bg-muted hover:text-ink" to={to}>
      {children}
    </Link>
  );
}

function HomePage() {
  const [guides, setGuides] = useState<readonly PublicGuideProfile[]>([]);

  useEffect(() => {
    let isMounted = true;
    void getFeaturedGuides().then((result) => {
      if (isMounted) setGuides(result);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <AgencyPage />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHeader
          eyebrow="추천 가이드"
          title="조건을 판단하기 쉬운 예시 프로필"
          description="실제 운영에서는 검증된 가이드 데이터가 연결됩니다. 지금은 카드 구조와 정보 위계를 먼저 확인할 수 있습니다."
        />
        <FeaturedGuidesSection guides={guides} />
        <p className="mt-4 text-center text-xs text-muted-foreground">현재는 예시 프로필이며, 검증 데이터 연결 후 자동으로 노출됩니다.</p>
      </section>
    </div>
  );
}

function AgencyPage() {
  useEffect(() => {
    trackAgencyEvent('agency_page_view', { path: '/agency' });
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-coral">행사 운영 가이드 매칭</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              일정, 언어, 지역에 맞는 가이드 후보를 빠르게 찾으세요
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              요청을 남기면 운영팀이 조건을 검토하고 적합한 가이드 후보를 안내합니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['조건 맞춤 검토', '자격 정보 확인', '운영팀 직접 안내'].map((chip) => (
                <span className="rounded-full border border-coral/20 bg-coral-soft px-3 py-1 text-xs font-bold text-coral" key={chip}>
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className={primaryButtonClass} onClick={() => trackAgencyEvent('agency_request_start')} to="/agency/request">
                가이드 매칭 요청하기
                <ArrowRight className="size-4" />
              </Link>
              <a className={secondaryButtonClass} href="#process">
                진행 과정 보기
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard icon={Languages} title="조건 확인" body="언어, 지역, 일정 기준으로 후보 검토를 시작합니다." />
            <FeatureCard icon={ShieldCheck} title="자격 확인" body="필요한 자격과 경력 조건을 함께 확인합니다." />
            <FeatureCard className="sm:col-span-2" icon={Handshake} title="담당자 안내" body="후보 확인 후 운영팀이 직접 연락합니다." />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/60" id="process">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeader
            eyebrow="PROCESS"
            title="요청부터 안내까지 4단계"
            description="긴 설명 대신 필요한 행동만 순서대로 보여줍니다."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map(([step, title, body, Icon]) => (
              <article className="rounded-2xl border border-border bg-white p-6" key={String(step)}>
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">{step}</span>
                  <Icon className="size-5 text-coral" />
                </div>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoBlock icon={Globe2} title="필수 정보" body="언어, 지역, 날짜, 인원을 중심으로 입력합니다." />
          <InfoBlock icon={ClipboardCheck} title="자격 조건" body="자격증이 꼭 필요한지, 경험이 더 중요한지 구분합니다." />
          <InfoBlock icon={CalendarDays} title="긴급도" body="확인 희망 시점을 선택해 우선순위를 전달합니다." />
        </div>
      </section>
    </div>
  );
}

function AgencyRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<AgencyRequest>(initialRequest);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedLanguages = useMemo(
    () =>
      form.languages.includes('기타') && form.customLanguage.trim()
        ? [...form.languages.filter((language) => language !== '기타'), form.customLanguage.trim()]
        : form.languages,
    [form.customLanguage, form.languages],
  );

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = event.target;
    const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function toggleLanguage(language: string) {
    setForm((current) => ({
      ...current,
      languages: current.languages.includes(language)
        ? current.languages.filter((item) => item !== language)
        : [...current.languages, language],
    }));
  }

  function goToStep(nextStep: number) {
    setErrors({});
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goNext() {
    const nextErrors = validateStep(form, currentStep);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    goToStep(Math.min(currentStep + 1, requestSteps.length - 1));
  }

  async function submitRequest() {
    if (isSubmitting) return;

    const nextErrors = validateStep(form, 3);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    trackAgencyEvent('agency_request_submit_attempt', {
      languages: selectedLanguages,
      region: form.region,
      urgency: form.urgency,
    });
    setIsSubmitting(true);

    try {
      const documentId = await createAgencyRequest({ ...form, languages: selectedLanguages });
      const storedRequest: StoredAgencyRequest = {
        ...form,
        languages: selectedLanguages,
        id: documentId,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };
      trackAgencyEvent('agency_request_submit_success', { id: storedRequest.id });
      void navigate('/agency/complete', { state: { request: storedRequest } });
    } catch {
      trackAgencyEvent('agency_request_submit_error', { message: 'firestore_write_failed' });
      setErrors({ submit: '요청을 저장하지 못했습니다. 입력값은 유지되니 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentStep === requestSteps.length - 1) {
      void submitRequest();
      return;
    }
    goNext();
  }

  return (
    <RequestShell
      description="한 화면에 모든 정보를 몰아넣지 않고, 필요한 내용만 단계별로 확인합니다."
      eyebrow="가이드 매칭 요청"
      title="매칭 요청서 작성"
    >
      <StepIndicator currentStep={currentStep} />
      <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit}>
        {currentStep === 0 && (
          <FieldGroup title="회사 / 담당자" description="담당자가 연락드릴 수 있는 기본 정보입니다.">
            <Field error={errors.companyName} label="회사명" name="companyName" onChange={updateField} required value={form.companyName} />
            <Field error={errors.contactName} label="담당자 이름" name="contactName" onChange={updateField} required value={form.contactName} />
            <Field
              error={errors.contactPhone}
              label="연락처"
              name="contactPhone"
              onChange={updateField}
              placeholder="010-1234-5678"
              required
              value={form.contactPhone}
            />
            <Field
              error={errors.contactEmail}
              label="이메일"
              name="contactEmail"
              onChange={updateField}
              placeholder="name@example.com"
              type="email"
              value={form.contactEmail}
            />
            <SelectField
              label="선호 연락 방식"
              name="preferredContactMethod"
              onChange={updateField}
              options={['전화', '문자', '이메일', '카카오톡']}
              value={form.preferredContactMethod}
            />
            <TextareaField
              label="회사 또는 행사 소개"
              name="companyDescription"
              onChange={updateField}
              placeholder="회사나 행사를 간단히 알려주세요. 선택 입력입니다."
              value={form.companyDescription}
            />
          </FieldGroup>
        )}

        {currentStep === 1 && (
          <FieldGroup title="행사 정보" description="일정과 규모를 알면 후보 검토가 빨라집니다.">
            <Field error={errors.eventName} label="행사 또는 사업 이름" name="eventName" onChange={updateField} required value={form.eventName} />
            <SelectField error={errors.eventType} label="행사 유형" name="eventType" onChange={updateField} options={eventTypes} required value={form.eventType} />
            <Field error={errors.region} label="진행 지역" name="region" onChange={updateField} placeholder="예: 서울, 경기" required value={form.region} />
            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <Field error={errors.startDate} label="시작 날짜" name="startDate" onChange={updateField} required type="date" value={form.startDate} />
              <Field error={errors.endDate} label="종료 날짜" name="endDate" onChange={updateField} required type="date" value={form.endDate} />
            </div>
            <Field
              error={errors.participantCount}
              label="예상 참가 인원"
              min="1"
              name="participantCount"
              onChange={updateField}
              required
              type="number"
              value={form.participantCount}
            />
            <Field
              error={errors.guideCount}
              label="필요 가이드 인원"
              min="1"
              name="guideCount"
              onChange={updateField}
              required
              type="number"
              value={form.guideCount}
            />
          </FieldGroup>
        )}

        {currentStep === 2 && (
          <FieldGroup title="가이드 조건" description="꼭 필요한 조건과 선호 조건을 나누어 입력하세요.">
            <div className="md:col-span-2">
              <span className="text-sm font-bold">필요 언어 *</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {languageOptions.map((language) => (
                  <button
                    aria-pressed={form.languages.includes(language)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                      form.languages.includes(language)
                        ? 'border-coral bg-coral-soft text-coral'
                        : 'border-border bg-white text-ink hover:bg-muted'
                    }`}
                    key={language}
                    onClick={() => toggleLanguage(language)}
                    type="button"
                  >
                    {form.languages.includes(language) && <Check className="size-4" />}
                    {language}
                  </button>
                ))}
              </div>
              {form.languages.includes('기타') && (
                <input
                  className={inputClass}
                  name="customLanguage"
                  onChange={updateField}
                  placeholder="필요한 언어를 입력해 주세요."
                  value={form.customLanguage}
                />
              )}
              {errors.languages ? <ErrorText message={errors.languages} /> : null}
            </div>
            <TextareaField error={errors.taskDescription} label="주요 업무" name="taskDescription" onChange={updateField} required value={form.taskDescription} />
            <SelectField
              error={errors.certificatePriority}
              label="자격증 중요도"
              name="certificatePriority"
              onChange={updateField}
              options={certificatePriorityOptions}
              required
              value={form.certificatePriority}
            />
            <SelectField
              error={errors.sourcingExperience}
              label="기존 섭외 경험"
              name="sourcingExperience"
              onChange={updateField}
              options={sourcingExperienceOptions}
              required
              value={form.sourcingExperience}
            />
            <SelectField error={errors.urgency} label="요청 긴급도" name="urgency" onChange={updateField} options={urgencyOptions} required value={form.urgency} />
            <Field label="선호 경력" name="preferredExperience" onChange={updateField} placeholder="예: 국제 행사 3회 이상" value={form.preferredExperience} />
            <Field label="유사 행사 경험" name="similarEventExperience" onChange={updateField} value={form.similarEventExperience} />
            <SelectField
              label="차량 이동 가능 여부"
              name="drivingRequired"
              onChange={updateField}
              options={['필요', '있으면 좋음', '필요 없음', '미정']}
              value={form.drivingRequired}
            />
            <Field label="예상 예산" name="budget" onChange={updateField} placeholder="미정이어도 괜찮습니다." value={form.budget} />
            <TextareaField label="추가 요청사항" name="additionalNotes" onChange={updateField} value={form.additionalNotes} />
          </FieldGroup>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <SummarySection title="회사 정보" onEdit={() => goToStep(0)} items={[['회사명', form.companyName], ['담당자', form.contactName], ['연락처', form.contactPhone]]} />
            <SummarySection
              title="행사 정보"
              onEdit={() => goToStep(1)}
              items={[
                ['행사명', form.eventName],
                ['일정', `${form.startDate} - ${form.endDate}`],
                ['지역', form.region],
                ['인원', `${form.participantCount || '-'}명 / 가이드 ${form.guideCount || '-'}명`],
              ]}
            />
            <SummarySection
              title="가이드 조건"
              onEdit={() => goToStep(2)}
              items={[
                ['언어', selectedLanguages.join(', ')],
                ['주요 업무', form.taskDescription],
                ['긴급도', form.urgency],
                ['자격증', form.certificatePriority],
              ]}
            />
            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="font-bold">동의 및 제출</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">요청 처리와 담당자 연락을 위해 입력 정보를 사용합니다.</p>
              <ConsentField
                checked={form.privacyConsent}
                error={errors.privacyConsent}
                label="개인정보 수집 목적, 항목, 이용 안내를 확인했습니다."
                name="privacyConsent"
                onChange={updateField}
              />
              <ConsentField checked={form.contactConsent} error={errors.contactConsent} label="매칭 요청 처리를 위한 연락에 동의합니다." name="contactConsent" onChange={updateField} />
            </div>
            {errors.submit ? <ErrorText message={errors.submit} /> : null}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
          {currentStep === 0 ? (
            <Link className={secondaryButtonClass} to="/agency">
              <ArrowLeft className="size-4" />
              안내로 돌아가기
            </Link>
          ) : (
            <button className={secondaryButtonClass} onClick={() => goToStep(currentStep - 1)} type="button">
              <ArrowLeft className="size-4" />
              이전
            </button>
          )}
          <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
            {currentStep === requestSteps.length - 1 ? (isSubmitting ? '요청을 보내는 중...' : '매칭 요청 보내기') : '다음'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>
    </RequestShell>
  );
}

function AgencyCompletePage() {
  const location = useLocation();
  const request = (location.state as { request?: StoredAgencyRequest } | null)?.request;
  const completionSteps = [
    ['01', '요청 내용 확인', '행사 일정과 가이드 조건을 검토합니다.', Check],
    ['02', '가이드 탐색', '조건에 맞는 후보를 확인합니다.', Search],
    ['03', '담당자 안내', '입력하신 연락처로 결과를 안내합니다.', Send],
  ] as const;

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-coral-soft">
        <CheckCircle2 className="size-11 text-coral" />
      </div>
      <p className="mt-6 text-sm font-bold text-coral">가이드 요청 완료</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">요청이 접수되었습니다</h1>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        운영팀이 조건을 확인한 뒤 적합한 후보가 있으면 담당자에게 안내합니다.
      </p>
      {request?.id && (
        <p className="mx-auto mt-5 w-fit rounded-full bg-muted px-4 py-2 text-xs font-bold text-muted-foreground">요청 ID: {request.id}</p>
      )}

      <ol className="mt-10 grid gap-4 text-left md:grid-cols-3">
        {completionSteps.map(([number, title, description, Icon]) => (
          <li className="rounded-2xl border border-border bg-white p-6" key={number}>
            <Icon className="size-5 text-coral" />
            <p className="mt-4 text-xs font-bold text-coral">{number}</p>
            <h3 className="mt-2 font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-muted-foreground">요청 접수는 가이드 배정을 보장하지 않습니다.</p>
      <Link className={`${primaryButtonClass} mt-8 min-w-48`} to="/agency">
        확인
      </Link>
    </section>
  );
}

function FeatureCard({ body, className = '', icon: Icon, title }: { body: string; className?: string; icon: LucideIcon; title: string }) {
  return (
    <article className={`rounded-2xl border border-border bg-white p-6 ${className}`}>
      <div className="flex size-11 items-center justify-center rounded-xl bg-coral-soft">
        <Icon className="size-5 text-coral" />
      </div>
      <h2 className="mt-4 text-base font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

function InfoBlock({ body, icon: Icon, title }: { body: string; icon: LucideIcon; title: string }) {
  return (
    <article className="rounded-2xl border border-border bg-white p-6">
      <Icon className="size-6 text-coral" />
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

function SectionHeader({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-sm font-bold text-coral">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function RequestShell({ children, description, eyebrow, title }: { children: ReactNode; description: string; eyebrow: string; title: string }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-coral">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {requestSteps.map((step, index) => {
        const active = index === currentStep;
        const done = index < currentStep;
        return (
          <li className={`rounded-2xl border p-4 ${active ? 'border-coral bg-coral-soft' : 'border-border bg-white'}`} key={step.title}>
            <div className="flex items-center gap-3">
              <span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${active || done ? 'bg-coral text-white' : 'bg-muted text-muted-foreground'}`}>
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <div>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function FieldGroup({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  error,
  label,
  name,
  onChange,
  required = false,
  type = 'text',
  value,
  ...props
}: {
  error?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  value: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'onChange' | 'required' | 'type' | 'value'>) {
  return (
    <label className="block text-sm font-bold">
      {label}
      {required && <RequiredMark />}
      <input aria-invalid={Boolean(error)} className={inputClass} name={name} onChange={onChange} type={type} value={value} {...props} />
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function SelectField({
  error,
  label,
  name,
  onChange,
  options,
  required = false,
  value,
}: {
  error?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      {required && <RequiredMark />}
      <select aria-invalid={Boolean(error)} className={selectClass} name={name} onChange={onChange} value={value}>
        <option value="">선택해 주세요</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function TextareaField({
  error,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  error?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold md:col-span-2">
      {label}
      {required && <RequiredMark />}
      <textarea className={textareaClass} name={name} onChange={onChange} placeholder={placeholder} value={value} />
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function ConsentField({ checked, error, label, name, onChange }: { checked: boolean; error?: string; label: string; name: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="mt-4 flex gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm leading-6">
      <input checked={checked} className="mt-1 size-4 accent-coral" name={name} onChange={onChange} type="checkbox" />
      <span>
        {label}
        {error ? <ErrorText message={error} /> : null}
      </span>
    </label>
  );
}

function SummarySection({ items, onEdit, title }: { items: [string, string][]; onEdit: () => void; title: string }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        <button className="rounded-full border border-border px-3 py-1 text-xs font-bold hover:bg-muted" onClick={onEdit} type="button">
          수정
        </button>
      </div>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map(([label, value]) => (
          <div className="rounded-xl bg-muted/60 p-4" key={label}>
            <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{value || '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RequiredMark() {
  return <span className="text-coral"> *</span>;
}

function ErrorText({ message }: { message: string }) {
  return <p className="mt-2 text-sm font-semibold text-red-700">{message}</p>;
}

function validateStep(form: AgencyRequest, step: number) {
  const nextErrors: Record<string, string> = {};

  if (step === 0) {
    if (!form.companyName.trim()) nextErrors.companyName = '회사명을 입력해 주세요.';
    if (!form.contactName.trim()) nextErrors.contactName = '담당자 이름을 입력해 주세요.';
    if (!form.contactPhone.trim()) nextErrors.contactPhone = '연락처를 입력해 주세요.';
  }

  if (step === 1) {
    if (!form.eventName.trim()) nextErrors.eventName = '행사 이름을 입력해 주세요.';
    if (!form.eventType) nextErrors.eventType = '행사 유형을 선택해 주세요.';
    if (!form.region.trim()) nextErrors.region = '진행 지역을 입력해 주세요.';
    if (!form.startDate) nextErrors.startDate = '시작 날짜를 선택해 주세요.';
    if (!form.endDate) nextErrors.endDate = '종료 날짜를 선택해 주세요.';
    if (!form.participantCount) nextErrors.participantCount = '예상 참가 인원을 입력해 주세요.';
    if (!form.guideCount) nextErrors.guideCount = '필요 가이드 인원을 입력해 주세요.';
  }

  if (step === 2) {
    if (!form.languages.length || (form.languages.includes('기타') && !form.customLanguage.trim())) nextErrors.languages = '필요 언어를 1개 이상 선택해 주세요.';
    if (!form.taskDescription.trim()) nextErrors.taskDescription = '주요 업무를 입력해 주세요.';
    if (!form.certificatePriority) nextErrors.certificatePriority = '자격증 중요도를 선택해 주세요.';
    if (!form.sourcingExperience) nextErrors.sourcingExperience = '기존 섭외 경험을 선택해 주세요.';
    if (!form.urgency) nextErrors.urgency = '요청 긴급도를 선택해 주세요.';
  }

  if (step === 3) {
    Object.assign(nextErrors, validateStep(form, 0), validateStep(form, 1), validateStep(form, 2));
    if (!form.privacyConsent) nextErrors.privacyConsent = '개인정보 수집 안내 확인이 필요합니다.';
    if (!form.contactConsent) nextErrors.contactConsent = '연락 동의가 필요합니다.';
  }

  return nextErrors;
}

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-bold text-coral">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">주소를 다시 확인해 주세요.</p>
      <Link className={`${primaryButtonClass} mt-6`} to="/agency">
        안내로 이동
      </Link>
    </section>
  );
}

const router = createBrowserRouter([
  { path: '/admin/*', Component: AdminAuthGate },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'agency', Component: AgencyPage },
      { path: 'agency/request', Component: AgencyRequestPage },
      { path: 'agency/complete', Component: AgencyCompletePage },
      { path: 'guide/register', Component: GuideRegisterPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
