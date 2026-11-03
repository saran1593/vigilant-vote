require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const connectDB = require('./config/db');
const { resolveCoordinates } = require('./utils/districts');
const VoterRoll = require('./models/VoterRoll');

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY || 'vigilant-vote-secure-key-2024';

const encryptData = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
const generateChecksum = (content) => crypto.createHash('sha256').update(content).digest('hex');

const runMigration = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Complaint.deleteMany({});
    await VoterRoll.deleteMany({});
    await VoterRoll.insertMany([
      { epic: 'ABC1234567', name: 'Demo Voter',       district: 'Chennai',     boothNumber: '12' },
      { epic: 'XYZ7654321', name: 'Second Voter',     district: 'Chennai',     boothNumber: '12' },
      { epic: 'TNK1000001', name: 'Arun Kumar',       district: 'Kanyakumari', boothNumber: '142' },
      { epic: 'TNK1000002', name: 'Meena Devi',       district: 'Kanyakumari', boothNumber: '142' },
      { epic: 'TNM2000001', name: 'Karthik Raja',     district: 'Madurai',     boothNumber: '78' },
      { epic: 'TNM2000002', name: 'Lakshmi Priya',    district: 'Madurai',     boothNumber: '78' },
      { epic: 'TNC3000001', name: 'Suresh Babu',      district: 'Coimbatore',  boothNumber: '45' },
      { epic: 'TNC3000002', name: 'Divya Bharathi',   district: 'Coimbatore',  boothNumber: '45' },
      { epic: 'TNS4000001', name: 'Ramesh Chandran',  district: 'Salem',       boothNumber: '33' },
      { epic: 'TNT5000001', name: 'Priya Dharshini',  district: 'Tiruchirappalli', boothNumber: '21' }
    ]);
    const superadminPassword = await bcrypt.hash('superadmin@321', 10);
    const adminPassword = await bcrypt.hash('admin@123', 10);
    const officerPassword = await bcrypt.hash('officer@123', 10);

    const users = await User.insertMany([
      { userId: uuidv4(), email: 'superadmin@vigilant.com', role: 'superadmin', password: superadminPassword, isVerified: true },
      { userId: uuidv4(), email: 'admin@vigilant.com', role: 'admin', password: adminPassword, isVerified: true },
      { userId: uuidv4(), email: 'officer1@vigilant.com', role: 'officer', district: 'Kanyakumari', password: officerPassword, isVerified: true },
      { userId: uuidv4(), email: 'officer2@vigilant.com', role: 'officer', district: 'Chennai', password: officerPassword, isVerified: true }
    ]);

    const adminUser = users[1];

    const base = [
      {
        complaintId: 'CMP-2024-001',
        voterId: 'VOTER-IN-98120',
        category: 'Voter Bribery / Inducement',
        rawText: 'Unauthorized distribution of cash and gift vouchers reported near Gate 4 of St. Mary School voting booth.',
        status: 'investigating',
        district: 'Kanyakumari',
        boothNumber: 'Booth #142',
        adminNotes: 'Field officer dispatched for verification at 11:30 AM.',
        assignedTo: adminUser._id
      },
      {
        complaintId: 'CMP-2024-002',
        voterId: 'VOTER-IN-77412',
        category: 'EVM Malfunction / Tampering',
        rawText: 'EVM unit VVPAT display screen unresponsive in Room B. Voting temporarily halted by presiding officer.',
        status: 'resolved',
        district: 'Kanyakumari',
        boothNumber: 'Booth #88',
        adminNotes: 'EVM reserve unit replaced by sectoral magistrate. Voting resumed normally.',
        assignedTo: adminUser._id
      },
      {
        complaintId: 'CMP-2024-003',
        voterId: 'VOTER-IN-44519',
        category: 'Intimidation / Coercion',
        rawText: 'Group of unauthorized individuals gathering within 100 meters of booth perimeter attempting to influence voters.',
        status: 'pending',
        district: 'Kanyakumari',
        boothNumber: 'Booth #304'
      },
      {
        complaintId: 'CMP-2024-004',
        voterId: 'VOTER-IN-33218',
        category: 'Unauthorized Campaigning',
        rawText: 'Loudspeakers installed near polling station playing party campaign songs in violation of model code of conduct.',
        status: 'pending',
        district: 'Kanyakumari',
        boothNumber: 'Booth #92'
      }
    ];

    // Extra complaints from the same booth, so a real hotspot shows on the heatmap
    const hotspotTexts = [
      'Cash envelopes were handed out again near the same school gate during the afternoon.',
      'Voters in the queue reported being offered gift vouchers by party workers.',
      'A group is distributing tokens for money outside the polling station.',
      'Repeated bribery activity reported at the same booth entrance.'
    ];
    hotspotTexts.forEach((text, i) => {
      base.push({
        complaintId: `CMP-2024-00${i + 5}`,
        voterId: `VOTER-IN-5000${i}`,
        category: 'Voter Bribery / Inducement',
        rawText: text,
        status: 'pending',
        district: 'Kanyakumari',
        boothNumber: 'Booth #142'
      });
    });

    const complaints = base.map((d) => {
      const coords = resolveCoordinates(d.district, d.boothNumber);
      const encrypted = encryptData(d.rawText);
      return {
        complaintId: d.complaintId,
        voterId: d.voterId,
        category: d.category,
        encryptedContent: encrypted,
        checksum: generateChecksum(encrypted),
        status: d.status,
        location: {
          district: coords.district,
          boothNumber: d.boothNumber,
          lat: coords.lat,
          lng: coords.lng
        },
        adminNotes: d.adminNotes || '',
        assignedTo: d.assignedTo || null
      };
    });

    await Complaint.insertMany(complaints);

    console.log('MIGRATION COMPLETED SUCCESSFULLY');
    console.log('Seeded Accounts:');
    console.log(' Superadmin : superadmin@vigilant.com | Pass: superadmin@321');
    console.log(' Admin      : admin@vigilant.com      | Pass: admin@123');
    console.log(' Officer 1  : officer1@vigilant.com   | Pass: officer@123');
    console.log(' Officer 2  : officer2@vigilant.com   | Pass: officer@123');
    console.log(`Total Seeded Complaints (Encrypted & Checksummed): ${complaints.length}`);
    console.log('Demo voter roll: ABC1234567 / "Demo Voter" (Chennai, booth 12)');
    console.log('                 XYZ7654321 / "Second Voter" (Chennai, booth 12)');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
};

runMigration();