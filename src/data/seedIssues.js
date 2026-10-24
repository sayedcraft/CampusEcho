/**
 * seedIssues.js
 * Canonical constants and pre-populated seed issues for CampusEcho (IIUC Edition).
 * All seed data reflects realistic Kumira campus student pain-points.
 */

// ---------------------------------------------------------------------------
// Allowed constants — single source of truth used by both UI and API layer
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  "Facilities",
  "IT & Equipment",
  "Water & Sanitation",
  "Transport & Bus",
  "Admin & Queue",
  "Seating & Space",
  "Other",
];

export const STATUSES = ["Open", "In Progress", "Resolved"];

export const IIUC_LOCATIONS = [
  // Academic buildings
  "CSE Building - Lab 301",
  "CSE Building - Lab 302",
  "CSE Building - Lab 303",
  "CSE Building - Faculty Room",
  "Academic Building 1",
  "Academic Building 1 - Room 101",
  "Academic Building 1 - Room 102",
  "Academic Building 2",
  "Academic Building 2 - Room 204",
  "Academic Building 2 - Room 301",
  "Academic Building 3",
  // Library
  "Central Library - Ground Floor",
  "Central Library - 2nd Floor",
  "Central Library - Reading Hall",
  // Administration
  "Controller of Examinations Office",
  "Registrar Office",
  "Accounts Office",
  "Vice Chancellor Office",
  "Student Affairs Office",
  "Academic Admin Office",
  // Facilities
  "Central Mosque",
  "Central Mosque Ablution Area",
  "Girls Cafeteria",
  "Boys Cafeteria",
  "Main Cafeteria",
  "Medical Center",
  "Sports Ground",
  "Auditorium",
  // Transport
  "Kumira Bus Point (Chawkbazar Route)",
  "Kumira Bus Point (GEC Route)",
  "Kumira Bus Point (Oxygen Route)",
  "Kumira Bus Point (Agrabad Route)",
  "Main Gate Bus Stop",
  // Halls / Hostels
  "Boys Dormitory A",
  "Boys Dormitory B",
  "Girls Dormitory",
  // Other
  "Main Gate",
  "Parking Area",
  "Generator Room",
];

// ---------------------------------------------------------------------------
// Seed issues — 6 realistic IIUC Kumira campus reports
// ---------------------------------------------------------------------------

