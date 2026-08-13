import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Check, CheckCircle2, Info, Loader2, Sparkles } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

import { guideRegistrationAuth, guideRegistrationDb } from '../../lib/firebase';

const GUIDE_LANGUAGES = ['영어', '일본어', '중국어', '베트남어', '태국어', '스페인어', '기타'];
const REGION_OPTIONS = ['서울', '경기', '부산', '대구', '대전', '광주', '제주', '인천', '강원', '경상', '전라', '충청', '기타'];
const EXPERIENCE_OPTIONS = ['1년 미만', '1~3년', '3~5년', '5년 이상'];

const primaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-coral-foreground transition hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const inputClass =
  'mt-2 min-h-12 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20';

const initialForm = {
  name: '',
  phone: '',
  guideLanguages: [] as string[],
  customLanguage: '',
  regions: [] as string[],
  experience: '',
  certificateLanguage: '',
  certificateNumber: '',
  introduction: '',
  privacyConsent: false,
};

function RequiredStar() {
  return <span className="text-coral">*</span>;
}

function ErrorText({ message }: { message: string }) {
  return <p className="mt-2 text-sm font-semibold text-red-700">{message}</p>;
}

function SectionCard({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ChipField({
  label,
  options,
  selected,
  onToggle,
  allowCustom,
  customValue,
  onCustomChange,
  isCustomActive,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  isCustomActive?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-bold">
        {label} <RequiredStar />
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              aria-pressed={active}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition ${
                active ? 'border-coral bg-coral-soft text-coral' : 'border-border bg-white text-muted-foreground hover:bg-muted'
              }`}
              key={option}
              onClick={() => onToggle(option)}
              type="button"
            >
              {active && <Check className="size-3.5" />}
              {option}
            </button>
          );
        })}
      </div>
      {allowCustom && isCustomActive && (
        <input className={inputClass} placeholder="기타 언어를 직접 입력" value={customValue || ''} onChange={(event) => onCustomChange?.(event.target.value)} />
      )}
    </div>
  );
}

function CollapsibleRegionField({ selected, onToggle }: { selected: string[]; onToggle: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = expanded ? REGION_OPTIONS : REGION_OPTIONS.slice(0, 8);
  const hiddenCount = REGION_OPTIONS.length - visibleOptions.length;

  return (
    <div>
      <p className="text-sm font-bold">
        활동 지역 <RequiredStar />
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              aria-pressed={active}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition ${
                active ? 'border-coral bg-coral-soft text-coral' : 'border-border bg-white text-muted-foreground hover:bg-muted'
              }`}
              key={option}
              onClick={() => onToggle(option)}
              type="button"
            >
              {active && <Check className="size-3.5" />}
              {option}
            </button>
          );
        })}
        {hiddenCount > 0 && (
          <button className="rounded-full border border-border bg-white px-3 text-xs font-bold text-muted-foreground hover:bg-muted" onClick={() => setExpanded(true)} type="button">
            +{hiddenCount}개 더 보기
          </button>
        )}
      </div>
    </div>
  );
}

function validate(form: typeof initialForm) {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = '이름을 입력해 주세요.';
  if (!form.phone.trim()) errors.phone = '연락처를 입력해 주세요.';
  if (!form.guideLanguages.length && !form.customLanguage.trim()) errors.guideLanguages = '활동 언어를 1개 이상 선택해 주세요.';
  if (form.guideLanguages.includes('기타') && !form.customLanguage.trim()) errors.guideLanguages = '기타 언어를 입력해 주세요.';
  if (!form.regions.length) errors.regions = '활동 지역을 1개 이상 선택해 주세요.';
  if (!form.experience) errors.experience = '가이드 경력을 선택해 주세요.';
  if (!form.certificateLanguage.trim()) errors.certificateLanguage = '자격 언어를 입력해 주세요.';
  if (!form.certificateNumber.trim()) errors.certificateNumber = '자격증 번호를 입력해 주세요.';
  if (!form.privacyConsent) errors.privacyConsent = '개인정보 수집 동의가 필요합니다.';
  return errors;
}

async function resolveUid() {
  let user = guideRegistrationAuth.currentUser;
  if (!user) {
    const credential = await signInAnonymously(guideRegistrationAuth);
    user = credential.user;
  }
  return user.uid;
}

