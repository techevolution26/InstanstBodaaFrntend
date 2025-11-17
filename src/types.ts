// src/types.ts

export interface Transaction {
  id: number;
  type:
  | 'deposit'
  | 'withdraw'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'interest_credit'
  | 'interest_charge';
  amount: number;
  description?: string;
  created_at: string;
  balance: number;
  savings_balance?: number;
  loan_balance?: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * WalletOverview represents the wallet-level summary your API returns.
 * Use numbers here (coerce at the UI if your API returns strings).
 */
export interface WalletOverview {
  balance: number;
  savings_balance: number;
  loan_balance: number;
}
