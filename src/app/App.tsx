import { ArrowRight, Globe2, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link, Outlet, createBrowserRouter, RouterProvider } from 'react-router';

const coralPill =
  'inline-flex items-center justify-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-coral-foreground transition-colors hover:bg-coral/90';

function Layout() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">
            TourMatch
          </span>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                필요한 일정과 언어에 맞는
                <br />
                관광통역 가이드를 찾아보세요
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                여행사에서 필요한 지역, 언어, 일정 조건을 알려주시면
                자격 정보를 확인한 가이드를 찾을 수 있도록 도와드립니다.
              </p>
              <p className="text-sm text-muted-foreground">
                현재 검증된 가이드 네트워크를 준비하고 있습니다.
              </p>
              <div>
                <Link
                  className={coralPill}
                  to="#guide-section"
                >
                  어떤 가이드를 찾아드리면 될까요?
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral-soft">
                  <ShieldCheck className="size-6 text-coral" />
                </div>
                <h2 className="mt-4 text-base font-semibold">
                  관광통역안내사 자격 정보 확인
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  자격 요건과 이력을 바탕으로 기본 적합성부터 확인합니다.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral-soft">
                  <Globe2 className="size-6 text-coral" />
                </div>
                <h2 className="mt-4 text-base font-semibold">
                  가능한 언어와 경력 확인
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  사용 언어, 업무 경력, 수행한 활동 범위를 정리해 보여줍니다.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:col-span-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral-soft">
                  <Stethoscope className="size-6 text-coral" />
                </div>
                <h2 className="mt-4 text-base font-semibold">
                  활동 지역과 가능한 일정 확인
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  주요 활동 지역과 가능한 일정 범위를 비교해 요청에 맞는
                  가이드를 우선 추천합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="guide-section"
        className="border-t border-border/60 bg-surface"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              예시 가이드 프로필
            </h2>
            <p className="text-sm text-muted-foreground">
              예시 프로필 · 실제 등록 가이드가 아닙니다
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: '김서연',
                languages: '한국어, 영어, 일본어',
                region: '서울, 경기',
                experience: '관광통역 4년',
                credentials: '관광통역안내사',
              },
              {
                name: '박준호',
                languages: '한국어, 중국어',
                region: '부산, 경남',
                experience: '관광통역 6년',
                credentials: '관광통역안내사',
              },
              {
                name: '이하늘',
                languages: '한국어, 프랑스어',
                region: '제주',
                experience: '관광통역 3년',
                credentials: '관광통역안내사',
              },
              {
                name: '최민지',
                languages: '한국어, 영어',
                region: '서울, 강원',
                experience: '관광통역 5년',
                credentials: '관광통역안내사',
              },
            ].map((profile) => (
              <div
                key={profile.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <p className="text-base font-semibold">{profile.name}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>언어: {profile.languages}</li>
                  <li>주요 활동 지역: {profile.region}</li>
                  <li>경력: {profile.experience}</li>
                  <li>자격 확인: {profile.credentials}</li>
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  예시 프로필 · 실제 등록 가이드가 아닙니다
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              어떤 가이드를 찾아드리면 될까요?
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              다음 단계에서 회사 정보와 필요한 지역, 언어, 일정을 입력해
              가이드 매칭을 요청할 수 있습니다.
            </p>
            <button
              type="button"
              disabled
              className={`${coralPill} cursor-not-allowed opacity-70`}
            >
              가이드 요청하기
            </button>
            <p className="text-sm text-muted-foreground">
              다음 단계에서 연결 예정
            </p>
          </div>
        </div>
      </section>
    </div>
  );
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
      <Link className={`${coralPill} mt-6`} to="/">
        홈으로 이동
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
      { path: 'about', Component: NotFoundPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
