type TransactionSearchFieldType =
  "TITLE" | "CATEGORY" | "HOUSE" | "DESCRIPTION" | "TYPE" | "OTHER";

export interface MatchScoreResult {
  matchedTermsCount: number;
  totalScore: number;
}

export interface SearchableField {
  type: TransactionSearchFieldType;
  value: string;
}
