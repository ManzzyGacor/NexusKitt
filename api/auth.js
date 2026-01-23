import dbConnect from './connect.js';
import mongoose from 'mongoose';

// Schema User
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Member' }, // Member, VIP, SVIP
  expired: { type: Date, default: null }, // Null = Lifetime / Free
  profilePic: { type: String, default: 'https://files.catbox.moe/ejn7q9.jpeg' }
});

let User;
try {
  User = mongoose.model('User');
} catch {
  User = mongoose.model('User', UserSchema);
}

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    const { action, username, password } = req.body;

    if (action === 'register') {
      try {
        const check = await User.findOne({ username });
        if (check) return res.status(400).json({ error: 'Username sudah dipakai' });
        
        const newUser = new User({ username, password });
        await newUser.save();
        return res.status(200).json({ success: true, message: 'Berhasil daftar' });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    if (action === 'login') {
      try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(400).json({ error: 'Akun tidak ditemukan / Password salah' });
        
        // Hitung Expired
        let expText = "Permanent / Free";
        if (user.expired) {
            const now = new Date();
            const diff = Math.ceil((new Date(user.expired) - now) / (1000 * 60 * 60 * 24));
            expText = diff > 0 ? `${diff} Hari` : "Expired";
        }

        return res.status(200).json({ 
          success: true, 
          data: { 
            username: user.username, 
            role: user.role, 
            expired: expText,
            pic: user.profilePic 
          } 
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

