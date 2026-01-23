import mongoose from 'mongoose';

// GANTI STRING INI DENGAN MONGODB ATLAS KAMU
const MONGODB_URI = "mongodb+srv://manzz92us_db_user:YN6VzPQ1Jii2RhoO@nexuskit.b2umg6d.mongodb.net/nexuskit?retryWrites=true&w=majority";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

