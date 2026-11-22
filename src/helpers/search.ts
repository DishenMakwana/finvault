import { MatchScoreResult, SearchableField } from "@/types/search.types";

const TRANSACTION_FIELD_WEIGHTS = {
  TITLE: 10,
  CATEGORY: 8,
  HOUSE: 6,
  DESCRIPTION: 4,
  TYPE: 3,
  OTHER: 1,
};

/**
 * Strips non-alphanumeric characters (slashes, dashes, spaces, underscores, periods)
 * e.g., "12345/67-A" -> "1234567a"
 */
function cleanAlphanumeric(text: string): string {
  if (!text) return "";
  return text.replace(/[\/\-\s,._]/g, "").toLowerCase();
}

/**
 * Extracts normalized search tokens
 */
export function getSearchTokens(query: string): string[] {
  if (!query) return [];
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

/**
 * 2-row Levenshtein distance using Int32Array (O(min(N, M)) memory)
 */
function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  let a = s1;
  let b = s2;
  if (a.length > b.length) {
    a = s2;
    b = s1;
  }

  const aLen = a.length;
  const bLen = b.length;
  const row = new Int32Array(aLen + 1);

  for (let i = 0; i <= aLen; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= bLen; i++) {
    let prev = row[0];
    row[0] = i;
    const bChar = b.charCodeAt(i - 1);

    for (let j = 1; j <= aLen; j++) {
      const temp = row[j];
      const cost = a.charCodeAt(j - 1) === bChar ? 0 : 1;
      row[j] = Math.min(
        row[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        prev + cost // substitution
      );
      prev = temp;
    }
  }

  return row[aLen];
}

/**
 * 4-Tier Waterfall Scorer for a single query token against a candidate word:
 * Tier 1: Exact Match (Score = 1.0)
 * Tier 2: Prefix Match (Score = 0.8 * (term.length / word.length))
 * Tier 3: Substring Match (Score = 0.6 * (term.length / word.length))
 * Tier 4: Typo Tolerance / Fuzzy Match (Score = 0.4 * (1 - distance / maxLen))
 */
function scoreTermAgainstWord(term: string, word: string): number {
  if (!term || !word) return 0;
  if (term === word) return 1.0; // Tier 1: Exact match

  const tLen = term.length;
  const wLen = word.length;

  // Tier 2: Prefix match
  if (word.startsWith(term)) {
    return 0.8 * (tLen / wLen);
  }

  // Tier 3: Substring match
  if (word.includes(term)) {
    return 0.6 * (tLen / wLen);
  }

  // Tier 4: Typo tolerance / Fuzzy match (length >= 3)
  if (tLen >= 3) {
    const maxAllowedDistance = tLen === 3 ? 1 : 2;
    if (Math.abs(tLen - wLen) <= maxAllowedDistance) {
      const distance = levenshteinDistance(term, word);
      if (distance <= maxAllowedDistance) {
        const maxLen = Math.max(tLen, wLen);
        return 0.4 * (1 - distance / maxLen);
      }
    }
  }

  return 0;
}

/**
 * Evaluates candidate transaction against search tokens across all weighted fields
 */
export function scoreTransactionAgainstTokens(
  fields: SearchableField[],
  tokens: string[]
): MatchScoreResult {
  if (tokens.length === 0) return { matchedTermsCount: 0, totalScore: 0 };

  let totalScore = 0;
  let matchedTermsCount = 0;

  for (const token of tokens) {
    let bestScoreForToken = 0;

    for (const field of fields) {
      if (!field.value) continue;
      const weight = TRANSACTION_FIELD_WEIGHTS[field.type] || 1;

      // Sanitized alphanumeric check (e.g. folio numbers, codes)
      const cleanField = cleanAlphanumeric(field.value);
      const cleanToken = cleanAlphanumeric(token);
      if (cleanToken && cleanField) {
        const sanitizedScore = scoreTermAgainstWord(cleanToken, cleanField);
        if (sanitizedScore > 0) {
          bestScoreForToken = Math.max(
            bestScoreForToken,
            sanitizedScore * weight
          );
        }
      }

      // Word-level evaluation
      const words = field.value
        .toLowerCase()
        .split(/[\s,.\-_/]+/)
        .filter(Boolean);
      for (const word of words) {
        const wordScore = scoreTermAgainstWord(token, word);
        if (wordScore > 0) {
          bestScoreForToken = Math.max(bestScoreForToken, wordScore * weight);
        }
      }
    }

    if (bestScoreForToken > 0) {
      matchedTermsCount++;
      totalScore += bestScoreForToken;
    }
  }

  return { matchedTermsCount, totalScore };
}
