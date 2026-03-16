import { neon } from "@neondatabase/serverless";

// Common skill patterns to extract from CISCO description + tasks text
const SKILL_PATTERNS = [
  // Finance & Compliance
  { pattern: /\b(financial analysis|financial reporting|financial modelling)\b/gi, name: "Financial Analysis", category: "Finance" },
  { pattern: /\b(aml|anti-money laundering)\b/gi, name: "AML/Anti-Money Laundering", category: "Compliance" },
  { pattern: /\b(kyc|know your customer)\b/gi, name: "KYC", category: "Compliance" },
  { pattern: /\b(compliance|regulatory compliance)\b/gi, name: "Regulatory Compliance", category: "Compliance" },
  { pattern: /\b(audit|auditing)\b/gi, name: "Auditing", category: "Finance" },
  { pattern: /\baccounting\b/gi, name: "Accounting", category: "Finance" },
  { pattern: /\btax(ation)?\b/gi, name: "Taxation", category: "Finance" },
  { pattern: /\b(risk management|risk assessment)\b/gi, name: "Risk Management", category: "Finance" },
  { pattern: /\b(investment|portfolio management)\b/gi, name: "Investment Management", category: "Finance" },
  { pattern: /\b(fund administration|fund accounting)\b/gi, name: "Fund Administration", category: "Finance" },
  { pattern: /\binsurance\b/gi, name: "Insurance", category: "Finance" },
  { pattern: /\bbanking\b/gi, name: "Banking", category: "Finance" },

  // Legal
  { pattern: /\b(corporate law|legal)\b/gi, name: "Corporate Law", category: "Legal" },
  { pattern: /\b(contracts|contract management)\b/gi, name: "Contract Management", category: "Legal" },
  { pattern: /\b(intellectual property|patents)\b/gi, name: "Intellectual Property", category: "Legal" },

  // Technology
  { pattern: /\b(software development|programming|coding)\b/gi, name: "Software Development", category: "Technology" },
  { pattern: /\b(web development|web design)\b/gi, name: "Web Development", category: "Technology" },
  { pattern: /\b(database|sql|data management)\b/gi, name: "Database Management", category: "Technology" },
  { pattern: /\b(network|networking|network administration)\b/gi, name: "Network Administration", category: "Technology" },
  { pattern: /\b(cybersecurity|information security|it security)\b/gi, name: "Cybersecurity", category: "Technology" },
  { pattern: /\b(cloud computing|cloud services)\b/gi, name: "Cloud Computing", category: "Technology" },
  { pattern: /\b(data analysis|data analytics|data science)\b/gi, name: "Data Analytics", category: "Technology" },
  { pattern: /\b(artificial intelligence|machine learning)\b/gi, name: "AI/Machine Learning", category: "Technology" },
  { pattern: /\b(system administration|systems admin)\b/gi, name: "Systems Administration", category: "Technology" },
  { pattern: /\b(it support|technical support|helpdesk)\b/gi, name: "IT Support", category: "Technology" },

  // Management & Business
  { pattern: /\bproject management\b/gi, name: "Project Management", category: "Management" },
  { pattern: /\b(people management|team management|leadership)\b/gi, name: "Team Leadership", category: "Management" },
  { pattern: /\bstrategic planning\b/gi, name: "Strategic Planning", category: "Management" },
  { pattern: /\b(budgeting|budget management)\b/gi, name: "Budgeting", category: "Management" },
  { pattern: /\boperations management\b/gi, name: "Operations Management", category: "Management" },
  { pattern: /\b(quality assurance|quality control)\b/gi, name: "Quality Assurance", category: "Management" },
  { pattern: /\b(supply chain|procurement|purchasing)\b/gi, name: "Supply Chain/Procurement", category: "Management" },
  { pattern: /\b(business development|business strategy)\b/gi, name: "Business Development", category: "Management" },

  // Marketing & Communications
  { pattern: /\b(marketing|digital marketing)\b/gi, name: "Marketing", category: "Marketing" },
  { pattern: /\b(social media|content creation)\b/gi, name: "Social Media/Content", category: "Marketing" },
  { pattern: /\b(public relations|communications)\b/gi, name: "Communications/PR", category: "Marketing" },
  { pattern: /\b(brand|branding)\b/gi, name: "Brand Management", category: "Marketing" },
  { pattern: /\b(advertising|media buying)\b/gi, name: "Advertising", category: "Marketing" },
  { pattern: /\b(graphic design|visual design)\b/gi, name: "Graphic Design", category: "Marketing" },

  // Human Resources
  { pattern: /\b(human resources|hr management)\b/gi, name: "Human Resources", category: "HR" },
  { pattern: /\b(recruitment|talent acquisition)\b/gi, name: "Recruitment", category: "HR" },
  { pattern: /\b(training|employee development)\b/gi, name: "Training & Development", category: "HR" },
  { pattern: /\b(payroll|compensation)\b/gi, name: "Payroll/Compensation", category: "HR" },

  // Healthcare
  { pattern: /\b(patient care|healthcare|medical)\b/gi, name: "Healthcare/Medical", category: "Healthcare" },
  { pattern: /\bnursing\b/gi, name: "Nursing", category: "Healthcare" },
  { pattern: /\bpharmac(y|eutical)\b/gi, name: "Pharmacy/Pharmaceuticals", category: "Healthcare" },

  // Hospitality & Tourism
  { pattern: /\b(hospitality|hotel management)\b/gi, name: "Hospitality Management", category: "Hospitality" },
  { pattern: /\b(food service|catering|culinary)\b/gi, name: "Culinary/Food Service", category: "Hospitality" },
  { pattern: /\b(tourism|travel)\b/gi, name: "Tourism/Travel", category: "Hospitality" },
  { pattern: /\bcustomer service\b/gi, name: "Customer Service", category: "Hospitality" },

  // Construction & Engineering
  { pattern: /\b(construction|building)\b/gi, name: "Construction", category: "Construction" },
  { pattern: /\b(civil engineering|structural)\b/gi, name: "Civil Engineering", category: "Engineering" },
  { pattern: /\b(electrical|electronics)\b/gi, name: "Electrical Engineering", category: "Engineering" },
  { pattern: /\b(mechanical engineering|machinery)\b/gi, name: "Mechanical Engineering", category: "Engineering" },
  { pattern: /\b(architecture|architectural)\b/gi, name: "Architecture", category: "Engineering" },

  // Education
  { pattern: /\b(teaching|education|instruction)\b/gi, name: "Teaching/Education", category: "Education" },
  { pattern: /\b(curriculum|lesson planning)\b/gi, name: "Curriculum Development", category: "Education" },

  // General Skills
  { pattern: /\b(negotiation|conflict resolution)\b/gi, name: "Negotiation", category: "General" },
  { pattern: /\b(presentation|public speaking)\b/gi, name: "Presentation Skills", category: "General" },
  { pattern: /\b(research|analysis)\b/gi, name: "Research & Analysis", category: "General" },
  { pattern: /\b(report writing|documentation)\b/gi, name: "Report Writing", category: "General" },
  { pattern: /\b(microsoft office|excel|spreadsheet)\b/gi, name: "Microsoft Office/Excel", category: "General" },
  { pattern: /\bhealth and safety\b/gi, name: "Health & Safety", category: "General" },
  { pattern: /\b(environmental|sustainability)\b/gi, name: "Environmental/Sustainability", category: "General" },
];

