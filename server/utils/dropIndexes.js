const mongoose = require('mongoose');
require('dotenv').config();

const dropIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const marksCollection = db.collection('marks');
    const resultsCollection = db.collection('results');

    // Drop mark_id index from marks collection
    try {
      await marksCollection.dropIndex('mark_id_1');
      console.log('✓ Dropped mark_id_1 index from marks collection');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ mark_id_1 index does not exist in marks collection (already removed)');
      } else {
        console.error('Error dropping mark_id_1 index:', err.message);
      }
    }

    // Drop result_id index from results collection
    try {
      await resultsCollection.dropIndex('result_id_1');
      console.log('✓ Dropped result_id_1 index from results collection');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ result_id_1 index does not exist in results collection (already removed)');
      } else {
        console.error('Error dropping result_id_1 index:', err.message);
      }
    }

    console.log('\nIndex cleanup completed!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

dropIndexes();
