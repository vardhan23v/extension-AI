import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

// ─── Company Data ───────────────────────────────────────────
const COMPANIES = [
  { name: 'Google', slug: 'google', industry: 'Technology', headquarters: 'Bengaluru', foundedYear: 1998, headcountRange: '100,000+', description: 'Global technology leader in search, cloud, and AI.', website: 'https://google.com' },
  { name: 'Amazon', slug: 'amazon', industry: 'E-Commerce', headquarters: 'Bengaluru', foundedYear: 1994, headcountRange: '100,000+', description: 'World\'s largest e-commerce and cloud computing company.', website: 'https://amazon.com' },
  { name: 'Meta', slug: 'meta', industry: 'Technology', headquarters: 'Hyderabad', foundedYear: 2004, headcountRange: '50,000+', description: 'Social media conglomerate building the metaverse.', website: 'https://meta.com' },
  { name: 'Microsoft', slug: 'microsoft', industry: 'Technology', headquarters: 'Hyderabad', foundedYear: 1975, headcountRange: '100,000+', description: 'Enterprise software, cloud, and AI leader.', website: 'https://microsoft.com' },
  { name: 'NVIDIA', slug: 'nvidia', industry: 'Technology', headquarters: 'Pune', foundedYear: 1993, headcountRange: '20,000+', description: 'GPU and AI computing pioneer.', website: 'https://nvidia.com' },
  { name: 'Apple', slug: 'apple', industry: 'Technology', headquarters: 'Hyderabad', foundedYear: 1976, headcountRange: '100,000+', description: 'Consumer electronics and software giant.', website: 'https://apple.com' },
  { name: 'Flipkart', slug: 'flipkart', industry: 'E-Commerce', headquarters: 'Bengaluru', foundedYear: 2007, headcountRange: '10,000+', description: 'India\'s leading e-commerce marketplace.', website: 'https://flipkart.com' },
  { name: 'Razorpay', slug: 'razorpay', industry: 'Fintech', headquarters: 'Bengaluru', foundedYear: 2014, headcountRange: '3,000+', description: 'India\'s leading payments gateway and fintech platform.', website: 'https://razorpay.com' },
  { name: 'Meesho', slug: 'meesho', industry: 'E-Commerce', headquarters: 'Bengaluru', foundedYear: 2015, headcountRange: '2,000+', description: 'Social commerce platform empowering small businesses.', website: 'https://meesho.com' },
  { name: 'Zepto', slug: 'zepto', industry: 'Quick Commerce', headquarters: 'Mumbai', foundedYear: 2021, headcountRange: '5,000+', description: '10-minute grocery delivery startup.', website: 'https://zepto.co' },
  { name: 'TCS', slug: 'tcs', industry: 'IT Services', headquarters: 'Mumbai', foundedYear: 1968, headcountRange: '500,000+', description: 'India\'s largest IT services company.', website: 'https://tcs.com' },
  { name: 'Infosys', slug: 'infosys', industry: 'IT Services', headquarters: 'Bengaluru', foundedYear: 1981, headcountRange: '300,000+', description: 'Global IT consulting and services leader.', website: 'https://infosys.com' },
  { name: 'Wipro', slug: 'wipro', industry: 'IT Services', headquarters: 'Bengaluru', foundedYear: 1945, headcountRange: '200,000+', description: 'Global IT, consulting, and business process services.', website: 'https://wipro.com' },
  { name: 'Accenture', slug: 'accenture', industry: 'Consulting', headquarters: 'Bengaluru', foundedYear: 1989, headcountRange: '500,000+', description: 'Global professional services and consulting firm.', website: 'https://accenture.com' },
  { name: 'Deloitte', slug: 'deloitte', industry: 'Consulting', headquarters: 'Mumbai', foundedYear: 1845, headcountRange: '300,000+', description: 'Global leader in audit, consulting, and advisory.', website: 'https://deloitte.com' },
];

const ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer',
  'Data Scientist', 'ML Engineer', 'Product Manager', 'Engineering Manager',
  'QA Engineer', 'SRE', 'Mobile Developer', 'Data Analyst',
];

