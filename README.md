# PWM Expense Vouchers

A complete, production-ready expense management system for **Property With Manish** (PWM) / TYMSE INDIA PVT. LTD.

## Features

- **Fast Voucher Creation** - Create expense vouchers in under 30 seconds
- **Automatic Voucher Numbering** - Sequential numbering (PWM/EXP/YYYY/NNNN)
- **Amount to Words** - Automatic conversion to Indian currency words
- **Professional Voucher Design** - Print-ready A4 format
- **PDF Generation** - Download vouchers as PDF
- **Receipt Attachments** - Upload bills/receipts (JPG, PNG, PDF)
- **Expense Register** - Filter and search all expenses
- **Reports** - Monthly summaries with category breakdown
- **Role-Based Access** - Admin and Staff roles
- **Settings Management** - Manage company details, employees, categories

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration SQL from `supabase/migrations/001_initial_schema.sql`
   - Create a storage bucket named `vouchers` with public access
   - Enable Row Level Security policies as defined in the migration

4. Configure environment variables:

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

Run the SQL migration in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and execute the contents of `supabase/migrations/001_initial_schema.sql`

This will create:
- Database tables (profiles, employees, expense_categories, vouchers)
- Default expense categories
- Default employees (Manish, Tarun, Ashish, Disha)
- Voucher numbering function
- Row Level Security policies

### Creating First Admin User

After setting up the database:

1. Sign up through the application
2. Manually update the user's role in Supabase:

\`\`\`sql
INSERT INTO profiles (id, name, email, role)
VALUES (
  'user-uuid-from-auth-users',
  'Your Name',
  'your@email.com',
  'admin'
);
\`\`\`

## Usage

### Creating a Voucher

1. Click **"+ New Expense Voucher"**
2. Fill in the required details:
   - Date (defaults to today)
   - Paid To (vendor/person name)
   - Amount (automatically converted to words)
   - Category
   - Description
   - Payment mode
3. Optionally add:
   - Transaction reference
   - Paid by / Approved by
   - Receipt attachment
   - Remarks
4. Click **"Create Voucher"**

The voucher number is automatically generated and guaranteed to be unique.

### Viewing & Printing

- Click **"View"** on any voucher
- Click **"Print"** for printer-friendly format
- Click **"Download PDF"** to save as PDF

### Expense Register

- View all expenses with filters:
  - Date range
  - Category
  - Payment mode
  - Employee
  - Search by voucher number/vendor/description
- Export to CSV/Excel

### Reports

- View monthly summaries
- Category breakdown
- Payment method breakdown

### Settings

**Company Details**
- Update brand name, company name
- Office address, phone, email

**Employees**
- Add/edit/disable employees

**Expense Categories**
- Add/edit/disable categories

## Project Structure

\`\`\`
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard with summary cards
│   │   ├── vouchers/
│   │   │   ├── new/page.tsx      # Create voucher form
│   │   │   └── [id]/page.tsx     # View voucher
│   │   ├── register/page.tsx     # Expense register
│   │   ├── reports/page.tsx      # Monthly reports
│   │   └── settings/page.tsx     # Settings
│   ├── login/page.tsx            # Login page
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   └── sidebar.tsx           # Navigation sidebar
│   ├── voucher/
│   │   └── voucher-view.tsx      # Voucher display component
│   └── ui/                        # shadcn components
├── lib/
│   ├── supabase/                 # Supabase clients
│   ├── types.ts                  # TypeScript types
│   ├── amount-to-words.ts        # Currency converter
│   └── pdf-generator.ts          # PDF generation
└── middleware.ts                 # Auth middleware
\`\`\`

## Database Schema

- **profiles** - User profiles (extends Supabase auth)
- **employees** - Company employees
- **expense_categories** - Expense categories
- **company_settings** - Company details
- **vouchers** - Expense vouchers
- **voucher_sequence** - Atomic counter for voucher numbers

## Security

- Row Level Security (RLS) enabled on all tables
- Authenticated users can create/view vouchers
- Users can edit their own vouchers
- Admins can edit/delete all vouchers
- Soft delete for vouchers (not permanently removed)

## Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## License

Proprietary - Property With Manish / TYMSE INDIA PVT. LTD.

## Support

For issues or questions, contact the development team.
