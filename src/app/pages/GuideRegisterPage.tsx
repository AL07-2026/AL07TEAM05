import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { app, db } from '../../lib/firebase';

const GUIDE_LANGUAGES = ['영어', '일본어', '중국어', '베트남어', '태국어', '스페인어', '기타'];
const REGION_OPTIONS = ['서울', '경기', '부산', '대구', '대전', '광주', '제주', '인천', '강원', '경상', '전라', '충청', '기타'];
const EXPERIENCE_OPTIONS = ['1년 미만', '1~3년', '3~5년', '5년 이상'];

const linkButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-coral-foreground transition-colors hover:bg-coral/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]';
const secondaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]';
const inputClass =
  'min-h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20';

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
    <div className="space-y-2">
      <p className="text-sm font-semibold">
        {label} <RequiredStar />
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-coral bg-coral-soft text-coral'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {allowCustom && isCustomActive && (
        <input
          className={inputClass}
          placeholder="기타 언어를 직접 입력"
          value={customValue || ''}
          onChange={(event) => onCustomChange?.(event.target.value)}
        />
      )}
    </div>
  );
}

function CollapsibleRegionField({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleOptions = expanded ? REGION_OPTIONS : REGION_OPTIONS.slice(0, 7);
  const hiddenCount = REGION_OPTIONS.length - visibleOptions.length;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">
        활동 지역 <RequiredStar />
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-coral bg-coral-soft text-coral'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {option}
            </button>
          );
        })}
        {!expanded && hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            더보기
          </button>
        ) : null}
        {expanded && hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            접기
          </button>
        ) : null}
      </div>
    </div>
  );
}

function validate(form: typeof initialForm) {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = '이름을 입력해 주세요.';
  if (!form.phone.trim()) errors.phone = '연락처를 입력해 주세요.';
  if (!form.guideLanguages.length && !form.customLanguage.trim()) errors.guideLanguages = '활동 언어를 1개 이상 선택해 주세요.';
  if (!form.regions.length) errors.regions = '활동 지역을 1개 이상 선택해 주세요.';
  if (!form.experience) errors.experience = '가이드 경력을 선택해 주세요.';
  if (!form.certificateLanguage.trim()) errors.certificateLanguage = '자격 언어를 입력해 주세요.';
  if (!form.certificateNumber.trim()) errors.certificateNumber = '자격증 번호를 입력해 주세요.';
  if (!form.privacyConsent) errors.privacyConsent = '개인정보 수집 동의가 필요합니다.';
  return errors;
}

async function resolveUid() {
  const authInstance = getAuth(app);
  let user = authInstance.currentUser;
  if (!user) {
    const credential = await signInAnonymously(authInstance);
    user = credential.user;
  }
  return user.uid;
}

export default function GuideRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const toggle = (field: 'guideLanguages' | 'regions', value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const uid = await resolveUid();

      const profileData = {
        ownerUid: uid,
        name: form.name.trim(),
        languages: form.guideLanguages.length > 0 ? form.guideLanguages : [form.customLanguage.trim()].filter(Boolean),
        regions: form.regions,
        experienceRange: form.experience,
        introduction: form.introduction.trim(),
        profilePhotoUrl: null,
        profileStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const registrationData = {
        ownerUid: uid,
        phone: form.phone.trim(),
        certificateLanguage: form.certificateLanguage.trim(),
        certificateNumber: form.certificateNumber.trim(),
        certificateFilePath: null,
        resumeFilePath: null,
        privacyConsent: form.privacyConsent,
        verificationStatus: 'pending',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const profileRef = doc(db, 'guideProfiles', uid);
      const registrationRef = doc(db, 'guideRegistrations', uid);

      await Promise.all([setDoc(profileRef, profileData), setDoc(registrationRef, registrationData)]);
      setSubmitted(true);
    } catch {
      setSubmitError('등록 중 문제가 발생했습니다. 입력한 내용은 유지되어 있어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-coral-soft text-coral">
            <Check className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">가이드 등록이 완료됐어요</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            기본 정보를 먼저 등록할 수 있어요. 추가 자료 제출 기능은 추후 제공될 예정입니다.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className={linkButtonClass} to="/">
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
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-coral">가이드 모집</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">가이드로 등록하기</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          기본 정보를 먼저 등록할 수 있어요. 추가 자료 제출 기능은 추후 제공될 예정입니다.
        </p>
      </div>

      <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              이름 <RequiredStar />
              <input
                className={inputClass}
                name="name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                value={form.name}
              />
              {errors.name ? <p className="mt-2 text-sm font-medium text-red-700">{errors.name}</p> : null}
            </label>
            <label className="block text-sm font-semibold">
              연락처 <RequiredStar />
              <input
                className={inputClass}
                name="phone"
                placeholder="010-0000-0000"
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                value={form.phone}
              />
              {errors.phone ? <p className="mt-2 text-sm font-medium text-red-700">{errors.phone}</p> : null}
            </label>
          </div>

          <div className="mt-4 space-y-4">
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
            {errors.guideLanguages ? <p className="text-sm font-medium text-red-700">{errors.guideLanguages}</p> : null}

            <CollapsibleRegionField selected={form.regions} onToggle={(value) => toggle('regions', value)} />
            {errors.regions ? <p className="text-sm font-medium text-red-700">{errors.regions}</p> : null}

            <label className="block text-sm font-semibold md:col-span-2">
              가이드 경력 <RequiredStar />
              <select
                className={inputClass}
                name="experience"
                onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))}
                value={form.experience}
              >
                <option value="">선택해 주세요</option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.experience ? <p className="mt-2 text-sm font-medium text-red-700">{errors.experience}</p> : null}
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              관광통역안내사 자격 언어 <RequiredStar />
              <input
                className={inputClass}
                name="certificateLanguage"
                onChange={(event) => setForm((current) => ({ ...current, certificateLanguage: event.target.value }))}
                value={form.certificateLanguage}
              />
              {errors.certificateLanguage ? <p className="mt-2 text-sm font-medium text-red-700">{errors.certificateLanguage}</p> : null}
            </label>
            <label className="block text-sm font-semibold">
              자격증 번호 <RequiredStar />
              <input
                className={inputClass}
                name="certificateNumber"
                onChange={(event) => setForm((current) => ({ ...current, certificateNumber: event.target.value }))}
                value={form.certificateNumber}
              />
              {errors.certificateNumber ? <p className="mt-2 text-sm font-medium text-red-700">{errors.certificateNumber}</p> : null}
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            무료 MVP 단계에서는 자격증 파일 업로드를 지원하지 않습니다. 추후 업로드 기능이 제공될 예정입니다.
          </p>
        </div>

        <section className="space-y-3">
          <label className="flex gap-3 text-sm leading-6">
            <input
              checked={form.privacyConsent}
              className="mt-1 size-4 accent-coral"
              name="privacyConsent"
              onChange={(event) => setForm((current) => ({ ...current, privacyConsent: event.target.checked }))}
              type="checkbox"
            />
            <span>
              개인정보 수집에 동의합니다. <RequiredStar />
              {errors.privacyConsent ? <span className="block text-sm font-medium text-red-700">{errors.privacyConsent}</span> : null}
            </span>
          </label>
        </section>

        {submitError ? <p className="text-sm font-medium text-red-700">{submitError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className={secondaryButtonClass} to="/">
            <ArrowLeft className="size-4" />
            홈으로
          </Link>
          <button className={linkButtonClass} disabled={submitting} type="submit">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {submitting ? '등록 중...' : '가이드 등록하기'}
          </button>
        </div>
      </form>
    </section>
  );
}
