import type { PublicGuideProfile } from '@/types';
import { CheckCircle2 } from 'lucide-react';

const cardClass =
  'rounded-2xl border border-border bg-card p-5 transition hover:border-coral/30 hover:shadow-sm';

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground">
      현재 표시할 예시 가이드가 없습니다. 나중에 실제 검증된 가이드 DB가 연결되면 자동으로 노출됩니다.
    </p>
  );
}

function GuideAvatar({ photoUrl, name }: { photoUrl?: string; name: string }) {
  if (photoUrl) {
    return (
      <img
        alt={name}
        className="size-14 rounded-full object-cover sm:size-16"
        referrerPolicy="no-referrer"
        src={photoUrl}
      />
    );
  }

  return (
    <div className="flex size-14 items-center justify-center rounded-full bg-coral-soft text-coral sm:size-16">
      <span className="text-base font-semibold sm:text-lg">{name.slice(0, 1)}</span>
    </div>
  );
}

export function FeaturedGuidesSection({ guides }: { guides: readonly PublicGuideProfile[] }) {
  if (guides.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {guides.map((guide) => (
        <article className={cardClass} key={guide.id}>
          <div className="flex items-center gap-3">
            <GuideAvatar name={guide.name} photoUrl={guide.profilePhotoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{guide.name}</p>
              <p className="text-xs text-muted-foreground">예시 프로필</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-xs font-semibold text-muted-foreground">활동 언어</dt>
              <dd className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                {guide.languages.join(', ')}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-xs font-semibold text-muted-foreground">활동 지역</dt>
              <dd className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                {guide.regions.join(', ')}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-xs font-semibold text-muted-foreground">경력</dt>
              <dd className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                {guide.experienceRange}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.introduction}</p>

          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-coral">
            <CheckCircle2 className="size-4" />
            <span>예시 프로필</span>
          </div>
        </article>
      ))}
    </div>
  );
}
