import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://academy.visitkorea.or.kr';
const LIST_URL = `${BASE_URL}/job/recruit/list.do`;
const OUTPUT_PATH = path.resolve('data/tourism-guide-jobs.json');
const KEYWORDS = [
  '관광',
  '여행',
  '가이드',
  '통역',
  '인솔',
  '안내',
  '투어',
  '여행사',
  '여행상담',
  '여행사무',
  '오퍼레이터',
  '랜드사',
  '항공예약',
  '영어',
  '중국어',
  '일본어',
  '외국어',
  '호텔예약',
  '컨시어지',
  '프런트',
  '리셉션',
];
const TARGET_COUNT = 50;

function decodeHtml(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function textContent(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim(),
  );
}

function parseRow(row, matchedKeyword) {
  const detailMatch = row.match(/goDetail\(\s*'([^']+)'\s*,\s*'([^']+)'/);
  const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
  if (!detailMatch || cells.length < 7) return null;

  const titleMatch = cells[2].match(/<b\b[^>]*>([\s\S]*?)<\/b>/i);
  const categoryMatch = cells[2].match(/<span\b[^>]*class=["'][^"']*sub_text[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  const qualification = textContent(cells[3]).split('\n').filter(Boolean);
  const workConditions = textContent(cells[4]).split('\n').filter(Boolean);
  const dates = textContent(cells[5]).split('\n').filter(Boolean);
  const [memberId, sequence] = detailMatch.slice(1);

  return {
    id: `${memberId}-${sequence}`,
    title: titleMatch ? textContent(titleMatch[1]) : textContent(cells[2]),
    company: textContent(cells[1]),
    category: categoryMatch ? textContent(categoryMatch[1]).replace(/\s+-\s+/, ' > ') : null,
    career: qualification[0] ?? null,
    education: qualification.at(-1) ?? null,
    employmentType: workConditions[0] ?? null,
    salary: workConditions.slice(1).join(' ') || null,
    deadline: dates[0] ?? null,
    postedAt: dates[1] ?? null,
    source: textContent(cells[6]),
    sourceUrl: `${BASE_URL}/job/recruit/detail.do?srchMberId=${encodeURIComponent(memberId)}&srchRecruitInfoSeq=${encodeURIComponent(sequence)}`,
    matchedKeyword,
  };
}

async function fetchJobs(keyword) {
  const body = new URLSearchParams({
    pageIndex: '1',
    recordCountPerPage: '50',
    searchKeyword: keyword,
    listSort: 'DESC_REG_DATE',
  });
  const response = await fetch(LIST_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
  });
  if (!response.ok) throw new Error(`${keyword} 검색 실패: HTTP ${response.status}`);

  const html = await response.text();
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => parseRow(match[1], keyword))
    .filter(Boolean);
}

const byId = new Map();
for (const keyword of KEYWORDS) {
  const jobs = await fetchJobs(keyword);
  for (const job of jobs) {
    if (!byId.has(job.id)) byId.set(job.id, job);
  }
}

function relevanceScore(job) {
  const text = `${job.title} ${job.category ?? ''}`;
  const strongTerms = ['가이드', '관광', '통역', '여행', '투어', '인솔', '여행사', '여행사무'];
  const supportingTerms = [
    '안내',
    '예약',
    '항공',
    '외국어',
    '영어',
    '중국어',
    '일본어',
    '컨시어지',
    '프런트',
    '리셉션',
  ];
  return (
    strongTerms.filter((term) => text.includes(term)).length * 10 +
    supportingTerms.filter((term) => text.includes(term)).length * 3
  );
}

const jobs = [...byId.values()]
  .filter((job) => job.title && job.company && job.sourceUrl)
  .map((job) => ({ ...job, relevanceScore: relevanceScore(job) }))
  .filter((job) => job.relevanceScore > 0)
  .sort(
    (a, b) =>
      b.relevanceScore - a.relevanceScore ||
      (b.postedAt ?? '').localeCompare(a.postedAt ?? ''),
  )
  .slice(0, TARGET_COUNT)
  .map((job, index) => ({ ...job, order: index + 1 }));

if (jobs.length < TARGET_COUNT) {
  throw new Error(`공고가 ${jobs.length}건만 수집되어 목표 ${TARGET_COUNT}건에 미달했습니다.`);
}

const output = {
  metadata: {
    title: '관광·통역·여행 가이드 관련 실제 채용 공고',
    sourceName: '한국관광공사 관광전문인력포털(관광인)',
    sourceListUrl: LIST_URL,
    collectedAt: new Date().toISOString(),
    keywords: KEYWORDS,
    count: jobs.length,
    note: '공고 내용과 마감 여부는 변경될 수 있으므로 지원 전 sourceUrl에서 원문을 확인하세요.',
  },
  jobs,
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`${jobs.length} jobs written to ${OUTPUT_PATH}`);
