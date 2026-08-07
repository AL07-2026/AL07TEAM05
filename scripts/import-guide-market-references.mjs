import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: 'al07team05-12312',
      });

const db = getFirestore(app);

const COLLECTION_NAME = 'guideMarketReferences';

const RECORDS = [
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/private/guides.php',
    serviceType: 'Licensed cultural tour guide',
    language: 'Korean, English',
    region: 'South Korea',
    qualification: 'Licensed tourism interpreter/guide service',
    workingHours: 'Up to 8 hours',
    rate: 'From KRW 400,000',
    overtimeRate: 'KRW 30,000 / hour',
    description: 'Private licensed guide service for foreign-language sightseeing, cultural explanation, and itinerary support.',
    notes: 'Public service overview page; final quotation takes priority.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/private/guide-rates.php',
    serviceType: 'Licensed Tourism Interpreter Guide',
    language: null,
    region: null,
    qualification: 'Licensed tourism interpreter guide',
    workingHours: 'Up to 8 hours',
    rate: 'From KRW 400,000',
    overtimeRate: 'KRW 30,000 / hour',
    description: 'Foreign-language sightseeing, cultural explanation and itinerary support.',
    notes: 'General rate guidance from public guide rates page.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/private/guide-rates.php',
    serviceType: 'Business Interpretation / VIP Support',
    language: null,
    region: null,
    qualification: 'Business interpretation and VIP support',
    workingHours: 'Up to 8 hours or by schedule',
    rate: 'Custom Quote',
    overtimeRate: 'Confirmed separately',
    description: 'Meetings, exhibitions, factory visits and institutional programs.',
    notes: 'Pricing depends on schedule and requirements.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/private/guide-rates.php',
    serviceType: 'Regional Guide Service',
    language: null,
    region: null,
    qualification: null,
    workingHours: 'Up to 8 hours per day',
    rate: 'Guide rate plus regional expenses',
    overtimeRate: 'According to quotation',
    description: 'Transport, out-of-town allowance, meals and accommodation may apply.',
    notes: 'Regional service costs may apply separately.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/private/guide-rates.php',
    serviceType: 'Multi-Day Traveling Guide',
    language: null,
    region: null,
    qualification: null,
    workingHours: 'Daily itinerary basis',
    rate: 'Custom Quote',
    overtimeRate: 'According to quotation',
    description: 'Daily hours, meals, transport, lodging and regional expenses are confirmed in advance.',
    notes: 'Multi-day travel guidance depends on itinerary.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/en/guide-rates.php',
    serviceType: 'Licensed Tourism Interpreter Guide',
    language: null,
    region: null,
    qualification: null,
    workingHours: 'Up to 8 hours',
    rate: 'From KRW 400,000',
    overtimeRate: 'KRW 30,000 / hour',
    description: 'Foreign-language sightseeing, cultural explanation and itinerary support.',
    notes: 'English rates page with same guidance.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/en/guide-rates.php',
    serviceType: 'Business Interpretation / VIP Support',
    language: null,
    region: null,
    qualification: null,
    workingHours: 'Up to 8 hours or by schedule',
    rate: 'Custom Quote',
    overtimeRate: 'Confirmed separately',
    description: 'Meetings, exhibitions, factory visits and institutional programs.',
    notes: 'English description of business interpretation support.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/en/guide-rates.php',
    serviceType: 'Regional Guide Service',
    language: null,
    region: null,
    qualification: null,
    workingHours: 'Up to 8 hours per day',
    rate: 'Guide rate plus regional expenses',
    overtimeRate: 'According to quotation',
    description: 'Transport, out-of-town allowance, meals and accommodation may apply.',
    notes: 'English regional service cost note.',
  },
  {
    source: 'YourBus Korea',
    sourceUrl: 'https://yourbus.kr/en/guide-rates.php',
    serviceType: 'Multi-Day Traveling Guide',
    language: null,
    region: null,
    qualification: null,
    workingHours: 'Daily itinerary basis',
    rate: 'Custom Quote',
    overtimeRate: 'According to quotation',
    description: 'Daily hours, meals, transport, lodging and regional expenses are confirmed in advance.',
    notes: 'English multi-day traveling guidance note.',
  },
];

async function main() {
  const colRef = db.collection(COLLECTION_NAME);

  const existingSnap = await colRef.get();
  const existingKeys = new Set(
    existingSnap.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return `${data.sourceUrl}||${data.serviceType}`;
      })
      .filter(Boolean),
  );

  const normalized = RECORDS.map((item) => ({
    ...item,
    collectedAt: FieldValue.serverTimestamp(),
  }));

  const toImport = normalized.filter((item) => !existingKeys.has(`${item.sourceUrl}||${item.serviceType}`));

  console.log('Existing docs:', existingSnap.size);
  console.log('Candidates:', normalized.length);
  console.log('To import:', toImport.length);

  let saved = 0;
  for (const item of toImport) {
    const ref = db.collection(COLLECTION_NAME).doc();
    await ref.set(item);
    console.log('Saved', ref.id, item.sourceUrl, item.serviceType);
    saved += 1;
  }

  const afterSnap = await colRef.get();
  console.log('Final collection size:', afterSnap.size);
  console.log('Saved this run:', saved);

  const samples = afterSnap.docs.slice(0, 3).map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  console.log('Sample docs:', JSON.stringify(samples, null, 2));
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
