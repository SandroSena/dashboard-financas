export const queryKeys = {
  categories: ['categories'] as const,
  transactionsAll: ['transactions'] as const,
  transactions: (month: string) => ['transactions', month] as const,
  transactionsRange: (start: string, end: string) => ['transactions', 'range', start, end] as const,
  budgets: (month: string) => ['budgets', month] as const,
}
