require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Models inline
  const User = require('./models/User');
  const Org  = require('./models/Org');
  const Task = require('./models/Task');
  const { Need, Notification } = require('./models/Need');

  await Promise.all([User.deleteMany(), Org.deleteMany(), Task.deleteMany(), Need.deleteMany(), Notification.deleteMany()]);
  console.log('Cleared');

  const hash = await bcrypt.hash('demo1234', 12);

  // Super admin
  await User.create({ name: 'Platform Admin', email: 'admin@demo.com', password: hash, role: 'super_admin', isVerified: true, isActive: true, location: { city: 'Kolkata', state: 'West Bengal' } });

  // NGO 1 — Approved
  const ngoAdmin = await User.create({ name: 'Priya Sharma', email: 'ngo@demo.com', password: hash, role: 'ngo_admin', isVerified: true, isActive: true, phone: '+91 98300 11111', location: { city: 'Kolkata', state: 'West Bengal' }, bio: 'NGO admin for Kolkata Community Foundation.' });
  const org1 = await Org.create({ name: 'Kolkata Community Foundation', email: 'ngo@demo.com', description: 'Empowering underserved communities in West Bengal through education, healthcare, and livelihoods.', category: 'education', verificationStatus: 'approved', verifiedAt: new Date(), location: { city: 'Kolkata', state: 'West Bengal', address: '12 Park Street, Kolkata' }, adminIds: [ngoAdmin._id], volunteerCount: 14, totalTasks: 8, completedTasks: 3, totalHours: 210 });
  ngoAdmin.orgId = org1._id; await ngoAdmin.save();

  // Coordinator
  const coord = await User.create({ name: 'Amit Bose', email: 'coord@demo.com', password: hash, role: 'coordinator', isVerified: true, isActive: true, orgId: org1._id, location: { city: 'Kolkata', state: 'West Bengal' }, bio: 'Field coordinator for KCF.' });

  // NGO 2 — Pending
  const ngoAdmin2 = await User.create({ name: 'Rahul Sen', email: 'ngo2@demo.com', password: hash, role: 'ngo_admin', isVerified: true, isActive: true, location: { city: 'Howrah', state: 'West Bengal' } });
  const org2 = await Org.create({ name: 'Howrah Health Initiative', email: 'ngo2@demo.com', description: 'Free healthcare camps and medical aid for rural Howrah.', category: 'health', verificationStatus: 'pending', location: { city: 'Howrah', state: 'West Bengal' }, adminIds: [ngoAdmin2._id] });
  ngoAdmin2.orgId = org2._id; await ngoAdmin2.save();

  // Volunteers
  const vData = [
    { name: 'Anika Das',    email: 'volunteer@demo.com', skills: ['Teaching','Counseling','Social Work'], availability: 'part_time',  city: 'Kolkata', tasksCompleted: 7,  totalHours: 34, bio: 'Educator passionate about community upliftment.' },
    { name: 'Sourav Ghosh', email: 'v2@demo.com',        skills: ['Healthcare','First Aid','Driving'],    availability: 'weekends',   city: 'Kolkata', tasksCompleted: 12, totalHours: 56 },
    { name: 'Meera Patel',  email: 'v3@demo.com',        skills: ['IT/Tech','Media','Social Work'],       availability: 'on_demand',  city: 'Kolkata', tasksCompleted: 4,  totalHours: 18 },
    { name: 'Arjun Mehta',  email: 'v4@demo.com',        skills: ['Logistics','Driving','Construction'],  availability: 'full_time',  city: 'Howrah',  tasksCompleted: 19, totalHours: 98 },
    { name: 'Tanisha Roy',  email: 'v5@demo.com',        skills: ['Legal','Finance','Teaching'],          availability: 'part_time',  city: 'Kolkata', tasksCompleted: 8,  totalHours: 41 },
  ];
  const volunteers = [];
  for (const v of vData) {
    volunteers.push(await User.create({ ...v, password: hash, role: 'volunteer', isVerified: true, isActive: true, location: { city: v.city, state: 'West Bengal' }, lastActive: new Date() }));
  }

  // Tasks
  const now = new Date();
  const tasksData = [
    { title: 'Teach basic literacy — Sundarbans',   description: 'Deliver 2-week foundational literacy curriculum to 15 primary school children in Sundarbans delta.',      category: 'education',      severityScore: 5, skillsRequired: ['Teaching'],             location: { city: 'Sundarbans', state: 'West Bengal' }, maxVolunteers: 3, minVolunteers: 2, durationHours: 40, deadline: new Date(now.getTime() + 14*86400000), scheduledDate: new Date(now.getTime() + 7*86400000) },
    { title: 'Free health camp — Baruipur',         description: 'Assist in organizing a one-day health camp: BP monitoring, eye checks, medicine distribution for 200+ villagers.',  category: 'medical',        severityScore: 4, skillsRequired: ['Healthcare','First Aid'], location: { city: 'Baruipur', state: 'West Bengal' },  maxVolunteers: 5, minVolunteers: 3, durationHours: 8,  deadline: new Date(now.getTime() + 7*86400000),  scheduledDate: new Date(now.getTime() + 5*86400000) },
    { title: 'Set up community IT lab',             description: 'Install and configure 10 donated computers and train a local coordinator for ongoing maintenance.',             category: 'education',      severityScore: 3, skillsRequired: ['IT/Tech'],               location: { city: 'Kolkata', state: 'West Bengal' },   maxVolunteers: 2, minVolunteers: 1, durationHours: 12 },
    { title: 'Flood relief distribution — North Bengal', description: 'Sort, pack and distribute flood relief kits to 500 affected families in Jalpaiguri.',                  category: 'shelter',        severityScore: 5, skillsRequired: ['Logistics','Driving'],   location: { city: 'Jalpaiguri', state: 'West Bengal'}, maxVolunteers: 8, minVolunteers: 4, durationHours: 24, deadline: new Date(now.getTime() + 3*86400000) },
    { title: 'Community kitchen documentation',     description: 'Photo/video documentary of our kitchen serving 300 meals/day — for annual report and donor outreach.',       category: 'food',           severityScore: 2, skillsRequired: ['Media'],                 location: { city: 'Kolkata', state: 'West Bengal' },   maxVolunteers: 1, minVolunteers: 1, durationHours: 6 },
    { title: 'Legal aid clinic — migrant workers',  description: '2-day free legal aid camp for migrant workers seeking documentation and employment rights guidance.',         category: 'legal',          severityScore: 4, skillsRequired: ['Legal'],                 location: { city: 'Kolkata', state: 'West Bengal' },   maxVolunteers: 4, minVolunteers: 2, durationHours: 16, deadline: new Date(now.getTime() + 10*86400000) },
  ];
  const createdTasks = [];
  for (const t of tasksData) {
    createdTasks.push(await Task.create({ ...t, orgId: org1._id, createdBy: ngoAdmin._id }));
  }

  // Needs (heatmap data)
  const needsData = [
    { title: 'Clean water shortage — Block 7',         description: 'Over 400 households with no safe drinking water. Borewells contaminated since July floods.', category: 'medical',   severityScore: 5, reportCount: 12, affectedPeople: 1800, location: { city: 'Basirhat',   state: 'West Bengal', area: 'Block 7'    }, dateReported: new Date(now.getTime() - 2*86400000) },
    { title: 'No teachers — Grades 4–7',               description: 'Government school has lacked qualified teachers for 8 months due to consecutive transfers.',  category: 'education', severityScore: 4, reportCount: 6,  affectedPeople: 280,  location: { city: 'Namkhana',  state: 'West Bengal', area: 'Village B'  }, dateReported: new Date(now.getTime() - 5*86400000) },
    { title: 'Malnutrition — tribal belt',             description: '43% of children under 5 in 60 surveyed tribal households showing signs of malnutrition.',     category: 'food',      severityScore: 5, reportCount: 9,  affectedPeople: 340,  location: { city: 'Purulia',   state: 'West Bengal', area: 'North Zone' }, dateReported: new Date(now.getTime() - 1*86400000) },
    { title: 'Youth unemployment post-flood',          description: '200+ young adults lost livelihoods. Need vocational training and employment linkage urgently.', category: 'education', severityScore: 3, reportCount: 4,  affectedPeople: 210,  location: { city: 'Cooch Behar',state: 'West Bengal',area: 'Sector 4'  }, dateReported: new Date(now.getTime() - 8*86400000) },
    { title: 'Sanitation crisis — transit camp',       description: '800 displaced persons at the transit camp share 3 functional toilets. Emergency.',             category: 'shelter',   severityScore: 5, reportCount: 15, affectedPeople: 800,  location: { city: 'Murshidabad',state: 'West Bengal',area: 'Transit A' }, dateReported: new Date() },
    { title: 'Lack of textbooks — primary school',     description: 'District primary school serving 320 students has not received government textbooks for 2024.', category: 'education', severityScore: 3, reportCount: 3,  affectedPeople: 320,  location: { city: 'Birbhum',  state: 'West Bengal', area: 'Ward 5'    }, dateReported: new Date(now.getTime() - 14*86400000) },
    { title: 'Dengue outbreak — Ward 12',              description: '60 confirmed dengue cases this month. No mobile health unit available. Residents panicking.',   category: 'medical',   severityScore: 5, reportCount: 20, affectedPeople: 1200, location: { city: 'Kolkata',   state: 'West Bengal', area: 'Ward 12'   }, dateReported: new Date(now.getTime() - 1*86400000) },
  ];
  for (const n of needsData) {
    await Need.create({ ...n, orgId: org1._id, createdBy: ngoAdmin._id });
  }

  console.log('\n✅ Seed complete — ImpactLink v2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo accounts  (password: demo1234)');
  console.log('  volunteer@demo.com   →  /volunteer');
  console.log('  coord@demo.com       →  /coordinator');
  console.log('  ngo@demo.com         →  /org');
  console.log('  admin@demo.com       →  /admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
