require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const connectDB = require('./config/db');

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY || 'vigilant-vote-secure-key-2024';

const encryptData = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

const generateChecksum = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const runMigration = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Complaint.deleteMany({});
    
    const superadminPassword = await bcrypt.hash('superadmin@321', 10);
    const adminPassword = await bcrypt.hash('admin@123', 10);

    const users = await User.insertMany([
      {
        userId: uuidv4(),
        email: 'superadmin@vigilant.com',
        role: 'superadmin',
        password: superadminPassword,
        isVerified: true
      },
      {
        userId: uuidv4(),
        email: 'admin@vigilant.com',
        role: 'admin',
        password: adminPassword,
        isVerified: true
      }
    ]);

    const adminUser = users[1];

    const sampleComplaintsData = [
      {
        complaintId: 'CMP-2024-001',
        voterId: 'VOTER-IN-98120',
        category: 'Voter Bribery / Inducement',
        rawText: 'Unauthorized distribution of cash and gift vouchers reported near Gate 4 of St. Mary School voting booth.',
        status: 'investigating',
        location: {
          district: 'Kanyakumari',
          boothNumber: 'Booth #142',
          lat: 18.9535,
          lng: 72.8805
        },
        adminNotes: 'Field officer dispatched for verification at 11:30 AM.',
        assignedTo: adminUser._id
      },
      {
        complaintId: 'CMP-2024-002',
        voterId: 'VOTER-IN-77412',
        category: 'EVM Malfunction / Tampering',
        rawText: 'EVM unit VVPAT display screen unresponsive in Room B. Voting temporarily halted by presiding officer.',
        status: 'resolved',
        location: {
          district: 'Kanyakumari',
          boothNumber: 'Booth #88',
          lat: 28.6139,
          lng: 77.2090
        },
        adminNotes: 'EVM reserve unit replaced by sectoral magistrate. Voting resumed normally.',
        assignedTo: adminUser._id
      },
      {
        complaintId: 'CMP-2024-003',
        voterId: 'VOTER-IN-44519',
        category: 'Intimidation / Coercion',
        rawText: 'Group of unauthorized individuals gathering within 100 meters of booth perimeter attempting to influence voters.',
        status: 'pending',
        location: {
          district: 'Kanyakumari',
          boothNumber: 'Booth #304',
          lat: 12.9716,
          lng: 77.5946
        }
      },
      {
        complaintId: 'CMP-2024-004',
        voterId: 'VOTER-IN-33218',
        category: 'Unauthorized Campaigning',
        rawText: 'Loudspeakers installed near polling station playing party campaign songs in violation of model code of conduct.',
        status: 'pending',
        location: {
          district: 'Kanyakumari',
          boothNumber: 'Booth #92',
          lat: 28.6250,
          lng: 77.2200
        }
      }
    ];

    const encryptedComplaints = sampleComplaintsData.map(data => {
      const encrypted = encryptData(data.rawText);
      const checksum = generateChecksum(data.rawText);

      return {
        complaintId: data.complaintId,
        voterId: data.voterId,
        category: data.category,
        encryptedContent: encrypted,
        checksum: checksum,
        status: data.status,
        location: data.location,
        adminNotes: data.adminNotes || '',
        assignedTo: data.assignedTo || null
      };
    });

    await Complaint.insertMany(encryptedComplaints);

    console.log('MIGRATION COMPLETED SUCCESSFULLY');
    console.log('Seeded Accounts:');
    console.log(' Superadmin : superadmin@vigilant.com | Pass: superadmin@321');
    console.log(' Admin      : admin@vigilant.com      | Pass: admin@123');
    console.log(`Total Seeded Complaints (Encrypted & Checksummed): ${encryptedComplaints.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
};

runMigration();
