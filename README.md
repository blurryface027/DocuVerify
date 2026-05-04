# DocuVerify – QR-Based Document Verification System

DocuVerify is a modern, production-grade document verification platform. It allows users to securely upload documents, generate unique QR codes, and enable third-party verification instantly.

## 🚀 Features

- **Secure Authentication**: Powered by Supabase Auth.
- **Document Management**: Upload, view, and delete documents with ease.
- **QR Code System**: Automated QR generation for every document.
- **Public Verification**: Verified badges, expiry tracking, and instant validation.
- **Scan History**: Track when and where documents are being scanned.
- **Modern UI**: Built with React, Tailwind CSS 4, and Framer Motion.
- **Responsive**: Fully optimized for mobile, tablet, and desktop.

## 🛠️ Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (Database, Auth, Storage)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Utilities**: Date-fns, QRcode.react, HTML-to-Image

## ⚙️ Setup Instructions



### 1. Clone & Install
```bash
git clone <repository-url>
cd DocuVerify
npm install
```

### 2. Supabase Configuration
Create a project on [Supabase](https://supabase.com/) and run the following SQL in the **SQL Editor**:

#### Table: `profiles`
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
```

#### Table: `documents`
```sql
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  file_url text not null,
  file_path text not null,
  expiry_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table documents enable row level security;

create policy "Documents are viewable by everyone (public verification)." on documents
  for select using (true);

create policy "Users can insert their own documents." on documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update own documents." on documents
  for update using (auth.uid() = user_id);

create policy "Users can delete own documents." on documents
  for delete using (auth.uid() = user_id);
```

#### Table: `scans`
```sql
create table scans (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents on delete cascade,
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ip_address text
);

-- Enable RLS
alter table scans enable row level security;

create policy "Scans are insertable by everyone." on scans
  for insert with check (true);

create policy "Users can view scans for their own documents." on scans
  for select using (
    exists (
      select 1 from documents 
      where documents.id = scans.document_id 
      and documents.user_id = auth.uid()
    )
  );
```

#### Storage Setup
1. Go to **Storage** in Supabase.
2. Create a bucket named `documents`.
3. Set bucket to **Public**.
4. Add Policy: `Allow Public Read` and `Allow authenticated uploads` (restricted to own folder if needed).

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Locally
```bash
npm run dev
```

## 🔳 QR Logic
The verification URL format is: `https://your-domain.com/verify/{document_id}`
This allows anyone with the QR code to check the document's authenticity without an account.

## 🎓 Project Credit
Developed as a production-level document verification solution.
