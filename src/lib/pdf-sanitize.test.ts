import { sanitizeTextForPDF, sanitizeForWinAnsi } from "./pdf-utils";

function runTests() {
  console.log("Running PDF export sanitization tests...");

  // Test 1: Smart quotes replacement
  const t1Input = "“Hello World” and ‘Single Quotes’";
  const t1Output = sanitizeTextForPDF(t1Input);
  const t1Expected = "\"Hello World\" and 'Single Quotes'";
  if (t1Output !== t1Expected) {
    throw new Error(`Test 1 Failed: Expected "${t1Expected}", got "${t1Output}"`);
  }
  console.log("✓ Test 1: Smart quotes successfully converted.");

  // Test 2: Mapped emojis translation
  const t2Input = "💡 Insight 🎯 Goal ⚠️ Warning 📈 Trend";
  const t2Output = sanitizeTextForPDF(t2Input);
  const t2Expected = "Insight:  Insight Goal:  Goal Warning:  Warning Trend:  Trend";
  if (t2Output !== t2Expected) {
    throw new Error(`Test 2 Failed: Expected "${t2Expected}", got "${t2Output}"`);
  }
  console.log("✓ Test 2: Mapped emojis successfully translated.");

  // Test 3: Unmapped emojis stripped
  const t3Input = "Hello 🍎 World 🚗! 👾";
  const t3Output = sanitizeTextForPDF(t3Input).trim();
  const t3Expected = "Hello  World !";
  if (t3Output !== t3Expected) {
    throw new Error(`Test 3 Failed: Expected "${t3Expected}", got "${t3Output}"`);
  }
  console.log("✓ Test 3: Miscellaneous unmapped emojis successfully stripped.");

  // Test 4: Unicode symbols (bullet points and dashes)
  const t4Input = "• Item 1 — Item 2 – Item 3";
  const t4Output = sanitizeTextForPDF(t4Input);
  const t4Expected = "- Item 1 - Item 2 - Item 3";
  if (t4Output !== t4Expected) {
    throw new Error(`Test 4 Failed: Expected "${t4Expected}", got "${t4Output}"`);
  }
  console.log("✓ Test 4: Bullet points and em/en dashes successfully converted to standard dashes.");

  // Test 5: Currency symbol preservation
  const t5Input = "Amounts: ₹150,000, $1,000, €500, £200";
  const t5Output = sanitizeTextForPDF(t5Input);
  const t5Expected = "Amounts: ₹150,000, $1,000, €500, £200";
  if (t5Output !== t5Expected) {
    throw new Error(`Test 5 Failed: Expected "${t5Expected}", got "${t5Output}"`);
  }
  console.log("✓ Test 5: Currency symbols preserved correctly.");

  // Test 6: WinAnsi sanitization fallback (replaces ₹ with Rs. and other non-latin1 characters with ?)
  const t6Input = "Total: ₹150,000, accents: éàü, Chinese: 中文";
  const t6Output = sanitizeForWinAnsi(t6Input);
  const t6Expected = "Total: Rs.150,000, accents: éàü, Chinese: ??";
  if (t6Output !== t6Expected) {
    throw new Error(`Test 6 Failed: Expected "${t6Expected}", got "${t6Output}"`);
  }
  console.log("✓ Test 6: WinAnsi fallback sanitization works correctly.");

  console.log("All PDF export sanitization tests passed successfully!");
}

try {
  runTests();
  process.exit(0);
} catch (error: any) {
  console.error("Test execution failed:", error.message || error);
  process.exit(1);
}
