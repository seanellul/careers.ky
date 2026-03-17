export function calcProfileStrength(candidate, interests, skills) {
  let score = 0;
  const items = [];
  if (candidate.name) { score += 10; } else { items.push("Add your name"); }
  if (candidate.bio) { score += 10; } else { items.push("Write a bio"); }
  if (candidate.education_code) { score += 9; } else { items.push("Set education level"); }
  if (candidate.experience_code) { score += 9; } else { items.push("Set experience level"); }
  if (candidate.location_code) { score += 7; } else { items.push("Set your location"); }
  if (interests.length > 0) { score += 12; } else { items.push("Add career interests"); }
  if (skills.length > 0) { score += 12; } else { items.push("Add skills"); }
  if (candidate.is_discoverable) { score += 6; } else { items.push("Make profile discoverable"); }
  if (candidate.salary_min) { score += 5; } else { items.push("Add minimum salary expectation"); }
  if (candidate.work_type_preferences?.length > 0) { score += 4; } else { items.push("Set work type preferences"); }
  if (candidate.linkedin_url) { score += 5; } else { items.push("Add LinkedIn URL"); }
  if (candidate.headline) { score += 4; } else { items.push("Add a headline"); }
  if (candidate.profile_picture_url) { score += 4; } else { items.push("Add a profile picture"); }
  if (candidate.phone) { score += 2; } else { items.push("Add phone number"); }
  if (candidate.portfolio_url) { score += 1; }
  return { score: Math.min(score, 100), missing: items };
}
