const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_lms';
    const conn = await mongoose.connect(connUri);
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // Only exit in production/standalone; in tests we handle errors explicitly
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB Disconnected]');
  } catch (error) {
    console.error(`[MongoDB Disconnect Error]: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
