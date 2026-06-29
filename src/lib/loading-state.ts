/**
 * Reusable Loading State Interface
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

/**
 * Reusable Data Fetching State Interface
 */
export interface FetchState<T> extends LoadingState {
  data: T;
}

/**
 * Initial empty loading state helper
 */
export const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
  isSuccess: false,
};

/**
 * Creates an initial fetch state for a given default data value.
 */
export function createInitialFetchState<T>(defaultData: T): FetchState<T> {
  return {
    ...initialLoadingState,
    data: defaultData,
  };
}

/**
 * State Transition Helpers to reduce boilerplate in hooks and components.
 */
export const loadingTransitions = {
  toLoading: <T>(state: FetchState<T> | LoadingState) => ({
    ...state,
    isLoading: true,
    error: null,
    isSuccess: false,
  }),
  
  toSuccess: <T>(state: FetchState<T> | LoadingState, data?: T) => {
    const updated = {
      ...state,
      isLoading: false,
      error: null,
      isSuccess: true,
    };
    if (data !== undefined && "data" in state) {
      (updated as any).data = data;
    }
    return updated;
  },
  
  toError: <T>(state: FetchState<T> | LoadingState, errorMessage: string) => ({
    ...state,
    isLoading: false,
    error: errorMessage,
    isSuccess: false,
  }),
};

/**
 * Dashboard Loader State tracking all dependent metrics
 */
export interface DashboardLoadingState {
  userProfile: LoadingState;
  transactions: LoadingState;
  budgets: LoadingState;
  savingsGoals: LoadingState;
}

export const initialDashboardLoadingState: DashboardLoadingState = {
  userProfile: { ...initialLoadingState },
  transactions: { ...initialLoadingState },
  budgets: { ...initialLoadingState },
  savingsGoals: { ...initialLoadingState },
};

/**
 * Transactions Loader State tracking list operations
 */
export interface TransactionsLoadingState {
  fetchList: LoadingState;
  addTransaction: LoadingState;
  deleteTransaction: LoadingState;
}

export const initialTransactionsLoadingState: TransactionsLoadingState = {
  fetchList: { ...initialLoadingState },
  addTransaction: { ...initialLoadingState },
  deleteTransaction: { ...initialLoadingState },
};

/**
 * Analytics Loader State tracking chart calculation
 */
export interface AnalyticsLoadingState {
  fetchMetrics: LoadingState;
  renderCharts: LoadingState;
}

export const initialAnalyticsLoadingState: AnalyticsLoadingState = {
  fetchMetrics: { ...initialLoadingState },
  renderCharts: { ...initialLoadingState },
};
