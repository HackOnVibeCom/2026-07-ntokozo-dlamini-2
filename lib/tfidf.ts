export interface StrategyDoc {
  id: string;
  category: string;
  content: string;
}

const STOP_WORDS = new Set([
  "is",
  "the",
  "to",
  "and",
  "in",
  "of",
  "a",
  "from",
  "when",
  "does",
  "not",
  "must",
  "with",
  "for",
  "on",
  "by",
  "an",
  "or",
  "as",
  "at",
  "be",
  "this",
  "that",
  "it",
  "by",
  "you",
  "your",
  "we",
  "our",
  "their",
  "will",
  "can",
  "if",
  "then",
  "else",
  "but",
  "so",
  "up",
  "out",
  "about",
  "into",
  "over",
  "after",
  "before",
  "during",
  "while",
  "since",
  "until",
  "between",
  "among",
  "through",
  "against",
  "without",
  "within",
  "under",
  "above",
  "below",
  "around",
  "between",
  "across",
  "behind",
  "beyond",
  "except",
  "toward",
  "towards",
  "upon",
  "via",
  "per",
  "plus",
  "minus",
  "times",
  "divided",
  "equals",
  "equal",
  "greater",
  "less",
  "than",
  "more",
  "most",
  "least",
  "few",
  "many",
  "much",
  "little",
  "some",
  "any",
  "all",
  "each",
  "every",
  "either",
  "neither",
  "both",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "first",
  "second",
  "third",
  "last",
  "next",
  "previous",
  "other",
  "another",
  "such",
  "same",
  "different",
  "own",
  "self",
  "selves",
  "itself",
  "themselves",
  "myself",
  "yourself",
  "yourselves",
  "ourselves",
  "himself",
  "herself",
  "itself",
  "themselves",
  "myself",
  "yourself",
  "yourselves",
  "ourselves",
  "himself",
  "herself",
  "itself",
]);

function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export class OfflineTFIDFEngine {
  private docs: StrategyDoc[] = [];
  private vocab: string[] = [];
  private vocabIndexMap: Map<string, number> = new Map();
  private idfMap: Map<string, number> = new Map();
  private docVectors: Map<string, number[]> = new Map();

  constructor(documents: StrategyDoc[]) {
    this.docs = documents;
    this.buildIndex();
  }

  private buildIndex() {
    const documentCount = this.docs.length;
    const documentFrequencies: Map<string, number> = new Map();
    const tokenizedDocs = this.docs.map((doc) => {
      const tokens = tokenizeText(doc.content);
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach((t) => {
        documentFrequencies.set(t, (documentFrequencies.get(t) || 0) + 1);
      });
      return { id: doc.id, tokens };
    });

    const uniqueVocabulary = new Set<string>();
    documentFrequencies.forEach((count, term) => {
      uniqueVocabulary.add(term);
      const idfValue = Math.log((documentCount + 1) / (count + 1)) + 1.0;
      this.idfMap.set(term, idfValue);
    });

    this.vocab = Array.from(uniqueVocabulary);
    this.vocab.forEach((term, index) => {
      this.vocabIndexMap.set(term, index);
    });

    tokenizedDocs.forEach((doc) => {
      const vector = new Array(this.vocab.length).fill(0);
      const termCounts: Map<string, number> = new Map();
      doc.tokens.forEach((t) => termCounts.set(t, (termCounts.get(t) || 0) + 1));

      termCounts.forEach((count, term) => {
        const wordIndex = this.vocabIndexMap.get(term);
        if (wordIndex !== undefined) {
          const tf = count / doc.tokens.length;
          const idf = this.idfMap.get(term) || 0;
          vector[wordIndex] = tf * idf;
        }
      });

      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      const normalizedVector = norm === 0 ? vector : vector.map((v) => v / norm);
      this.docVectors.set(doc.id, normalizedVector);
    });
  }

  public findSimilar(query: string, limit: number = 1): StrategyDoc[] {
    const queryTokens = tokenizeText(query);
    if (queryTokens.length === 0 || this.docs.length === 0) {
      return this.docs.slice(0, limit);
    }

    const queryVector = new Array(this.vocab.length).fill(0);
    const queryTermCounts: Map<string, number> = new Map();
    queryTokens.forEach((t) => queryTermCounts.set(t, (queryTermCounts.get(t) || 0) + 1));

    queryTermCounts.forEach((count, term) => {
      const wordIndex = this.vocabIndexMap.get(term);
      if (wordIndex !== undefined) {
        const tf = count / queryTokens.length;
        const idf = this.idfMap.get(term) || 0;
        queryVector[wordIndex] = tf * idf;
      }
    });

    const queryNorm = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0));
    const normalizedQuery = queryNorm === 0 ? queryVector : queryVector.map((v) => v / queryNorm);

    const similarities = this.docs.map((doc) => {
      const docVec = this.docVectors.get(doc.id) || [];
      let dotProduct = 0;
      for (let i = 0; i < this.vocab.length; i++) {
        dotProduct += normalizedQuery[i] * docVec[i];
      }
      return { doc, similarity: dotProduct };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.doc);
  }
}

