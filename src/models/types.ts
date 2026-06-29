export interface User {
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  theme?: string;
  accentColor?: string;
  currency?: string;
  notificationSettings?: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  month: string; // YYYY-MM
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  themeColor?: string;
  createdAt: Date;
}

export interface AIInsight {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  note?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "budget" | "savings" | "ai" | "system";
  isRead: boolean;
  createdAt: Date;
}


