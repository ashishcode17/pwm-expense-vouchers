export interface Profile {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  designation?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ExpenseCategory {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface CompanySettings {
  id: string
  company_name: string
  brand_name: string
  office_address?: string
  phone?: string
  email?: string
  logo_url?: string
  voucher_prefix: string
  created_at: string
  updated_at: string
}

export interface Voucher {
  id: string
  voucher_number: string
  voucher_sequence: number
  expense_date: string
  paid_to: string
  category_id: string
  category?: ExpenseCategory
  description: string
  amount: number
  amount_in_words: string
  payment_mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other'
  transaction_reference?: string
  paid_by?: string
  paid_by_employee?: Employee
  requested_by?: string
  approved_by?: string
  approved_by_employee?: Employee
  remarks?: string
  receipt_url?: string
  created_by: string
  created_by_profile?: Profile
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface VoucherFormData {
  expense_date: string
  paid_to: string
  category_id: string
  description: string
  amount: number
  payment_mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other'
  transaction_reference?: string
  paid_by?: string
  requested_by?: string
  approved_by?: string
  remarks?: string
}

export interface DashboardStats {
  today_expenses: number
  month_expenses: number
  voucher_count: number
  cash_expenses: number
  online_expenses: number
}