/** @type {Array<object>} */
const seedIssues = [
  {
    id: "issue-1",
    title: "CSE Lab 302 – Half the PCs are unusable (no OS / broken HDD)",
    description:
      "Bhai, Lab 302-te 14ta PC er modhye 6ta te Windows e boot e na. Kono kono ta HDD missing, kono ta e BIOS e atek jay. Practical class er shomoy 30+ student ke 8ta working PC share korte hoy. Ekta group practical submit korte giye puro session nosto holo. IT cell ke already 2 bar bolা hoice, kono action nei.",
    summary:
      "6 out of 14 PCs in CSE Lab 302 are non-functional due to missing HDDs or boot failures. Students share 8 working machines during practicals, severely disrupting lab sessions. IT Cell has been informed twice with no action taken.",
    summaryBn:
      "CSE Lab ৩০২-এ ১৪টি পিসির মধ্যে ৬টি চালু হয় না — কারও হার্ড ড্রাইভ নেই, কারও বুট হয় না। ৩০+ শিক্ষার্থী মাত্র ৮টি কার্যকর পিসি ভাগ করে ব্যবহার করছে, যা প্র্যাকটিক্যাল ক্লাস মারাত্মকভাবে ব্যাহত করছে। আইটি সেলকে দু'বার জানানো হলেও এখন পর্যন্ত কোনো ব্যবস্থা নেওয়া হয়নি।",
    category: "IT & Equipment",
    location: "CSE Building - Lab 302",
    suggestedOffice: "IT & Maintenance Cell",
    urgency: "High",
    keywords: ["pc", "lab", "broken", "hdd", "boot", "practical", "cse"],
    status: "Open",
    createdAt: "2026-10-20T09:15:00.000Z",
    similarCount: 3,
  },
  {
    id: "issue-2",
    title: "Central Library 2nd Floor – AC not working, unbearable heat",
    description:
      "Library er 2nd floor e last 3 week dhore AC band. October te o room ta oven er moto hot. Students reading hall e bose study korte parche na, ghame bheye jay. Exam season ache, ektu urgent action dorkar. Facilities office ke complain korlam, bolen 'dekha hobe' — kintu kono update nei.",
    summary:
      "Air conditioning on the Central Library 2nd floor has been non-functional for 3 weeks. The reading hall is extremely hot, making it impossible for students to study during the exam season. Facilities office was informed but no repair has been scheduled.",
    summaryBn:
      "কেন্দ্রীয় লাইব্রেরির ২য় তলায় গত ৩ সপ্তাহ ধরে এয়ার কন্ডিশনার বন্ধ। পরীক্ষার মৌসুমে রিডিং হলে প্রচণ্ড গরমে বসে পড়া যাচ্ছে না। ফ্যাসিলিটিজ অফিসকে অভিযোগ করা হলেও এখন পর্যন্ত কোনো মেরামতের উদ্যোগ নেওয়া হয়নি।",
    category: "Facilities",
    location: "Central Library - 2nd Floor",
    suggestedOffice: "Estate & Facilities Office",
    urgency: "High",
    keywords: ["ac", "library", "heat", "reading", "exam", "air conditioning"],
    status: "In Progress",
    createdAt: "2026-10-18T11:30:00.000Z",
    similarCount: 5,
  },
  {
    id: "issue-3",
    title: "Chawkbazar Bus – Chronically late, students missing 8 AM classes",
    description:
      "Chawkbazar theke IIUC bus morning 7:15 AM e ashar kotha. But regularly 7:45-8:00 AM er age ase na. Onekdin to 8:10 AM eo ashe na. 1st period class 8:00 AM e, tai bus miss mane class miss. Transport division ke bolа hoice, driver bhai bolen 'traffic', but ei traffic daily same time e hoy — plan korle avoid kora jay. Attendance problem hocche students der.",
    description:
      "Chawkbazar theke IIUC bus scheduled 7:15 AM, but it regularly arrives between 7:45–8:10 AM. First period starts at 8:00 AM so students consistently miss class. The Transport Division blames traffic, but the delay is a daily pattern that could be addressed with an earlier departure. Student attendance is being penalized as a result.",
    summary:
      "The IIUC bus from Chawkbazar is scheduled at 7:15 AM but regularly arrives 30–55 minutes late, causing students to miss their 8:00 AM first-period class. Despite complaints, no schedule adjustment has been made and students are losing attendance.",
    summaryBn:
      "চাকবাজার থেকে IIUC বাস সকাল ৭:১৫-তে আসার কথা থাকলেও প্রতিদিন ৩০–৫৫ মিনিট দেরিতে আসছে। প্রথম পিরিয়ড ৮:০০টায় শুরু হওয়ায় শিক্ষার্থীরা নিয়মিত ক্লাস মিস করছে এবং উপস্থিতি কমে যাচ্ছে। পরিবহন বিভাগকে অভিযোগ করা হলেও শিডিউল সংশোধনের কোনো উদ্যোগ নেই।",
    category: "Transport & Bus",
    location: "Kumira Bus Point (Chawkbazar Route)",
    suggestedOffice: "Transport Division",
    urgency: "High",
    keywords: ["bus", "late", "chawkbazar", "attendance", "schedule", "transport", "morning"],
    status: "Open",
    createdAt: "2026-10-21T07:45:00.000Z",
    similarCount: 8,
  },
  {
    id: "issue-4",
    title: "Controller of Examinations – 2+ hour queue for admit card collection",
    description:
      "Final exam er agey admit card collect korte giye 2 ghonta plus line e darate hoise. Room ta choto, seat nai, students corridor e darate baddho. System ta completely manual — form fill up koro, sign koro, wait koro. Ektu token system ba online download option rakha jay na? Controller office er bayre line dhore sun e dure jayche class theke.",
    summary:
      "Students are waiting 2+ hours in queues outside the Controller of Examinations Office to collect admit cards before finals. The manual process (form fill-up → signature → collection) is extremely slow. A token system or online admit card download would eliminate the bottleneck.",
    summaryBn:
      "ফাইনাল পরীক্ষার আগে অ্যাডমিট কার্ড সংগ্রহ করতে গিয়ে শিক্ষার্থীদের ২ ঘণ্টার বেশি সময় লাইনে দাঁড়াতে হচ্ছে। সম্পূর্ণ ম্যানুয়াল পদ্ধতিতে ফর্ম পূরণ, স্বাক্ষর ও সংগ্রহ করতে হয়। টোকেন সিস্টেম বা অনলাইনে ডাউনলোডের সুবিধা চালু করলে এই ভোগান্তি কমানো সম্ভব।",
    category: "Admin & Queue",
    location: "Controller of Examinations Office",
    suggestedOffice: "Academic Admin Office",
    urgency: "Medium",
    keywords: ["admit card", "queue", "exam", "controller", "manual", "long wait"],
    status: "Open",
    createdAt: "2026-10-19T10:00:00.000Z",
    similarCount: 12,
  },
  {
    id: "issue-5",
    title: "Central Mosque Ablution Area – Taps broken, water pressure near zero",
    description:
      "Mosque er odhu khanar 4ta tap er modhye 3ta completely kharap. Jeta kaje ache sheta te water pressure eto kom je odhur jonno 10+ minute wait korte hoy. Jumu'ah namazer agey line laige jay. Plumber pathano hoise naki, but last 2 week dhore same condition. Ei obostha te ibadah korte monobaston khoti hochche.",
    summary:
      "3 of 4 taps in the Central Mosque ablution area are broken. The single working tap has near-zero water pressure, causing 10+ minute waits before Jumu'ah prayer. Despite a reported plumber visit, the issue persists for 2 weeks.",
    summaryBn:
      "কেন্দ্রীয় মসজিদের অজুখানার ৪টি কলের মধ্যে ৩টি সম্পূর্ণ নষ্ট। একটিমাত্র কার্যকর কলে পানির চাপ এতটাই কম যে জুমার নামাজের আগে অজু করতে ১০+ মিনিট অপেক্ষা করতে হয়। প্লাম্বার পাঠানোর কথা জানানো হলেও গত ২ সপ্তাহে কোনো সমাধান হয়নি।",
    category: "Water & Sanitation",
    location: "Central Mosque Ablution Area",
    suggestedOffice: "Estate & Facilities Office",
    urgency: "Medium",
    keywords: ["tap", "water", "mosque", "ablution", "pressure", "broken", "prayer"],
    status: "Open",
    createdAt: "2026-10-17T13:00:00.000Z",
    similarCount: 2,
  },
  {
    id: "issue-6",
    title: "Academic Building 2 Room 204 – Only 40 seats for 80-student batch",
    description:
      "AB2 Room 204 e CSE 5th semester er Theory of Computation class hoy. Batch size 80+, but room e seat ache max 40ta. Baki students floor e boshe, corridor e daray, ba class e enter-e korte parhe na. Teacher boro room er jonno request korechilen, but room allocation change hoyni. Ei obostha te class properly hocche na.",
    summary:
      "Room 204 in Academic Building 2 has only 40 seats but hosts an 80+ student Theory of Computation class. Students sit on the floor or stand in the corridor. A room reallocation request was submitted by the faculty but not acted on.",
    summaryBn:
      "একাডেমিক ভবন ২-এর ২০৪ নম্বর রুমে মাত্র ৪০টি আসন, অথচ সেখানে ৮০+ শিক্ষার্থীর ক্লাস হচ্ছে। শিক্ষার্থীরা মেঝেতে বসে বা করিডোরে দাঁড়িয়ে ক্লাস করছে। সংশ্লিষ্ট শিক্ষক বড় কক্ষ বরাদ্দের অনুরোধ করলেও এখন পর্যন্ত কোনো পরিবর্তন হয়নি।",
    category: "Seating & Space",
    location: "Academic Building 2 - Room 204",
    suggestedOffice: "Academic Admin Office",
    urgency: "High",
    keywords: ["seat", "room", "overcrowded", "class", "allocation", "students", "capacity"],
    status: "Open",
    createdAt: "2026-10-22T08:30:00.000Z",
    similarCount: 4,
  },
];

export default seedIssues;
