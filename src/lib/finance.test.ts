import { calculateGrowthRate } from "./finance";

function runTests() {
  console.log("Running finance utility tests...");

  // Test Case 1: No previous month (previous month = 0)
  const test1 = calculateGrowthRate(1500, 0);
  console.assert(test1 === null, `Test 1 Failed: Expected null, got ${test1}`);

  // Test Case 2: Previous month is 0 (prevents division by zero)
  const test2 = calculateGrowthRate(0, 0);
  console.assert(test2 === null, `Test 2 Failed: Expected null, got ${test2}`);

  // Test Case 3: Normal growth calculations (positive growth)
  const test3 = calculateGrowthRate(150, 100);
  console.assert(test3 === 50, `Test 3 Failed: Expected 50, got ${test3}`);

  // Test Case 4: Normal growth calculations (negative growth)
  const test4 = calculateGrowthRate(50, 100);
  console.assert(test4 === -50, `Test 4 Failed: Expected -50, got ${test4}`);

  // Test Case 5: Normal growth calculations (no change)
  const test5 = calculateGrowthRate(100, 100);
  console.assert(test5 === 0, `Test 5 Failed: Expected 0, got ${test5}`);

  console.log("All tests completed successfully!");
}

runTests();
