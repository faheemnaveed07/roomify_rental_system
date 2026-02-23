require('dotenv').config();
const mongoose = require('mongoose');

const email = process.argv[2] || process.env.PROMOTE_EMAIL;

if (!email) {
  console.error('Usage: node promote-to-admin.js <email>');
  process.exit(1);
}

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomify';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const users = mongoose.connection.collection('users');
    const result = await users.updateOne(
      { email: email.toLowerCase() },
      { $set: { role: 'admin', status: 'active', emailVerified: true } }
    );
    if (result.matchedCount === 0) {
      console.error('User not found:', email);
      process.exit(1);
    }
    console.log(`User ${email} promoted to admin.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to promote user:', err);
    process.exit(1);
  }
};

run();
