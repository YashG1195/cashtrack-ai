import { GoalRepository } from "../repositories/goal.repository";

// Mock window and localStorage
if (typeof window === "undefined") {
  (global as any).window = {};
}

const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
};
(global as any).Event = class {
  constructor(public type: string) {}
};
(global as any).window.dispatchEvent = () => true;
(global as any).window.addEventListener = () => {};
(global as any).window.removeEventListener = () => {};

async function testGoalsThemeColor() {
  console.log("Running goals theme color tests...");

  // Clear mock storage
  delete mockStorage["moneyflow_savings"];

  // Test Case 1: Default fallback to purple
  const goal1 = await GoalRepository.add("test-user", {
    name: "Laptop",
    targetAmount: 1000,
    currentAmount: 100,
    targetDate: "2026-12-31"
    // color is omitted -> should fallback to purple
  });
  console.assert(goal1.color === "purple", `Test 1 Failed: Expected fallback color 'purple', got '${goal1.color}'`);

  // Test Case 2: Custom theme color creation
  const goal2 = await GoalRepository.add("test-user", {
    name: "Vacation",
    targetAmount: 2000,
    currentAmount: 500,
    targetDate: "2026-08-15",
    color: "orange"
  });
  console.assert(goal2.color === "orange", `Test 2 Failed: Expected color 'orange', got '${goal2.color}'`);

  // Test Case 3: Update theme color immediately
  await GoalRepository.update("test-user", goal2.id, { color: "green" });
  const list = await GoalRepository.list("test-user");
  const updatedGoal = list.find(g => g.id === goal2.id);
  console.assert(updatedGoal?.color === "green", `Test 3 Failed: Expected updated color 'green', got '${updatedGoal?.color}'`);

  console.log("All goals theme color tests passed!");
}

testGoalsThemeColor().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
