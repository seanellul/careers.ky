// Predefined perks/benefits with categories and icons (Lucide icon names)

export const PERK_CATEGORIES = [
  { id: "health", label: "Health & Wellness", icon: "Heart" },
  { id: "financial", label: "Financial", icon: "DollarSign" },
  { id: "lifestyle", label: "Lifestyle", icon: "Sun" },
  { id: "growth", label: "Growth & Development", icon: "GraduationCap" },
  { id: "family", label: "Family", icon: "Baby" },
  { id: "office", label: "Office & Environment", icon: "Building2" },
];

export const PREDEFINED_PERKS = [
  // Health
  { id: "health_insurance", label: "Health Insurance", category: "health" },
  { id: "dental_insurance", label: "Dental Insurance", category: "health" },
  { id: "vision_insurance", label: "Vision Insurance", category: "health" },
  { id: "gym_membership", label: "Gym Membership", category: "health" },
  { id: "mental_health", label: "Mental Health Support", category: "health" },

  // Financial
  { id: "pension", label: "Pension Plan", category: "financial" },
  { id: "performance_bonus", label: "Performance Bonus", category: "financial" },
  { id: "stock_options", label: "Stock Options / Equity", category: "financial" },
  { id: "relocation", label: "Relocation Assistance", category: "financial" },
  { id: "housing_allowance", label: "Housing Allowance", category: "financial" },

  // Lifestyle
  { id: "remote_work", label: "Remote Work", category: "lifestyle" },
  { id: "flexible_hours", label: "Flexible Hours", category: "lifestyle" },
  { id: "unlimited_pto", label: "Unlimited PTO", category: "lifestyle" },
  { id: "generous_pto", label: "Generous PTO", category: "lifestyle" },
  { id: "company_car", label: "Company Car", category: "lifestyle" },

  // Growth
  { id: "training_budget", label: "Training Budget", category: "growth" },
  { id: "conference_budget", label: "Conference Budget", category: "growth" },
  { id: "tuition_reimbursement", label: "Tuition Reimbursement", category: "growth" },
  { id: "mentorship", label: "Mentorship Program", category: "growth" },
  { id: "career_pathing", label: "Career Pathing", category: "growth" },

  // Family
  { id: "parental_leave", label: "Parental Leave", category: "family" },
  { id: "childcare", label: "Childcare Support", category: "family" },
  { id: "family_insurance", label: "Family Health Coverage", category: "family" },

  // Office
  { id: "free_lunch", label: "Free Lunch / Snacks", category: "office" },
  { id: "modern_office", label: "Modern Office", category: "office" },
  { id: "team_events", label: "Team Events", category: "office" },
];

// Resolve a stored benefit (either { id } or { id: "custom", label, category }) to full perk info
export function resolvePerk(benefit) {
  if (benefit.id === "custom") {
    return { ...benefit, isCustom: true };
  }
  const predefined = PREDEFINED_PERKS.find((p) => p.id === benefit.id);
  return predefined || { id: benefit.id, label: benefit.id, category: "office", isCustom: false };
}

// Resolve an array of stored benefits to full perk objects
export function resolvePerks(benefits) {
  if (!Array.isArray(benefits)) return [];
  return benefits.map(resolvePerk);
}

// Group resolved perks by category
export function groupPerksByCategory(perks) {
  const grouped = {};
  for (const cat of PERK_CATEGORIES) {
    grouped[cat.id] = { ...cat, perks: [] };
  }
  for (const perk of perks) {
    const catId = perk.category || "office";
    if (!grouped[catId]) grouped[catId] = { id: catId, label: catId, icon: "Star", perks: [] };
    grouped[catId].perks.push(perk);
  }
  // Filter out empty categories
  return Object.values(grouped).filter((g) => g.perks.length > 0);
}
