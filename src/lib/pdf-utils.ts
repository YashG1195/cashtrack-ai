export const emojiMap: Record<string, string> = {
  "💡": "Insight:",
  "🎯": "Goal:",
  "📈": "Trend:",
  "📉": "Trend:",
  "⚠️": "Warning:",
  "📊": "Report:",
  "🛡️": "Protection:",
  "🛡": "Protection:",
  "💸": "Expense:",
  "💵": "Income:",
  "💰": "Savings:",
  "🎉": "Celebration:",
  "🔥": "Warning:",
  "📅": "Date:",
  "ℹ️": "Info:",
  "ℹ": "Info:",
  "🚀": "Boost:",
  "✨": "Insight:",
  "✅": "Success:",
  "❌": "Error:"
};

export function sanitizeTextForPDF(text: string): string {
  if (!text) return "";
  
  let processed = text;
  
  // Replace mapped emojis
  for (const [emoji, replacement] of Object.entries(emojiMap)) {
    processed = processed.split(emoji).join(replacement + " ");
  }

  // Convert unicode symbols & quotes
  processed = processed
    .replace(/•/g, "-")
    .replace(/[\u2014\u2015]/g, "-") // em dash
    .replace(/[\u2013]/g, "-")       // en dash
    .replace(/[\u201c\u201d]/g, '"') // smart double quotes
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    ;

  // Strip all other emojis & surrogate pairs
  const emojiRegex = /[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]/g;
  processed = processed.replace(emojiRegex, "");
  processed = processed.replace(/[\uD800-\uDFFF]/g, "");

  return processed;
}

export function sanitizeForWinAnsi(text: string): string {
  if (!text) return "";
  return text.split("").map(char => {
    const code = char.charCodeAt(0);
    if (
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255) ||
      code === 10 || // \n
      code === 13 || // \r
      code === 9     // \t
    ) {
      return char;
    }
    if (char === "₹") return "Rs.";
    return "?";
  }).join("");
}
