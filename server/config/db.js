const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`);

  // Drop old unique index on Feedback.f_id so multiple feedbacks can be created without f_id
  try {
    const Feedback = require('../models/Feedback');
    await Feedback.collection.dropIndex('f_id_1');
    console.log('Dropped legacy Feedback index f_id_1');
  } catch (err) {
    if (err.code === 27 || err.codeName === 'IndexNotFound') {
      // index doesn't exist, ignore
    } else {
      console.warn('Could not drop Feedback f_id index (may not exist):', err.message);
    }
  }

  return conn;
};

module.exports = connectDB;

