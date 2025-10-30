const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
  const userDoc = await db.collection('users').doc('4mLiLnIRuDzKQHdK4QOR').get();
  console.log(JSON.stringify(userDoc.data(), null, 2));
}

checkUser().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
