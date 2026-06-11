// Candidate status model — the platform's core ranking dimension.
// Tier order is a non-negotiable platform rule: Caymanian → PR → RERC →
// Dependant → Overseas, enforced at query level in every employer search.

export const CANDIDATE_STATUSES = ["caymanian", "pr", "rerc", "dependant", "overseas"];

// Lower tier = higher priority in employer searches.
export const STATUS_TIERS = {
  caymanian: 1,
  pr: 2,
  rerc: 3,
  dependant: 4,
  overseas: 5,
};

export const STATUS_LABELS = {
  caymanian: "Caymanian",
  pr: "Permanent Resident",
  rerc: "RERC holder",
  dependant: "Dependant permit",
  overseas: "Overseas / work permit required",
};

// Short badge text shown on candidate cards.
export const STATUS_BADGES = {
  caymanian: "Caymanian",
  pr: "No sponsorship required",
  rerc: "No sponsorship required",
  dependant: "Dependant permit",
  overseas: "Requires sponsorship",
};

export function isValidStatus(status) {
  return CANDIDATE_STATUSES.includes(status);
}

// SQL CASE fragment value for ORDER BY — kept here so search queries and
// any future native-posting matching rank identically.
export function statusTier(status) {
  return STATUS_TIERS[status] || 99;
}
