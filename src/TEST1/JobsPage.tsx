import { BriefcaseBusiness, ExternalLink, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { getJobPostings, type JobPosting } from './job-service';

const PAGE_SIZE = 12;

export function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [query, setQuery] = useState('');
  const [employmentType, setEmploymentType] = useState('전체');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getJobPostings()
      .then((result) => {
        if (!active) return;
        setJobs(result);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const employmentTypes = useMemo(
    () => ['전체', ...new Set(jobs.map((job) => job.employmentType).filter((value): value is string => Boolean(value)))],
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    return jobs.filter((job) => {
      const haystack = [job.title, job.company, job.category, job.matchedKeyword]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('ko-KR');
      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (employmentType === '전체' || job.employmentType === employmentType)
      );
    });
  }, [employmentType, jobs, query]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const visibleJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changeEmploymentType(value: string) {
    setEmploymentType(value);
    setPage(1);
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/50">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-coral">TOURISM CAREERS</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              관광·통역·여행 채용정보
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              여러 채용처의 관광 분야 공고를 한곳에서 검색하고 원문을 확인하세요.
            </p>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-[1fr_220px]">
            <label className="relative block">
              <span className="sr-only">공고 검색</span>
              <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                className="min-h-12 w-full rounded-xl border border-input bg-background pr-4 pl-12 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="직무, 회사명, 키워드 검색"
                value={query}
              />
            </label>
            <label className="relative block">
              <span className="sr-only">고용 형태</span>
              <SlidersHorizontal className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="min-h-12 w-full appearance-none rounded-xl border border-input bg-background pr-4 pl-11 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                onChange={(event) => changeEmploymentType(event.target.value)}
                value={employmentType}
              >
                {employmentTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {status === 'loading' ? <StatusCard>Firestore에서 공고를 불러오는 중입니다.</StatusCard> : null}
        {status === 'error' ? (
          <StatusCard>
            <strong className="block text-ink">채용정보를 불러오지 못했습니다.</strong>
            <span className="mt-2 block">Firestore 보안 규칙과 `jobs` 컬렉션을 확인해 주세요.</span>
            <code className="mt-3 block break-all text-xs text-red-700">{errorMessage}</code>
          </StatusCard>
        ) : null}
        {status === 'ready' ? (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">검색 결과</p>
                <p className="mt-1 text-2xl font-semibold">{filteredJobs.length}건</p>
              </div>
              <p className="text-xs text-muted-foreground">지원 전 원문에서 최신 정보를 확인하세요.</p>
            </div>

            {visibleJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleJobs.map((job) => <JobCard job={job} key={job.id} />)}
              </div>
            ) : (
              <StatusCard>조건에 맞는 채용공고가 없습니다.</StatusCard>
            )}

            {pageCount > 1 ? (
              <nav aria-label="채용공고 페이지" className="mt-8 flex justify-center gap-2">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                  <button
                    aria-current={page === number ? 'page' : undefined}
                    className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${
                      page === number ? 'bg-coral text-white' : 'border border-border bg-background hover:bg-muted'
                    }`}
                    key={number}
                    onClick={() => setPage(number)}
                    type="button"
                  >
                    {number}
                  </button>
                ))}
              </nav>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

function JobCard({ job }: { job: JobPosting }) {
  return (
    <article className="flex min-h-72 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral">
          {job.employmentType ?? '고용형태 확인'}
        </span>
        <BriefcaseBusiness className="size-5 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold leading-7">{job.title}</h2>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{job.company}</p>
      <div className="mt-5 space-y-2 text-sm text-muted-foreground">
        <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{job.category ?? '관광 분야'}</p>
        <p>{[job.career, job.education].filter(Boolean).join(' · ') || '지원 자격 원문 확인'}</p>
        <p>{job.salary ?? '급여 원문 확인'}</p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
        <div className="text-xs text-muted-foreground">
          <p>마감 {job.deadline ?? '원문 확인'}</p>
          {job.postedAt ? <p className="mt-1">등록 {job.postedAt}</p> : null}
        </div>
        {job.sourceUrl ? (
          <a
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-background hover:opacity-85"
            href={job.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            원문 <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function StatusCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
