import type { PublicGuideProfile } from '@/types';
import { CheckCircle2 } from 'lucide-react';

const cardClass =
  'flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-coral/30 hover:shadow-sm';

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
        className="size-10 rounded-full object-cover"
        referrerPolicy="no-referrer"
        src={photoUrl}
      />
    );
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-full bg-coral-soft text-coral">
      <span className="text-sm font-semibold">{name.slice(0, 1)}</span>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <CheckCircle2 className="size-3.5 text-coral" />
      자격 확인
    </span>
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

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
              {guide.languages.join(', ')}
            </span>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
              {guide.regions.join(', ')}
            </span>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
              {guide.experienceRange}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{guide.introduction}</p>

          <div className="mt-auto pt-4">
            <VerifiedBadge />
          </div>
        </article>
      ))}
    </div>
  );
}
