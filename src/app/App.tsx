import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
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
import {
  Link,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useNavigate,
} from 'react-router';

type AgencyRequest = {
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
  '외국인 단체 관광',
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
  '있으면 좋지만 경력이 더 중요',
  '자격증보다 추천과 실제 경험이 중요',
  '잘 모르겠음',
];

const sourcingExperienceOptions = [
  '해당 언어 또는 지역의 가이드를 처음 섭외함',
  '이전에 섭외했지만 현재 연락 가능한 사람이 없음',
  '기존 가이드가 있지만 추가 인력이 필요함',
  '기존 가이드의 대체 인력이 필요함',
];

const urgencyOptions = ['오늘 안에 확인 필요', '3일 이내', '일주일 이내', '일정 협의 가능'];

const linkButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-coral-foreground transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const secondaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const inputClass =
  'mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20';

const selectClass = `${inputClass} appearance-none`;

const textareaClass =
  'mt-2 min-h-28 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20';

function trackAgencyEvent(eventName: AgencyEventName, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

function Layout() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="text-lg font-semibold tracking-tight" to="/agency">
            TourMatch
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link className="hover:text-ink" to="/agency">
              안내
            </Link>
            <Link className="hover:text-ink" to="/agency/request">
              매칭 요청
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  return <AgencyPage />;
}

