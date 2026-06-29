import { NotificationRepository } from "../repositories/notification.repository";

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

async function testNotifications() {
  console.log("Running notifications system tests...");

  // Clear mock storage
  delete mockStorage["moneyflow_notifications"];

  // Test Case 1: Pre-populate mock notifications on list
  const list = await NotificationRepository.list("test-user-id");
  console.assert(list.length === 4, `Test 1 Failed: Expected 4 mock notifications, got ${list.length}`);
  console.assert(list[0].title === "Budget Alert", `Test 1 Failed: Expected first notification to be Budget Alert, got ${list[0].title}`);

  // Test Case 2: Add new notification
  const newNotif = await NotificationRepository.add("test-user-id", {
    title: "New Report Generated",
    message: "Your financial report is ready for download.",
    type: "system"
  });
  const updatedList = await NotificationRepository.list("test-user-id");
  console.assert(updatedList.length === 5, `Test 2 Failed: Expected 5 notifications, got ${updatedList.length}`);
  console.assert(updatedList[0].title === "New Report Generated", `Test 2 Failed: Expected newest notification at index 0, got ${updatedList[0].title}`);
  console.assert(updatedList[0].isRead === false, "Test 2 Failed: Expected new notification to be unread");

  // Test Case 3: Mark individual read
  await NotificationRepository.updateReadStatus("test-user-id", newNotif.id, true);
  const listAfterRead = await NotificationRepository.list("test-user-id");
  console.assert(listAfterRead[0].isRead === true, "Test 3 Failed: Expected notification status to update to read");

  // Test Case 4: Mark all read
  await NotificationRepository.markAllRead("test-user-id");
  const listAfterMarkAll = await NotificationRepository.list("test-user-id");
  const unreadCount = listAfterMarkAll.filter(n => !n.isRead).length;
  console.assert(unreadCount === 0, `Test 4 Failed: Expected 0 unread notifications, got ${unreadCount}`);

  // Test Case 5: Delete notification
  await NotificationRepository.delete("test-user-id", newNotif.id);
  const listAfterDelete = await NotificationRepository.list("test-user-id");
  console.assert(listAfterDelete.length === 4, `Test 5 Failed: Expected 4 notifications after deletion, got ${listAfterDelete.length}`);

  console.log("All notifications system tests passed!");
}

testNotifications().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