async function seedSkills() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Fetching CISCO units...");
  const ciscoUnits = await sql`SELECT cisco_code, title, description, tasks FROM cisco_units WHERE LENGTH(cisco_code) = 4`;
  console.log(`Found ${ciscoUnits.length} CISCO units.\n`);

  // Track unique skills
  const skillMap = new Map(); // name -> { name, category }
  const ciscoSkillPairs = []; // [cisco_code, skill_name]

  for (const unit of ciscoUnits) {
    const text = `${unit.title || ""} ${unit.description || ""} ${unit.tasks || ""}`;

    for (const { pattern, name, category } of SKILL_PATTERNS) {
      // Reset regex
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        if (!skillMap.has(name)) {
          skillMap.set(name, { name, category });
        }
        ciscoSkillPairs.push([unit.cisco_code, name]);
      }
    }
  }

  console.log(`Extracted ${skillMap.size} unique skills from CISCO text.\n`);

  // Insert skills
  console.log("Inserting skills...");
  const skillIdMap = new Map(); // name -> id
  for (const [name, { category }] of skillMap) {
    const rows = await sql`
      INSERT INTO skills (name, category)
      VALUES (${name}, ${category})
      ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
      RETURNING id
    `;
    skillIdMap.set(name, rows[0].id);
  }
  console.log(`  ${skillIdMap.size} skills inserted.\n`);

  // Insert cisco_skills mappings
  console.log("Inserting CISCO-skill mappings...");
  const seen = new Set();
  let mappingCount = 0;
  for (const [ciscoCode, skillName] of ciscoSkillPairs) {
    const key = `${ciscoCode}:${skillName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const skillId = skillIdMap.get(skillName);
    if (!skillId) continue;

    await sql`
      INSERT INTO cisco_skills (cisco_code, skill_id)
      VALUES (${ciscoCode}, ${skillId})
      ON CONFLICT DO NOTHING
    `;
    mappingCount++;
  }
  console.log(`  ${mappingCount} mappings inserted.\n`);

  console.log("Skills seeding complete!");
}

seedSkills().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
