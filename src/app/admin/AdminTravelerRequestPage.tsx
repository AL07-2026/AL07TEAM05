import { useEffect, useState } from 'react';

import { getTravelerRequest } from '@/services/travelerRequests';
import { adminStatusTone, normalizeAdminStatus } from '@/app/admin/adminUnifiedRequests';
import type { TravelerRequest } from '@/types';

export function AdminTravelerRequestPage({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<TravelerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!requestId) return;

    let ignore = false;

    void getTravelerRequest(requestId)
      .then((item) => {
        if (!ignore) setRequest(item);
      })
      .catch(() => {
        if (!ignore) setHasError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  if (!requestId) {
    return <StatusPage message="요청 ID가 없습니다." backTo="/admin?view=requests" />;
  }

  if (isLoading) {
    return <StatusPage message="여행자 요청을 불러오는 중입니다." backTo="/admin?view=requests" />;
  }

  if (hasError) {
    return <StatusPage message="요청을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." backTo="/admin?view=requests" />;
  }

  if (!request) {
    return <StatusPage message="해당 여행자 요청을 찾을 수 없습니다." backTo="/admin?view=requests" />;
  }

  return (
    <main className="mx-auto max-w-[1300px] p-4 sm:p-7 lg:p-8">
      <a className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" href="/admin?view=requests">
        ← 매칭 요청으로
      </a>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">개인 여행자 매칭 요청</h1>
            <span className={`rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold ${adminStatusTone(request.status)}`}>{normalizeAdminStatus(request.status)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{request.id} · {request.travelerName}</p>
        </div>
      </div>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-5">
          <Card title="요청 정보">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="여행 지역" value={request.region} />
              <Detail label="일정" value={`${request.startDate} - ${request.endDate}`} />
              <Detail label="인원" value={`${request.partySize}명`} />
              <Detail label="필요 언어" value={request.language} />
              <Detail label="연락처" value={request.contactPhone} />
              <Detail label="선택 가이드" value={request.selectedGuideName || '-'} />
            </div>
          </Card>
          <Card title="요청 내용">
            <p className="text-sm leading-6 text-slate-600">{request.requestDetails || '-'}</p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="상태">
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="text-[11px] text-slate-400">접수 ID</p>
                <p className="mt-1 font-semibold">{request.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">여행자</p>
                <p className="mt-1 font-semibold">{request.travelerName}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">현재 상태</p>
                <p className={`mt-1 font-semibold ${adminStatusTone(request.status)} rounded-full px-2.5 py-1 text-xs w-fit`}>{normalizeAdminStatus(request.status)}</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-slate-500 ring-1 ring-slate-200">
              현재 화면은 조회 전용입니다. 상태 저장과 담당자 배정은 다음 단계에서 지원됩니다.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}

function StatusPage({ message, backTo }: { message: string; backTo?: string }) {
  return (
    <main className="mx-auto max-w-[1300px] p-4 sm:p-7 lg:p-8">
      {backTo ? (
        <a className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" href={backTo}>
          ← 뒤로
        </a>
      ) : null}
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">{message}</div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="mb-5 font-bold">{title}</h2>{children}</section>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{value || '-'}</p>
    </div>
  );
}
