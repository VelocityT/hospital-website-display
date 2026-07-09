import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

// Force public DNS resolvers for the MongoDB SRV lookup.
// Many ISP resolvers (common in India) refuse "mongodb+srv" SRV/TXT
// queries and throw `querySrv ECONNREFUSED`. Google (8.8.8.8) and
// Cloudflare (1.1.1.1) answer them reliably.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not override DNS servers:', e.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (String(error.message).includes('querySrv')) {
      console.error(
        'This is a DNS/SRV lookup failure, not a credentials issue.\n' +
        '  1) Confirm you have internet access.\n' +
        '  2) If it persists, replace the "mongodb+srv://" URI in .env with the\n' +
        '     standard "mongodb://" connection string from Atlas (Connect →\n' +
        '     Drivers → older driver version), which skips the SRV lookup.'
      );
    }
    process.exit(1);
  }
};

export default connectDB;
