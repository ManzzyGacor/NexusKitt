import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['member', 'vip', 'vvip', 'reseller', 'reseller+', 'owner'], 
    default: 'member' 
  },
  expiredDate: { type: Date, default: null }, // Null artinya lifetime atau belum aktif
  createdBy: { type: String, default: 'system' } // Siapa yang nambahin (untuk audit)
});

// Mencegah model dicompile ulang saat hot-reload
export default mongoose.models.User || mongoose.model('User', UserSchema);

