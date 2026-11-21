export interface GeneratorMathQuestion {
  id: string;
  left: number;
  right: number;
  operator: '×' | '÷';
  promptText: string;
  answer: number;
}

export interface GeneratorChallengeState {
  puzzleId: string;
  questions: GeneratorMathQuestion[];
  currentIndex: number; // 0..10 (10 means all 10 answered correctly)
  attemptsTotal: number;
  wrongAttemptsOnCurrent: number;
  completed: boolean;
  stabilizationPct?: number;
}

export const QUESTIONS_PER_GENERATOR = 10;

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function buildMultiplicationPool(): GeneratorMathQuestion[] {
  const pool: GeneratorMathQuestion[] = [];
  for (let a = 2; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      const flip = Math.random() < 0.5;
      const left = flip ? b : a;
      const right = flip ? a : b;
      pool.push({
        id: `mul:${a}x${b}`,
        left,
        right,
        operator: '×',
        promptText: `${left} × ${right}`,
        answer: a * b,
      });
    }
  }
  return pool;
}

function buildDivisionPool(): GeneratorMathQuestion[] {
  const pool: GeneratorMathQuestion[] = [];
  for (let divisor = 2; divisor <= 10; divisor++) {
    for (let quotient = 2; quotient <= 10; quotient++) {
      const dividend = divisor * quotient;
      pool.push({
        id: `div:${dividend}/${divisor}`,
        left: dividend,
        right: divisor,
        operator: '÷',
        promptText: `${dividend} ÷ ${divisor}`,
        answer: quotient,
      });
    }
  }
  return pool;
}

export function generateEasyGeneratorQuestions(
  usedSignatures?: Set<string>
): GeneratorMathQuestion[] {
  for (let attempt = 0; attempt < 24; attempt++) {
    const mulPool = shuffleInPlace(buildMultiplicationPool()).slice(0, 5);
    const divPool = shuffleInPlace(buildDivisionPool()).slice(0, 5);
    const combined = shuffleInPlace([...mulPool, ...divPool]);

    const signature = combined
      .map((q) => q.id)
      .sort()
      .join('|');

    if (!usedSignatures || !usedSignatures.has(signature)) {
      usedSignatures?.add(signature);
      return combined;
    }
  }

  // Fallback with guaranteed fresh shuffle
  const fallback = shuffleInPlace([
    ...shuffleInPlace(buildMultiplicationPool()).slice(0, 5),
    ...shuffleInPlace(buildDivisionPool()).slice(0, 5),
  ]);
  return fallback;
}

export function createGeneratorChallenge(
  puzzleId: string,
  usedSignatures?: Set<string>
): GeneratorChallengeState {
  return {
    puzzleId,
    questions: generateEasyGeneratorQuestions(usedSignatures),
    currentIndex: 0,
    attemptsTotal: 0,
    wrongAttemptsOnCurrent: 0,
    completed: false,
  };
}