const LEVELS = ['L3', 'L4', 'L5', 'L6', 'SDE_I', 'SDE_II', 'SDE_III', 'STAFF', 'PRINCIPAL'];
const LOCATIONS = ['Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'Chennai'];

// Salary ranges by company tier and level (in lakhs)
const SALARY_RANGES: Record<string, Record<string, { base: [number, number]; bonus: [number, number]; stock: [number, number] }>> = {
  faang: {
    L3: { base: [2000000, 3500000], bonus: [200000, 500000], stock: [500000, 2000000] },
    L4: { base: [3000000, 5000000], bonus: [400000, 800000], stock: [1000000, 4000000] },
    L5: { base: [4500000, 7500000], bonus: [600000, 1500000], stock: [2000000, 8000000] },
    L6: { base: [6500000, 10000000], bonus: [1000000, 3000000], stock: [4000000, 15000000] },
    SDE_I: { base: [2000000, 3000000], bonus: [200000, 400000], stock: [300000, 1500000] },
    SDE_II: { base: [3500000, 5500000], bonus: [500000, 900000], stock: [1000000, 4000000] },
    SDE_III: { base: [5000000, 8000000], bonus: [800000, 2000000], stock: [2500000, 8000000] },
    STAFF: { base: [7000000, 12000000], bonus: [1500000, 4000000], stock: [5000000, 20000000] },
    PRINCIPAL: { base: [10000000, 18000000], bonus: [3000000, 6000000], stock: [8000000, 30000000] },
  },
  startup: {
    L3: { base: [1200000, 2000000], bonus: [50000, 200000], stock: [100000, 800000] },
    L4: { base: [1800000, 3000000], bonus: [100000, 400000], stock: [300000, 1500000] },
    L5: { base: [2800000, 4500000], bonus: [200000, 800000], stock: [500000, 3000000] },
    L6: { base: [4000000, 7000000], bonus: [400000, 1500000], stock: [1000000, 5000000] },
    SDE_I: { base: [1000000, 1800000], bonus: [0, 100000], stock: [50000, 500000] },
    SDE_II: { base: [1800000, 3200000], bonus: [100000, 400000], stock: [300000, 1500000] },
    SDE_III: { base: [3000000, 5000000], bonus: [300000, 800000], stock: [500000, 3000000] },
    STAFF: { base: [4500000, 7500000], bonus: [500000, 1500000], stock: [1000000, 5000000] },
    PRINCIPAL: { base: [6000000, 10000000], bonus: [1000000, 3000000], stock: [2000000, 8000000] },
  },
  itservices: {
    L3: { base: [400000, 700000], bonus: [20000, 50000], stock: [0, 0] },
    L4: { base: [700000, 1200000], bonus: [30000, 100000], stock: [0, 0] },
    L5: { base: [1200000, 2000000], bonus: [50000, 200000], stock: [0, 50000] },
    L6: { base: [2000000, 3500000], bonus: [100000, 400000], stock: [0, 100000] },
    SDE_I: { base: [350000, 600000], bonus: [10000, 30000], stock: [0, 0] },
    SDE_II: { base: [600000, 1000000], bonus: [20000, 80000], stock: [0, 0] },
    SDE_III: { base: [1000000, 1800000], bonus: [40000, 150000], stock: [0, 0] },
    STAFF: { base: [1800000, 3000000], bonus: [100000, 300000], stock: [0, 50000] },
    PRINCIPAL: { base: [3000000, 5000000], bonus: [200000, 600000], stock: [0, 200000] },
  },
};

function getCompanyTier(slug: string): string {
  if (['google', 'amazon', 'meta', 'microsoft', 'nvidia', 'apple'].includes(slug)) return 'faang';
  if (['tcs', 'infosys', 'wipro', 'accenture', 'deloitte'].includes(slug)) return 'itservices';
  return 'startup';
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REVIEW_TITLES = [
  'Great place to work', 'Good but demanding', 'Average experience', 'Excellent culture',
  'High pay, high stress', 'Learning opportunities abound', 'Work-life balance could be better',
  'Best company I\'ve worked for', 'Decent for freshers', 'Not what I expected',
  'Amazing team, tough deadlines', 'Good benefits package', 'Innovation at its best',
  'Bureaucratic but stable', 'Fast-paced environment', 'Solid engineering culture',
  'Great for career growth', 'Competitive compensation', 'Politics can be challenging',
  'Would recommend to friends',
];

const PROS = [
  'Excellent compensation and benefits. Stock options are very generous.',
  'Great learning opportunities with access to cutting-edge technology.',
  'Flexible work hours and remote work options available.',
  'Strong engineering culture with code reviews and best practices.',
  'Free meals, gym, and wellness programs.',
  'Diverse and inclusive workplace with supportive colleagues.',
  'Opportunities to work on products used by billions.',
  'Good work-life balance compared to other top companies.',
  'Regular hackathons and innovation time encouraged.',
  'Transparent promotion process with clear leveling criteria.',
];

const CONS = [
  'Can be very demanding during product launches and deadlines.',
  'Internal politics can sometimes affect project decisions.',
  'Work-life balance can suffer during crunch periods.',
  'Promotion cycles are competitive and can be slow.',
  'Too many meetings and layers of approval.',
  'High expectations can lead to burnout if not managed.',
  'Legacy systems still in use in some teams.',
  'Team allocation can be a lottery - depends on luck.',
  'Performance reviews can feel subjective at times.',
  'Rapid organizational changes can be disorienting.',
];

const INTERVIEW_QUESTIONS = [
  'System design: Design a URL shortener like bit.ly with analytics dashboard.',
  'DSA: Given an array of integers, find two numbers that add up to target. Follow-up with sorted array.',
  'Behavioral: Tell me about a time you had to deal with ambiguity in requirements.',
  'System design: Design a notification system that handles millions of users.',
  'DSA: Implement LRU cache with O(1) get and put operations.',
  'Machine coding: Build a real-time chat application with typing indicators.',
  'DSA: Find the longest palindromic substring in a given string.',
  'System design: Design an e-commerce platform like Amazon with cart and checkout.',
  'Behavioral: How do you handle disagreements with team members on technical decisions?',
  'DSA: Binary tree level order traversal with zigzag pattern.',
  'System design: Design a rate limiter for an API gateway.',
  'Machine coding: Implement a spreadsheet with formula support.',
];

const INTERVIEW_TIPS = [
  'Focus on clarifying requirements before jumping into solutions.',
  'Practice system design with real-world scale numbers (QPS, storage, bandwidth).',
  'Be honest about what you don\'t know - interviewers appreciate authenticity.',
  'Write clean, modular code even in interviews. Variable naming matters.',
  'Always discuss trade-offs between different approaches.',
  'Prepare STAR format stories for behavioral rounds.',
  'Ask thoughtful questions about the team and projects at the end.',
  'Time management is key - don\'t spend too long on any single problem.',
];

const POST_TITLES = [
  'What\'s the realistic salary for 3 YOE in Bengaluru?',
  'Google vs Amazon - which is better for career growth?',
  'Is it worth joining a startup at L5 level?',
  'WFH is ending at my company - should I switch?',
  'How to negotiate a counter offer effectively',
  'Share your interview experience at Meta India',
  'Best companies for work-life balance in India',
  'ESOP taxation is a nightmare - help!',
  'Thinking of moving from IT services to product companies',
  'How much should I expect in the annual hike cycle?',
  'Remote work opportunities in Indian tech companies 2025',
  'Is MBA worth it for software engineers?',
  'Tips for system design interviews at FAANG',
  'Switching from backend to ML - is it feasible?',
  'Startup vs MNC for freshers - honest opinions please',
];

const POST_CONTENTS = [
  'I have 3 years of experience as a full-stack developer in Bengaluru. Currently making 18L base. Is this competitive? What should I target for my next switch?',
  'Got offers from both. Google is offering L4 at 45L TC and Amazon is offering SDE-II at 38L TC. Which would you choose considering long-term growth?',
  'Currently at an MNC at L5 level. Got an offer from a Series B startup. The TC is similar but with heavy ESOP component. How do I evaluate this?',
  'My company just announced RTO 5 days. Morale is at an all-time low. Is it the right time to look for remote-first companies?',
  'Got a 40% hike offer from another company. My current company wants to retain me. What\'s the best strategy for negotiation?',
  'Had 5 rounds at Meta Hyderabad for E4 role. Sharing my detailed experience with questions asked in each round.',
  'After 6 years in the industry, I\'ve realized WLB matters more than TC. Which companies in India truly offer good WLB?',
  'My startup gave me ESOPs and now they\'re doing a secondary sale. The tax implications are insane. Any CA recommendations?',
  'Been at TCS for 4 years. Want to move to a product company. What skills should I focus on and which companies should I target?',
  'Annual reviews coming up. Last year got 8% hike which barely covered inflation. What\'s the average in the market right now?',
  'Looking for companies that offer permanent remote work in India. No hybrid, no occasional office visits. Fully remote. Drop suggestions!',
  'I\'m a SDE-III with 8 YOE considering an MBA from ISB. Will it help transition to product management at a FAANG company?',
  'Preparing for Google system design round. What resources and practice problems would you recommend?',
  'Currently a backend engineer with 5 YOE. Want to transition to ML engineering. What\'s the most practical path?',
  'Just graduated from a tier-2 college. Got offers from TCS (4.5L) and a seed-stage startup (8L + ESOPs). What should I pick?',
];

const CATEGORIES = ['general', 'salary', 'interview', 'wlb', 'career', 'rant'] as const;

async function main() {
  console.log('🌱 Seeding TalentDash database...\n');

  // Clean existing data
  await prisma.communityComment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.userContribution.deleteMany();
  await prisma.companyComparison.deleteMany();
  await prisma.workplaceIndex.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.review.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.company.deleteMany();

  console.log('  ✓ Cleaned existing data');

  // Create companies
  const companies = await Promise.all(
    COMPANIES.map((c) =>
      prisma.company.create({
        data: {
          name: c.name,
          slug: c.slug,
          normalizedName: c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          industry: c.industry,
          headquarters: c.headquarters,
          foundedYear: c.foundedYear,
          headcountRange: c.headcountRange,
          description: c.description,
          website: c.website,
        },
      })
    )
  );
  console.log(`  ✓ Created ${companies.length} companies`);

  // Create salaries (500+)
  let salaryCount = 0;
  for (const company of companies) {
    const tier = getCompanyTier(company.slug);
    const ranges = SALARY_RANGES[tier];
    const numSalaries = tier === 'faang' ? rand(50, 70) : tier === 'startup' ? rand(25, 40) : rand(20, 35);

    for (let i = 0; i < numSalaries; i++) {
      const level = pick(LEVELS);
      const range = ranges[level];
      const base = rand(range.base[0], range.base[1]);
      const bonus = rand(range.bonus[0], range.bonus[1]);
      const stock = rand(range.stock[0], range.stock[1]);
      const expMap: Record<string, [number, number]> = {
        L3: [0, 3], SDE_I: [0, 2], L4: [2, 5], SDE_II: [2, 5],
        L5: [4, 8], SDE_III: [4, 8], L6: [6, 12], STAFF: [8, 15], PRINCIPAL: [12, 25],
      };
      const exp = rand(expMap[level][0], expMap[level][1]);

      await prisma.salary.create({
        data: {
          companyId: company.id,
          role: pick(ROLES),
          level,
          location: pick(LOCATIONS),
          currency: 'INR',
          experienceYears: exp,
          baseSalary: base,
          bonus,
          stock,
          totalCompensation: base + bonus + stock,
          source: pick(['user_submitted', 'verified', 'linkedin']),
          confidenceScore: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
          isVerified: Math.random() > 0.6,
          submittedAt: new Date(Date.now() - rand(0, 365) * 86400000),
        },
      });
      salaryCount++;
    }
  }
  console.log(`  ✓ Created ${salaryCount} salary records`);

  // Create reviews (100+)
  let reviewCount = 0;
  for (const company of companies) {
    const numReviews = rand(6, 12);
    for (let i = 0; i < numReviews; i++) {
      const overallRating = Math.round((2 + Math.random() * 3) * 10) / 10;
      await prisma.review.create({
        data: {
          companyId: company.id,
          title: pick(REVIEW_TITLES),
          pros: pick(PROS),
          cons: pick(CONS),
          rating: overallRating,
          workLifeBalance: Math.round((1.5 + Math.random() * 3.5) * 10) / 10,
          culture: Math.round((2 + Math.random() * 3) * 10) / 10,
          growth: Math.round((1.5 + Math.random() * 3.5) * 10) / 10,
          compensation: Math.round((2 + Math.random() * 3) * 10) / 10,
          anonymousRole: pick(ROLES),
          isApproved: Math.random() > 0.2,
          submittedAt: new Date(Date.now() - rand(0, 365) * 86400000),
        },
      });
      reviewCount++;
    }
  }
  console.log(`  ✓ Created ${reviewCount} reviews`);

  // Create interviews (100+)
  let interviewCount = 0;
  for (const company of companies) {
    const numInterviews = rand(6, 12);
    for (let i = 0; i < numInterviews; i++) {
      await prisma.interview.create({
        data: {
          companyId: company.id,
          role: pick(ROLES),
          difficulty: pick(['Easy', 'Medium', 'Hard', 'Very Hard']),
          rounds: rand(2, 6),
          questions: pick(INTERVIEW_QUESTIONS),
          result: pick(['Selected', 'Rejected', 'No Response', 'Ghosted']),
          tips: Math.random() > 0.3 ? pick(INTERVIEW_TIPS) : null,
          isApproved: Math.random() > 0.15,
          submittedAt: new Date(Date.now() - rand(0, 365) * 86400000),
        },
      });
      interviewCount++;
    }
  }
  console.log(`  ✓ Created ${interviewCount} interview experiences`);

  // Create workplace indices
  for (const company of companies) {
    const tier = getCompanyTier(company.slug);
    const baseScore = tier === 'faang' ? 3.5 : tier === 'startup' ? 3.0 : 2.5;
    const variance = () => Math.round((baseScore + (Math.random() - 0.3) * 1.5) * 10) / 10;
    const scores = {
      cultureScore: Math.min(5, Math.max(1, variance())),
      compensationScore: Math.min(5, Math.max(1, variance())),
      growthScore: Math.min(5, Math.max(1, variance())),
      diversityScore: Math.min(5, Math.max(1, variance())),
      remoteScore: Math.min(5, Math.max(1, variance())),
    };
    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5 * 10) / 10;

    await prisma.workplaceIndex.create({
      data: {
        companyId: company.id,
        ...scores,
        overallScore: overall,
      },
    });
  }
  console.log(`  ✓ Created ${companies.length} workplace indices`);

  // Create community posts
  const posts = [];
  for (let i = 0; i < POST_TITLES.length; i++) {
    const post = await prisma.communityPost.create({
      data: {
        title: POST_TITLES[i],
        content: POST_CONTENTS[i],
        category: pick(CATEGORIES),
        authorTag: pick(['SDE @ FAANG', 'PM @ Startup', 'Anonymous', 'SDE-II @ Flipkart', 'Fresher', 'Staff Eng @ Google', '8 YOE Backend', 'Data Scientist']),
        upvotes: rand(5, 200),
        downvotes: rand(0, 20),
        createdAt: new Date(Date.now() - rand(0, 90) * 86400000),
      },
    });
    posts.push(post);
  }
  console.log(`  ✓ Created ${posts.length} community posts`);

  // Create comments on posts
  const COMMENTS = [
    'This is a great question. Based on my experience, I would say...',
    'I was in a similar situation last year. Here\'s what I did.',
    'The market is crazy right now. Companies are paying well above these numbers.',
    'Don\'t forget to factor in ESOPs and RSUs when comparing total compensation.',
    'I would strongly recommend focusing on growth over compensation early in your career.',
    'This is very company and team specific. YMMV.',
    'Agreed with this. The work-life balance at my current company is much better.',
    'Hot take: WFH is overrated. Office has better collaboration.',
    'As someone who switched from services to product, best decision of my life.',
    'The hike percentage doesn\'t matter as much as the absolute number.',
  ];

  let commentCount = 0;
  for (const post of posts) {
    const numComments = rand(2, 8);
    for (let j = 0; j < numComments; j++) {
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          content: pick(COMMENTS),
          authorTag: pick(['Anonymous', 'SDE @ Google', 'PM', 'SDE-III', 'Fresher', 'Tech Lead']),
          upvotes: rand(0, 50),
          createdAt: new Date(Date.now() - rand(0, 60) * 86400000),
        },
      });
      commentCount++;
    }
  }
  console.log(`  ✓ Created ${commentCount} comments`);

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
