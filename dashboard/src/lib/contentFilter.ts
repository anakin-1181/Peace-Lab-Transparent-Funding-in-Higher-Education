const INAPPROPRIATE_PATTERNS = [
  /\bf+u+c+k+(?:ing|ed|er|s)?\b/gi,
  /\bshit+(?:ty|s)?\b/gi,
  /\bbitch(?:es)?\b/gi,
  /\bching\s*chong\b/gi
];

function maskWord(word: string) {
  const letters = word.replace(/[^a-zA-Z]/g, '');
  if (letters.length <= 2) {
    return '*'.repeat(Math.max(letters.length, 1));
  }

  const first = letters[0];
  const last = letters[letters.length - 1];
  return `${first}${'*'.repeat(Math.max(letters.length - 2, 1))}${last}`;
}

function maskPhrase(match: string) {
  return match
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) {
        return token;
      }
      return maskWord(token);
    })
    .join('');
}

export function maskInappropriateText(text: string) {
  let flagged = false;
  let masked = text;

  for (const pattern of INAPPROPRIATE_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      flagged = true;
      return maskPhrase(match);
    });
  }

  return { masked, flagged };
}
