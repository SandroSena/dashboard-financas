export type Kind = 'expense' | 'income'

export type Category = {
  id: string
  name: string
  kind: Kind
  color: string
}

export type Transaction = {
  id: string
  categoryId: string
  kind: Kind
  description: string
  amount: number
  occurredOn: string
}

export type Budget = {
  id: string
  categoryId: string
  month: string
  limitAmount: number
}

export type BudgetStatus = 'ok' | 'warning' | 'over'
