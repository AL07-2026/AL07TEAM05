import { ArrowLeft, BriefcaseBusiness, ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import downloadedData from './jobs.json';

type LocalJob = {
  id: string;
  title?: string;
  company?: string;
  category?: string;
  career?: string;
  education?: string;
  employmentType?: string;
  salary?: string;
  deadline?: string;
  postedAt?: string;
  sourceUrl?: string;
};

const jobs = downloadedData.jobs as LocalJob[];

export function StandaloneJobsPage() {
  const [query, setQuery] = useState('');
  const [employmentType, setEmploymentType] = useState('전체');

  const employmentTypes = useMemo(
    () => [
      '전체',
      ...new Set(jobs.map((job) => job.employmentType).filter((value): value is string => Boolean(value))),
    ],
    [],
  );

  const filteredJobs = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    return jobs.filter((job) => {
      const searchableText = [job.title, job.company, job.category]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('ko-KR');
      return (
        (!keyword || searchableText.includes(keyword)) &&
        (employmentType === '전체' || job.employmentType === employmentType)
      );
    });
  }, [employmentType, query]);

  return (
    <div className="min-h-screen bg-muted/50 text-ink">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-base font-semibold tracking-tight">TourMatch Jobs</p>
            <p className="text-xs text-muted-foreground">여행사 대표님을 위한 채용정보</p>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold hover:text-coral" to="/">
            <ArrowLeft className="size-4" /> TourMatch로 돌아가기
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-sm font-semibold text-coral">LOCAL JOB ARCHIVE</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              관광·통역·여행 채용정보
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Firebase에서 내려받은 채용공고를 빠르게 검색하고 원문에서 상세 조건을 확인하세요.
            </p>

            <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-[1fr_200px]">
              <label className="relative block">
                <span className="sr-only">채용공고 검색</span>
                <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="min-h-12 w-full rounded-xl border border-input bg-background pr-4 pl-12 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="직무 또는 회사명 검색"
                  value={query}
                />
              </label>
              <select
                aria-label="고용 형태"
                className="min-h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                onChange={(event) => setEmploymentType(event.target.value)}
                value={employmentType}
              >
                {employmentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">저장된 공고</p>
              <p className="mt-1 text-2xl font-semibold">{filteredJobs.length}건</p>
            </div>
            <p className="text-xs text-muted-foreground">
              내려받은 시각 {new Date(downloadedData.metadata.downloadedAt).toLocaleString('ko-KR')}
            </p>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredJobs.map((job) => <LocalJobCard job={job} key={job.id} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">저장된 채용공고가 없습니다</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                현재 Firebase의 jobs 컬렉션이 비어 있습니다.<br />
                데이터가 등록된 후 다운로드 파일을 갱신하면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LocalJobCard({ job }: { job: LocalJob }) {
  return (
    <article className="flex min-h-64 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span className="w-fit rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral">
        {job.employmentType ?? '고용형태 확인'}
      </span>
      <h2 className="mt-4 text-lg font-semibold leading-7">{job.title ?? '제목 없음'}</h2>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{job.company ?? '회사 정보 없음'}</p>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p>{job.category ?? '관광 분야'}</p>
        <p>{[job.career, job.education].filter(Boolean).join(' · ') || '지원 자격 원문 확인'}</p>
        <p>{job.salary ?? '급여 원문 확인'}</p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>마감 {job.deadline ?? '원문 확인'}</span>
        {job.sourceUrl ? (
          <a className="inline-flex items-center gap-1 font-semibold text-ink hover:text-coral" href={job.sourceUrl} rel="noreferrer" target="_blank">
            원문 보기 <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
