/**
 * Mutual Compatibility Calculation Engine for Cupid Rounds
 * Evaluates Male details against Female preferences AND Female details against Male preferences.
 * Takes into account Non-Negotiables, Questionnaire Responses (Q1-15 details, Q16+ preferences),
 * and computes a 0-100% compatibility score.
 */

export const calculateCompatibilityScore = (userA, userB) => {
  if (!userA || !userB) return 75;

  // Directional evaluation: How well B matches A's preferences
  const scoreAtoB = evaluateDirectionalScore(userA, userB);
  // Directional evaluation: How well A matches B's preferences
  const scoreBtoA = evaluateDirectionalScore(userB, userA);

  // Non-negotiables penalties
  const penaltyA = evaluateNonNegotiablesPenalty(userA, userB);
  const penaltyB = evaluateNonNegotiablesPenalty(userB, userA);

  const rawAverage = (scoreAtoB + scoreBtoA) / 2;
  const finalScore = Math.max(62, Math.min(99, Math.round(rawAverage - penaltyA - penaltyB)));

  return finalScore;
};

const evaluateDirectionalScore = (seeker, candidate) => {
  let score = 45; // Base score
  const pref = seeker.preferences || {};

  // 1. Age Range (+15)
  if (candidate.age && pref.prefMinAge && pref.prefMaxAge) {
    if (candidate.age >= pref.prefMinAge && candidate.age <= pref.prefMaxAge) {
      score += 15;
    } else if (Math.abs(candidate.age - pref.prefMinAge) <= 2 || Math.abs(candidate.age - pref.prefMaxAge) <= 2) {
      score += 8;
    }
  } else {
    score += 10;
  }

  // 2. University (+10)
  if (pref.prefUniversity && Array.isArray(pref.prefUniversity)) {
    if (pref.prefUniversity.includes('Any University') || pref.prefUniversity.includes('Any') || pref.prefUniversity.includes(candidate.university)) {
      score += 10;
    }
  } else {
    score += 8;
  }

  // 3. Branch (+8)
  if (pref.prefBranch) {
    if (pref.prefBranch === 'Any Branch' || pref.prefBranch === 'Any' || pref.prefBranch === candidate.branch) {
      score += 8;
    }
  } else {
    score += 5;
  }

  // 4. Religion (+7)
  if (pref.prefReligion && Array.isArray(pref.prefReligion)) {
    if (pref.prefReligion.includes('Any') || pref.prefReligion.includes(candidate.religion)) {
      score += 7;
    }
  } else {
    score += 5;
  }

  // 5. Relationship Type (+8)
  if (seeker.relationshipType && candidate.relationshipType) {
    const seekerRel = Array.isArray(seeker.relationshipType) ? seeker.relationshipType : [seeker.relationshipType];
    const candidateRel = Array.isArray(candidate.relationshipType) ? candidate.relationshipType : [candidate.relationshipType];
    const hasOverlap = seekerRel.some(r => candidateRel.includes(r));
    if (hasOverlap) score += 8;
  } else {
    score += 5;
  }

  // 6. Personality Harmony (+7)
  if (pref.prefPersonality) {
    if (pref.prefPersonality === 'Any' || pref.prefPersonality === candidate.personalityType) {
      score += 7;
    }
  } else {
    score += 5;
  }

  // 7. Qualities Overlap (+10)
  if (pref.prefQualities && candidate.qualities) {
    const prefQ = Array.isArray(pref.prefQualities) ? pref.prefQualities : [];
    const candQ = Array.isArray(candidate.qualities) ? candidate.qualities : [];
    const shared = prefQ.filter(q => candQ.includes(q));
    if (prefQ.length > 0) {
      score += Math.min(10, Math.round((shared.length / prefQ.length) * 10));
    } else {
      score += 5;
    }
  } else {
    score += 5;
  }

  // 8. Dating Vibe Overlap (+10)
  if (pref.prefDatingVibe && candidate.datingVibe) {
    const prefV = Array.isArray(pref.prefDatingVibe) ? pref.prefDatingVibe : [];
    const candV = Array.isArray(candidate.datingVibe) ? candidate.datingVibe : [];
    const sharedV = prefV.filter(v => candV.includes(v));
    if (prefV.length > 0) {
      score += Math.min(10, Math.round((sharedV.length / prefV.length) * 10));
    } else {
      score += 5;
    }
  } else {
    score += 5;
  }

  return score;
};

const evaluateNonNegotiablesPenalty = (seeker, candidate) => {
  let penalty = 0;
  const nonNeg = seeker.nonNegotiables || [];
  const pref = seeker.preferences || {};

  if (nonNeg.includes('Preferred Age') && candidate.age && pref.prefMinAge && pref.prefMaxAge) {
    if (candidate.age < pref.prefMinAge || candidate.age > pref.prefMaxAge) {
      penalty += 15;
    }
  }

  if (nonNeg.includes('Preferred Religion') && candidate.religion && pref.prefReligion) {
    const religions = Array.isArray(pref.prefReligion) ? pref.prefReligion : [pref.prefReligion];
    if (!religions.includes('Any') && !religions.includes(candidate.religion)) {
      penalty += 15;
    }
  }

  if (nonNeg.includes('Preferred University') && candidate.university && pref.prefUniversity) {
    const unis = Array.isArray(pref.prefUniversity) ? pref.prefUniversity : [pref.prefUniversity];
    if (!unis.includes('Any University') && !unis.includes('Any') && !unis.includes(candidate.university)) {
      penalty += 12;
    }
  }

  return penalty;
};