export default function GuideRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggle = (field: 'guideLanguages' | 'regions', value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const uid = await resolveUid();
      const registrationRef = doc(guideRegistrationDb, 'guideRegistrations', uid);
      const registrationSnap = await getDoc(registrationRef);
      if (registrationSnap.exists()) {
        setSubmitError('이미 등록된 가이드 신청이 있습니다.');
        return;
      }

      const payload = {
        ownerUid: uid,
        name: form.name.trim(),
        phone: form.phone.trim(),
        languages: form.guideLanguages.length > 0 ? form.guideLanguages.filter((language) => language !== '기타') : [form.customLanguage.trim()].filter(Boolean),
        customLanguage: form.customLanguage.trim(),
        regions: form.regions,
        experienceRange: form.experience,
        certificateLanguage: form.certificateLanguage.trim(),
        certificateNumber: form.certificateNumber.trim(),
        introduction: form.introduction.trim(),
        profileStatus: 'pending',
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(doc(guideRegistrationDb, 'guideProfiles', uid), payload, { merge: true }),
        setDoc(registrationRef, payload, { merge: true }),
      ]);
      setSubmitted(true);
    } catch (error) {
      console.error('[guide-register] submit failed', error);
      setSubmitError('등록 중 문제가 발생했습니다. 입력 내용은 유지되니 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-coral-soft text-coral">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">가이드 등록이 완료되었습니다</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">운영팀 검토 후 적합한 요청이 있을 때 안내드릴 수 있습니다.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className={primaryButtonClass} to="/">
              홈으로 이동
            </Link>
            <button className={secondaryButtonClass} type="button" onClick={() => navigate(-1)}>
              이전으로
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <p className="text-sm font-bold text-coral">가이드 등록</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            가이드로 등록하고
            <br />새로운 일정 기회를 확인하세요
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">기본 정보를 등록하면 운영팀이 검토 후 적합한 요청이 있을 때 안내할 수 있습니다.</p>
          <div className="mt-6 grid gap-3 text-sm">
            {['활동 언어 등록', '활동 지역 설정', '자격 정보 제출'].map((item) => (
              <span className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 font-semibold" key={item}>
                <Check className="size-4 text-coral" />
                {item}
              </span>
            ))}
          </div>
        </aside>

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <SectionCard title="기본 정보" description="연락 가능한 정보만 간단히 입력합니다.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold">
                이름 <RequiredStar />
                <input className={inputClass} name="name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
                {errors.name ? <ErrorText message={errors.name} /> : null}
              </label>
              <label className="block text-sm font-bold">
                연락처 <RequiredStar />
                <input
                  className={inputClass}
                  name="phone"
                  placeholder="010-0000-0000"
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  value={form.phone}
                />
                {errors.phone ? <ErrorText message={errors.phone} /> : null}
              </label>
            </div>
          </SectionCard>

          <SectionCard title="활동 정보" description="선택한 언어와 지역은 후보 검토 기준으로 사용됩니다.">
            <div className="space-y-5">
              <ChipField
                label="활동 언어"
                options={GUIDE_LANGUAGES}
                selected={form.guideLanguages}
                onToggle={(value) => toggle('guideLanguages', value)}
                allowCustom
                customValue={form.customLanguage}
                onCustomChange={(value) => setForm((current) => ({ ...current, customLanguage: value }))}
                isCustomActive={form.guideLanguages.includes('기타')}
              />
              {errors.guideLanguages ? <ErrorText message={errors.guideLanguages} /> : null}
              <CollapsibleRegionField selected={form.regions} onToggle={(value) => toggle('regions', value)} />
              {errors.regions ? <ErrorText message={errors.regions} /> : null}
              <label className="block text-sm font-bold">
                가이드 경력 <RequiredStar />
                <select className={inputClass} name="experience" onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))} value={form.experience}>
                  <option value="">선택해 주세요</option>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.experience ? <ErrorText message={errors.experience} /> : null}
              </label>
            </div>
          </SectionCard>

          <SectionCard title="자격 정보" description="현재는 번호만 등록하며, 파일 업로드는 추후 지원합니다.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold">
                관광통역안내사 자격 언어 <RequiredStar />
                <input className={inputClass} name="certificateLanguage" onChange={(event) => setForm((current) => ({ ...current, certificateLanguage: event.target.value }))} value={form.certificateLanguage} />
                {errors.certificateLanguage ? <ErrorText message={errors.certificateLanguage} /> : null}
              </label>
              <label className="block text-sm font-bold">
                자격증 번호 <RequiredStar />
                <input className={inputClass} name="certificateNumber" onChange={(event) => setForm((current) => ({ ...current, certificateNumber: event.target.value }))} value={form.certificateNumber} />
                {errors.certificateNumber ? <ErrorText message={errors.certificateNumber} /> : null}
              </label>
            </div>
            <div className="mt-4 flex gap-3 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-coral" />
              <p>현재는 자격증 번호만 등록할 수 있습니다. 파일 업로드 기능은 이후 제공됩니다.</p>
            </div>
          </SectionCard>

          <SectionCard title="동의 및 제출" description="등록 정보 검토와 연락을 위한 동의가 필요합니다.">
            <label className="flex gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm leading-6">
              <input
                checked={form.privacyConsent}
                className="mt-1 size-4 accent-coral"
                name="privacyConsent"
                onChange={(event) => setForm((current) => ({ ...current, privacyConsent: event.target.checked }))}
                type="checkbox"
              />
              <span>
                개인정보 수집에 동의합니다. <RequiredStar />
                {errors.privacyConsent ? <ErrorText message={errors.privacyConsent} /> : null}
              </span>
            </label>
          </SectionCard>

          {submitError ? <ErrorText message={submitError} /> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link className={secondaryButtonClass} to="/">
              <ArrowLeft className="size-4" />
              홈으로
            </Link>
            <button className={primaryButtonClass} disabled={submitting} type="submit">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {submitting ? '등록 중...' : '가이드 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
