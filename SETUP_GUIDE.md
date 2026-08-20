# PWM Expense Vouchers - Complete Setup Guide

## Overview

This guide will walk you through setting up the PWM Expense Vouchers application from scratch.

## Prerequisites

- Node.js 18 or higher
- A Supabase account (free tier is sufficient)
- Git (optional, for version control)

## Step 1: Set Up Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new account or sign in
2. Create a new project:
   - Click "New Project"
   - Give it a name (e.g., "PWM Expense Vouchers")
   - Set a strong database password (save this!)
   - Choose a region close to your location
   - Click "Create new project"
   - Wait for the project to finish setting up (2-3 minutes)

3. Get your project credentials:
   - In your project dashboard, click on the "Settings" icon (gear icon) in the sidebar
   - Click on "API"
   - Copy the following values:
     - **Project URL** (looks like: https://xxxxx.supabase.co)
     - **anon public** key (under "Project API keys")

## Step 2: Set Up Database

1. In your Supabase project dashboard, click on "SQL Editor" in the sidebar
2. Click "New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents of that file
5. Paste it into the SQL Editor in Supabase
6. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
7. You should see "Success. No rows returned"

This creates all the necessary database tables, functions, and policies.

## Step 3: Set Up Storage

1. In your Supabase project, click on "Storage" in the sidebar
2. Click "Create a new bucket"
3. Name it: `vouchers`
4. Set it to **Public bucket** (toggle ON)
5. Click "Create bucket"

## Step 4: Configure Environment Variables

1. In the project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Create Your First Admin User

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to [http://localhost:3000](http://localhost:3000)

3. You'll be redirected to the login page. Click "Sign Up" (you may need to create a sign-up page or use Supabase Auth UI)

   **Temporary Workaround**: If there's no sign-up page:
   - Go to your Supabase dashboard
   - Click "Authentication" in the sidebar
   - Click "Users" tab
   - Click "Add user" → "Create new user"
   - Enter an email and password
   - Click "Create user"

4. After creating a user, you need to add them to the `profiles` table:
   - Go to Supabase dashboard
   - Click "SQL Editor"
   - Run this query (replace the values):
   
   ```sql
   INSERT INTO profiles (id, name, email, role)
   VALUES (
     'paste-user-uuid-from-auth-users-table',
     'Your Name',
     'your@email.com',
     'admin'
   );
   ```

   To get the user UUID:
   - Go to "Authentication" → "Users" in Supabase
   - Click on your user
   - Copy the "ID" (UUID) value

## Step 7: Test the Application

1. Log in to the application with your credentials
2. You should see the dashboard
3. Try creating a test voucher:
   - Click "+ New Expense Voucher"
   - Fill in the required fields
   - Click "Create Voucher"
4. View the voucher and test Print/PDF functionality

## Step 8: Production Deployment (Optional)

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure environment variables:
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

## Default Data

The database migration automatically creates:

### Default Expense Categories:
- Refreshments
- Food
- Travel / Cab
- Fuel
- Stationery
- Printing
- Courier
- Office Supplies
- Repair / Maintenance
- Reimbursement
- Vendor Payment
- Miscellaneous

### Default Employees:
- Manish (Director)
- Tarun (Manager)
- Ashish (Executive)
- Disha (Executive)

### Company Settings:
- Brand Name: Property With Manish
- Company Name: TYMSE INDIA PVT. LTD.

You can modify all of these in the Settings page after logging in.

## Troubleshooting

### Issue: Cannot connect to database
- Check that your Supabase URL and anon key are correct in `.env.local`
- Ensure your Supabase project is running (check dashboard)

### Issue: Login not working
- Make sure you've created a user in Supabase Authentication
- Ensure you've inserted the user into the `profiles` table
- Check browser console for errors

### Issue: Voucher creation fails
- Check that the database migration ran successfully
- Verify Row Level Security policies are set up correctly
- Check browser console for specific error messages

### Issue: Receipt upload fails
- Ensure the `vouchers` storage bucket is created
- Make sure it's set to public
- Check file size (max 5MB)
- Only JPG, PNG, and PDF files are supported

## Support

For issues or questions:
1. Check the browser console for error messages
2. Check the Supabase project logs (Logs & Reports in sidebar)
3. Verify all setup steps were completed correctly

## Security Notes

- The anon key is safe to expose in client-side code
- Row Level Security (RLS) protects your data
- Never commit `.env.local` to version control
- Change default employee names and company details in Settings
- Set up proper authentication in production (email verification, etc.)

## Next Steps

After setup:
1. Update company details in Settings
2. Add your actual employees in Settings
3. Customize expense categories as needed
4. Create a few test vouchers to familiarize yourself with the system
5. Train your team on how to use the application

---

**Congratulations!** Your PWM Expense Vouchers application is now set up and ready to use.
