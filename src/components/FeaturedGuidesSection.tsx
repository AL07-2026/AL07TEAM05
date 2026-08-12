import { Award, CheckCircle2, MapPin } from 'lucide-react';
//import { Link } from 'react-router';

import type { PublicGuideProfile } from '@/types';

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-8 text-center">
      <p className="text-sm font-semibold text-muted-foreground">아직 표시할 예시 가이드가 없습니다.</p>
      <p className="mt-2 text-xs text-muted-foreground">검증된 가이드 DB가 연결되면 자동으로 노출됩니다.</p>
    </div>
  );
}

function GuideAvatar({ photoUrl, name }: { photoUrl?: string; name: string }) {
  if (photoUrl) {
    return <img alt={name} className="size-12 rounded-full object-cover" referrerPolicy="no-referrer" src={photoUrl} />;
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-coral-soft text-coral">
      <span className="text-base font-bold">{name.slice(0, 1)}</span>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-slate-600">{children}</span>;
}

export function FeaturedGuidesSection({ guides }: { guides: readonly PublicGuideProfile[] }) {
  if (guides.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {guides.map((guide) => (
        <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition hover:border-coral/40 hover:shadow-sm" key={guide.id}>
          <div className="flex items-start gap-4">
            <GuideAvatar name={guide.name} photoUrl={guide.profilePhotoUrl} />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-ink">{guide.name}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">예시 프로필</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-coral-soft px-2 py-1 text-xs font-bold text-coral">
              <CheckCircle2 className="size-3.5" />
              확인
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>{guide.languages.join(', ')}</Badge>
            <Badge>{guide.regions.join(', ')}</Badge>
            <Badge>{guide.experienceRange}</Badge>
          </div>

          <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">{guide.introduction}</p>
          <div className="mt-auto grid gap-2 pt-5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-coral" />
              주요 지역과 언어를 함께 확인
            </span>
            <span className="flex items-center gap-2">
              <Award className="size-4 text-coral" />
              추천 사유는 운영 검토 후 안내
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
