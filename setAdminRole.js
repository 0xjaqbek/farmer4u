import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const uid = 'LAX2sKohQnaWyhqqSK6jtJKLA7s2';

getAuth().setCustomUserClaims(uid, { admin: true })
  .then(() => console.log('✅ Admin claim set'))
  .catch(console.error);