// Pre-loaded strategy documents for common app categories
export const DEFAULT_STRATEGY_DOCS: StrategyDoc[] = [
  {
    id: "health-fitness-launch",
    category: "Health & Fitness",
    content:
      "Health and fitness apps succeed when they emphasize measurable progress tracking and community accountability. Key tactics: before/after transformation showcases, streak gamification, expert content partnerships, and integration with wearable data. Launch with a 30-day challenge narrative. Focus on habit formation metrics over vanity metrics.",
  },
  {
    id: "productivity-launch",
    category: "Productivity",
    content:
      "Productivity apps win by demonstrating immediate time savings. Core narrative: 'Get 1 hour back every day.' Launch assets should show concrete workflows: calendar integration, automation recipes, focus mode demonstrations. Target power users first (Notion, Obsidian, Roam communities). Emphasize offline-first, privacy-first architecture as differentiator.",
  },
  {
    id: "finance-launch",
    category: "Finance",
    content:
      "Finance apps build trust through transparency and security signaling. Lead with bank-grade encryption, SOC2 compliance, zero-data-selling pledge. Launch narrative: 'Your money, your rules, zero fees.' Show concrete savings projections. Partner with finance creators for authentic reviews. Highlight automated categorization accuracy.",
  },
  {
    id: "social-launch",
    category: "Social",
    content:
      "Social apps need network effects from day one. Launch with invite-only scarcity + creator partnership program. Core mechanic: 'Be where your audience is.' Seed with micro-influencers (10k-100k followers) who get equity/revenue share. Build in-app creator tools from day one. Emphasize algorithmic transparency.",
  },
  {
    id: "education-launch",
    category: "Education",
    content:
      "Education apps prove value through learning outcomes, not engagement metrics. Lead with 'Learn X in Y minutes' framework. Partner with credentialed educators. Show spaced repetition, active recall, progress visualization. Launch with free certification pathway. Target lifelong learners and career switchers.",
  },
  {
    id: "utility-launch",
    category: "Utilities",
    content:
      "Utility apps win on 'it just works' reliability and speed. Lead with benchmarks: launch time < 200ms, offline-first, zero ads, zero tracking. Launch narrative: 'The only app that does X without the bloat.' Distribute via Setapp, Product Hunt, Reddit r/iOSProgramming. Technical audience appreciates architecture posts.",
  },
];

// Singleton instance
let tfidfInstance: OfflineTFIDFEngine | null = null;

export function getTFIDFEngine(): OfflineTFIDFEngine {
  if (!tfidfInstance) {
    tfidfInstance = new OfflineTFIDFEngine(DEFAULT_STRATEGY_DOCS);
  }
  return tfidfInstance;
}

export function retrieveRelevantStrategy(query: string, limit = 1): StrategyDoc[] {
  return getTFIDFEngine().findSimilar(query, limit);
}