const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

admin.initializeApp();

const db = admin.firestore();
const storage = new Storage();

const BUCKET_NAME = 'hokkienph.appspot.com'; // Replace with your real bucket
const MAIN_COLLECTION = 'hokkienWords';
const SUBCOLLECTION_NAME = 'labelFor1stMean';
const EXPORT_FILENAME = 'exported_data.json';

exports.exportFirestoreData = functions
  .https
  .onRequest(async (req, res) => {
    try {
      const result = {};
      const batchSize = 500; // Safe Firestore read batch size
      let lastDoc = null;
      let totalExported = 0;

      while (true) {
        let query = db.collection(MAIN_COLLECTION).orderBy('label').limit(batchSize);
        if (lastDoc) query = query.startAfter(lastDoc);

        const snapshot = await query.get();
        if (snapshot.empty) break;

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const fieldName = data?.meaning || doc.id;

          const subSnap = await doc.ref.collection(SUBCOLLECTION_NAME).get();
          result[fieldName] = subSnap.docs.map(subDoc => ({
            id: subDoc.id,
            ...subDoc.data()
          }));
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        totalExported += snapshot.size;
        console.log(`Exported ${totalExported} docs...`);
      }

      const jsonString = JSON.stringify(result, null, 2);
      const file = storage.bucket(BUCKET_NAME).file(EXPORT_FILENAME);
      await file.save(jsonString);

      console.log(`✅ Export completed. File saved to ${EXPORT_FILENAME}`);
      res.status(200).send(`Export complete. Download from gs://${BUCKET_NAME}/${EXPORT_FILENAME}`);
    } catch (err) {
      console.error('🔥 Export error:', err);
      res.status(500).send('Failed to export data');
    }
  });
