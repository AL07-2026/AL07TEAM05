import { readFile, writeFile } from 'node:fs/promises';

import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const envText = await readFile(new URL('../../.env', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const snapshot = await getDocs(collection(getFirestore(app), 'jobs'));
const jobs = snapshot.docs.map((document) => ({
  id: document.id,
  ...document.data(),
}));

const output = {
  metadata: {
    collection: 'jobs',
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    downloadedAt: new Date().toISOString(),
    count: jobs.length,
  },
  jobs,
};

await writeFile(new URL('./jobs.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Downloaded ${jobs.length} jobs.`);
