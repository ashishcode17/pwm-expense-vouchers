-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense categories table
CREATE TABLE expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company settings table
CREATE TABLE company_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'TYMSE INDIA PVT. LTD.',
  brand_name TEXT NOT NULL DEFAULT 'Property With Manish',
  office_address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  voucher_prefix TEXT NOT NULL DEFAULT 'PWM/EXP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voucher sequence table for atomic counter
CREATE TABLE voucher_sequence (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Vouchers table
CREATE TABLE vouchers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voucher_number TEXT NOT NULL UNIQUE,
  voucher_sequence INTEGER NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_to TEXT NOT NULL,
  category_id UUID REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  amount_in_words TEXT NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Card', 'Other')),
  transaction_reference TEXT,
  paid_by UUID REFERENCES employees(id),
  requested_by TEXT,
  approved_by UUID REFERENCES employees(id),
  remarks TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO expense_categories (name) VALUES
  ('Refreshments'),
  ('Food'),
  ('Travel / Cab'),
  ('Fuel'),
  ('Stationery'),
  ('Printing'),
  ('Courier'),
  ('Office Supplies'),
  ('Repair / Maintenance'),
  ('Reimbursement'),
  ('Vendor Payment'),
  ('Miscellaneous');

-- Insert default employees
INSERT INTO employees (name, designation) VALUES
  ('Manish', 'Director'),
  ('Tarun', 'Manager'),
  ('Ashish', 'Executive'),
  ('Disha', 'Executive');

-- Insert default company settings
INSERT INTO company_settings (company_name, brand_name) VALUES
  ('TYMSE INDIA PVT. LTD.', 'Property With Manish');

-- Function to get next voucher number atomically
CREATE OR REPLACE FUNCTION get_next_voucher_number(voucher_year INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  INSERT INTO voucher_sequence (year, last_number)
  VALUES (voucher_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_number = voucher_sequence.last_number + 1
  RETURNING last_number INTO next_num;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_vouchers_expense_date ON vouchers(expense_date);
CREATE INDEX idx_vouchers_category ON vouchers(category_id);
CREATE INDEX idx_vouchers_created_by ON vouchers(created_by);
CREATE INDEX idx_vouchers_deleted_at ON vouchers(deleted_at);
CREATE INDEX idx_vouchers_voucher_number ON vouchers(voucher_number);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_sequence ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for employees (all authenticated users can read)
CREATE POLICY "Authenticated users can view employees" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage employees" ON employees FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for expense_categories (all authenticated users can read)
CREATE POLICY "Authenticated users can view categories" ON expense_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON expense_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for company_settings
CREATE POLICY "Authenticated users can view settings" ON company_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage settings" ON company_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for vouchers
CREATE POLICY "Authenticated users can view non-deleted vouchers" ON vouchers FOR SELECT USING (
  auth.role() = 'authenticated' AND deleted_at IS NULL
);

CREATE POLICY "Authenticated users can create vouchers" ON vouchers FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND created_by = auth.uid()
);

CREATE POLICY "Users can update own vouchers, admins can update all" ON vouchers FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Admins can delete vouchers" ON vouchers FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy for voucher_sequence
CREATE POLICY "Authenticated users can view sequence" ON voucher_sequence FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can manage sequence" ON voucher_sequence FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