function AgencyPage() {
  useEffect(() => {
    trackAgencyEvent('agency_page_view', { path: '/agency' });
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-coral">행사 운영 가이드 매칭</p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              일정, 언어, 지역 조건에 맞는 가이드 후보를 확인해 드립니다
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              행사나 여행 운영 업체가 필요한 조건을 제출하면 담당자가 요청 내용을 검토하고,
              적합한 가이드 후보 확인 후 연락드리는 초기 매칭 서비스입니다.
            </p>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              자격증 제출 여부와 경력 정보는 확인 대상이며, 제출 즉시 매칭이 확정된다고 안내하지
              않습니다.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className={linkButtonClass}
                onClick={() => trackAgencyEvent('agency_request_start')}
                to="/agency/request"
              >
                가이드 매칭 요청하기
                <ArrowRight className="size-4" />
              </Link>
              <a className={secondaryButtonClass} href="#process">
                진행 과정 보기
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={Languages}
              title="언어와 일정 조건 확인"
              body="필요 언어, 활동 지역, 행사 기간, 필요 인원을 함께 검토합니다."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="자격증과 경력 확인"
              body="관광통역안내사 자격증 제출 필요 여부와 유사 행사 경험을 구분해 확인합니다."
            />
            <FeatureCard
              className="sm:col-span-2"
              icon={Handshake}
              title="담당자 검토 후 연락"
              body="요청 내용을 확인한 뒤 조건에 맞는 후보가 확인되면 별도로 안내드립니다."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted" id="process">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">진행 과정</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              요청서 작성부터 담당자 연락까지 필요한 정보를 단계별로 확인합니다.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['1', '요청서 작성', '회사, 행사, 가이드 조건을 입력합니다.'],
              ['2', '조건 확인', '필수 입력값과 일정, 연락처 형식을 확인합니다.'],
              ['3', '후보 탐색', '담당자가 조건에 맞는 가이드 후보를 확인합니다.'],
              ['4', '담당자 연락', '확인된 내용과 후속 안내를 연락드립니다.'],
            ].map(([step, title, body]) => (
              <div className="rounded-2xl border border-border bg-card p-5" key={step}>
                <div className="flex size-9 items-center justify-center rounded-full bg-coral text-sm font-semibold text-coral-foreground">
                  {step}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <InfoBlock
            icon={Globe2}
            title="필요 정보"
            body="언어, 지역, 날짜, 인원, 주요 업무를 함께 입력해야 후보 검토가 가능합니다."
          />
          <InfoBlock
            icon={ClipboardCheck}
            title="자격 확인"
            body="자격증이 필수인지, 실무 경험이 더 중요한지 선택해 검토 기준을 명확히 합니다."
          />
          <InfoBlock
            icon={CalendarDays}
            title="긴급도"
            body="오늘 확인, 3일 이내, 일주일 이내 등 연락 우선순위를 함께 전달합니다."
          />
        </div>
      </section>
    </div>
  );
}

function AgencyRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<AgencyRequest>(initialRequest);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedLanguages = useMemo(
    () =>
      form.languages.includes('기타') && form.customLanguage.trim()
        ? [...form.languages.filter((language) => language !== '기타'), form.customLanguage.trim()]
        : form.languages,
    [form.customLanguage, form.languages],
  );

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
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

  function goToConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateConsent(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submitRequest();
  }

  function submitRequest() {
    const nextErrors = validateConsent(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStep('input');
      return;
    }

    trackAgencyEvent('agency_request_submit_attempt', {
      languages: selectedLanguages,
      region: form.region,
      urgency: form.urgency,
    });
    setIsSubmitting(true);

    try {
      const storedRequest: StoredAgencyRequest = {
        ...form,
        languages: selectedLanguages,
        id: `agency-${Date.now()}`,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('latestAgencyRequest', JSON.stringify(storedRequest));
      trackAgencyEvent('agency_request_submit_success', {
        id: storedRequest.id,
        urgency: storedRequest.urgency,
      });
      void navigate('/agency/complete', { state: { request: storedRequest } });
    } catch (error) {
      trackAgencyEvent('agency_request_submit_error', { message: String(error) });
      setErrors({ submit: '요청 내용을 임시 저장하지 못했습니다. 입력값을 유지한 상태로 다시 시도해 주세요.' });
      setStep('input');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === 'confirm') {
    return (
      <RequestShell
        description="제출 전 요청 내용을 확인해 주세요."
        eyebrow="가이드 매칭 요청"
        title="요청 내용 확인"
      >
        <div className="space-y-6">
          <SummaryGrid
            items={[
              ['회사명', form.companyName],
              ['담당자', form.contactName],
              ['연락처', form.contactPhone],
              ['필요 언어', selectedLanguages.join(', ')],
              ['행사 지역', form.region],
              ['행사 기간', `${form.startDate} ~ ${form.endDate}`],
              ['필요 가이드 인원', `${form.guideCount}명`],
              ['자격증 중요도', form.certificatePriority],
              ['기존 섭외 경험', form.sourcingExperience],
              ['긴급도', form.urgency],
            ]}
          />
          <div className="rounded-2xl border border-border bg-muted p-5">
            <h2 className="font-semibold">주요 업무</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{form.taskDescription}</p>
          </div>
          {errors.submit ? <ErrorText message={errors.submit} /> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className={secondaryButtonClass} onClick={() => setStep('input')} type="button">
              <ArrowLeft className="size-4" />
              이전 단계로 돌아가기
            </button>
            <button
              className={`${linkButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={isSubmitting}
              onClick={submitRequest}
              type="button"
            >
              가이드 요청하기
            </button>
          </div>
        </div>
      </RequestShell>
    );
  }

  return (
    <RequestShell
      description="담당자가 조건을 확인할 수 있도록 필수 정보를 입력해 주세요."
      eyebrow="가이드 매칭 요청"
      title="필요한 가이드 조건 입력"
    >
      <form className="space-y-10" noValidate onSubmit={goToConfirm}>
        <FieldGroup title="회사 및 담당자 정보">
          <Field
            error={errors.companyName}
            label="회사명"
            name="companyName"
            onChange={updateField}
            required
            value={form.companyName}
          />
          <Field
            error={errors.contactName}
            label="담당자 이름"
            name="contactName"
            onChange={updateField}
            required
            value={form.contactName}
          />
          <Field
            error={errors.contactPhone}
            label="담당자 연락처"
            name="contactPhone"
            onChange={updateField}
            placeholder="010-1234-5678"
            required
            value={form.contactPhone}
          />
          <Field
            error={errors.contactEmail}
            label="담당자 이메일"
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
            value={form.companyDescription}
          />
        </FieldGroup>

        <FieldGroup title="행사 정보">
          <Field
            error={errors.eventName}
            label="행사 또는 사업 이름"
            name="eventName"
            onChange={updateField}
            required
            value={form.eventName}
          />
          <SelectField
            error={errors.eventType}
            label="행사 유형"
            name="eventType"
            onChange={updateField}
            options={eventTypes}
            required
            value={form.eventType}
          />
          <Field
            error={errors.region}
            label="진행 지역"
            name="region"
            onChange={updateField}
            placeholder="예: 서울, 경기"
            required
            value={form.region}
          />
          <Field
            error={errors.startDate}
            label="시작 날짜"
            name="startDate"
            onChange={updateField}
            required
            type="date"
            value={form.startDate}
          />
          <Field
            error={errors.endDate}
            label="종료 날짜"
            name="endDate"
            onChange={updateField}
            required
            type="date"
            value={form.endDate}
          />
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
            label="필요한 가이드 인원"
            min="1"
            name="guideCount"
            onChange={updateField}
            required
            type="number"
            value={form.guideCount}
          />
        </FieldGroup>

        <FieldGroup title="필요한 가이드 조건">
          <div className="md:col-span-2">
            <span className="text-sm font-semibold">필요한 언어 *</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {languageOptions.map((language) => (
                <label
                  className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium ${
                    form.languages.includes(language)
                      ? 'border-coral bg-coral-soft text-coral'
                      : 'border-border bg-background text-ink'
                  }`}
                  key={language}
                >
                  <input
                    checked={form.languages.includes(language)}
                    className="sr-only"
                    onChange={() => toggleLanguage(language)}
                    type="checkbox"
                  />
                  {language}
                </label>
              ))}
            </div>
            {form.languages.includes('기타') ? (
              <input
                className={inputClass}
                name="customLanguage"
                onChange={updateField}
                placeholder="필요한 언어를 입력해 주세요"
                value={form.customLanguage}
              />
            ) : null}
            {errors.languages ? <ErrorText message={errors.languages} /> : null}
          </div>
          <TextareaField
            error={errors.taskDescription}
            label="주요 업무"
            name="taskDescription"
            onChange={updateField}
            required
            value={form.taskDescription}
          />
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
          <SelectField
            error={errors.urgency}
            label="요청 긴급도"
            name="urgency"
            onChange={updateField}
            options={urgencyOptions}
            required
            value={form.urgency}
          />
          <Field
            label="선호 경력"
            name="preferredExperience"
            onChange={updateField}
            placeholder="예: 국제 행사 3년 이상"
            value={form.preferredExperience}
          />
          <Field
            label="유사 행사 경험"
            name="similarEventExperience"
            onChange={updateField}
            value={form.similarEventExperience}
          />
          <SelectField
            label="차량 운전 가능 여부"
            name="drivingRequired"
            onChange={updateField}
            options={['필요', '있으면 좋음', '필요 없음', '미정']}
            value={form.drivingRequired}
          />
          <Field
            label="예상 예산 또는 지급 금액"
            name="budget"
            onChange={updateField}
            value={form.budget}
          />
          <TextareaField
            label="추가 요청사항"
            name="additionalNotes"
            onChange={updateField}
            value={form.additionalNotes}
          />
        </FieldGroup>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">개인정보 및 연락 동의</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            매칭 요청 처리와 담당자 연락을 위해 회사명, 담당자 이름, 연락처, 이메일, 요청 내용을
            수집합니다. 현재 MVP에서는 요청 내용을 브라우저 localStorage에 임시 저장합니다.
          </p>
          <ConsentField
            checked={form.privacyConsent}
            error={errors.privacyConsent}
            label="개인정보 수집 목적, 항목, 이용 안내를 확인했습니다."
            name="privacyConsent"
            onChange={updateField}
          />
          <ConsentField
            checked={form.contactConsent}
            error={errors.contactConsent}
            label="매칭 요청 처리를 위한 연락에 동의합니다."
            name="contactConsent"
            onChange={updateField}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className={secondaryButtonClass} to="/agency">
            <ArrowLeft className="size-4" />
            안내로 돌아가기
          </Link>
          <button className={linkButtonClass} type="submit">
            요청 내용 확인
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>
    </RequestShell>
  );
}

function AgencyCompletePage() {
  const completionSteps = [
    ['01', '요청 내용 확인', '입력해 주신 여행 일정과 가이드 조건을 꼼꼼히 확인합니다.', Check],
    ['02', '가이드 검토', 'TourMatch가 요청 조건에 맞는 가이드를 확인합니다.', Search],
    ['03', '여행사로 안내', '적합한 가이드가 있을 경우 입력해 주신 연락처로 안내드립니다.', Send],
  ] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="mx-auto flex size-28 items-center justify-center rounded-full bg-coral-soft">
          <div className="flex size-20 items-center justify-center rounded-full border border-coral/20">
            <CheckCircle2 className="size-14 text-coral" strokeWidth={1.8} />
          </div>
        </div>
        <p className="mt-8 text-sm font-bold tracking-wide text-coral">가이드 요청 완료</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          가이드 요청이 접수되었습니다
        </h1>
        <p className="mt-6 text-lg font-semibold">TourMatch에 요청해 주셔서 감사합니다.</p>

        <div className="mx-auto mt-10 flex max-w-3xl items-center gap-4 rounded-2xl border border-coral/20 bg-coral-soft p-5 text-left sm:p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-coral text-white">
            <Check className="size-6" strokeWidth={2.6} />
          </span>
          <p className="font-semibold leading-7">
            요청하신 조건에 적합한 가이드가 확인되면,
            <br className="hidden sm:block" /> 작성해 주신 여행사 연락처로 안내드리겠습니다.
          </p>
        </div>

        <div className="mt-14 text-left">
          <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground">NEXT STEP</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">접수 이후에는 이렇게 진행됩니다</h2>
          <ol className="mt-7 grid gap-4 md:grid-cols-3">
            {completionSteps.map(([number, title, description, Icon]) => (
              <li className="rounded-2xl border border-border bg-card p-6 shadow-sm" key={number}>
                <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-coral">
                  <Icon className="size-5" />
                </span>
                <p className="mt-6 text-xs font-bold text-coral">{number}</p>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          ※ 요청 접수는 가이드 배정을 보장하지 않습니다.
        </p>
        <Link className={`${linkButtonClass} mt-8 min-w-52`} to="/agency">
          <Sparkles className="size-4" />
          확인
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  body,
  className = '',
  icon: Icon,
  title,
}: {
  body: string;
  className?: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}>
      <div className="flex size-12 items-center justify-center rounded-xl bg-coral-soft">
        <Icon className="size-6 text-coral" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function InfoBlock({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <Icon className="size-6 text-coral" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function RequestShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="mb-8 space-y-3">
        <p className="text-sm font-semibold text-coral">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function FieldGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
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
    <label className="block text-sm font-semibold">
      {label}
      {required ? ' *' : ''}
      <input
        aria-invalid={Boolean(error)}
        className={inputClass}
        name={name}
        onChange={onChange}
        type={type}
        value={value}
        {...props}
      />
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
    <label className="block text-sm font-semibold">
      {label}
      {required ? ' *' : ''}
      <select
        aria-invalid={Boolean(error)}
        className={selectClass}
        name={name}
        onChange={onChange}
        value={value}
      >
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
  required = false,
  value,
}: {
  error?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold md:col-span-2">
      {label}
      {required ? ' *' : ''}
      <textarea className={textareaClass} name={name} onChange={onChange} value={value} />
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function ConsentField({
  checked,
  error,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  error?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="mt-4 flex gap-3 text-sm leading-6">
      <input
        checked={checked}
        className="mt-1 size-4 accent-coral"
        name={name}
        onChange={onChange}
        type="checkbox"
      />
      <span>
        {label}
        {error ? <ErrorText message={error} /> : null}
      </span>
    </label>
  );
}

function SummaryGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="rounded-2xl border border-border bg-card p-4" key={label}>
          <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{value || '-'}</dd>
        </div>
      ))}
    </dl>
  );
}

function ErrorText({ message }: { message: string }) {
  return <p className="mt-2 text-sm font-medium text-red-700">{message}</p>;
}

function validateConsent(form: AgencyRequest) {
  const nextErrors: Record<string, string> = {};
  if (!form.privacyConsent) {
    nextErrors.privacyConsent = '개인정보 수집 안내 확인이 필요합니다.';
  }
  if (!form.contactConsent) {
    nextErrors.contactConsent = '연락 동의가 필요합니다.';
  }

  return nextErrors;
}

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-medium text-coral">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        주소가 잘못 입력되었거나 페이지가 삭제되었을 수 있습니다.
      </p>
      <Link className={`${linkButtonClass} mt-6`} to="/agency">
        안내로 이동
      </Link>
    </section>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'agency', Component: AgencyPage },
      { path: 'agency/request', Component: AgencyRequestPage },
      { path: 'agency/complete', Component: AgencyCompletePage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
