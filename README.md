# AutoService Pro - Modern React Application

A production-ready auto service management system built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- ✅ **Authentication** - Secure login with Supabase Auth
- 📊 **Dashboard** - Real-time business metrics and analytics
- 👥 **Client Management** - Complete CRUD operations for customers
- 🚗 **Vehicle Management** - Track customer vehicles with full details
- 📝 **Order Management** - Multi-service orders with dynamic pricing
  - ✨ Add multiple services per order
  - 🎯 Select from service catalog or add custom services
  - 💰 Track quantity, unit price, labor cost, and parts cost per service
  - 🧮 Automatic total calculation
- 🗄️ **Archive System** - Automatic archiving of orders older than 1 day
- 📅 **Daily Logs** - Track daily operational activities
- 🧾 **Invoices** - Generate and print professional invoices with itemized services

### Technical Features
- ⚡ **Vite** - Lightning-fast development and build
- ⚛️ **React 18** - Latest React with hooks and context
- 🎨 **Tailwind CSS** - Utility-first styling with custom design system
- 🔄 **React Router** - Client-side routing with protected routes
- 🗄️ **Supabase** - PostgreSQL database with real-time capabilities
- 🎭 **Custom Animations** - Smooth transitions and micro-interactions
- 📱 **Responsive Design** - Works on all screen sizes
- 🔒 **Row Level Security** - Database security with RLS policies

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Modern web browser

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd auto-service-pro
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to **SQL Editor**
3. Copy the contents of `/database-schema.sql` (included in this project)
4. Paste and run the SQL script to create all tables

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to **Settings** → **API** in your Supabase dashboard
   - Copy **Project URL** and **anon public** key

3. Update `.env` with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Create Your First User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password (save these for login)

### 5. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🏗️ Project Structure

```
auto-service-pro/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Table.jsx
│   │   └── Loading.jsx
│   ├── context/            # React Context providers
│   │   └── AuthContext.jsx
│   ├── hooks/              # Custom React hooks
│   │   └── useData.js
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Clients.jsx
│   │   ├── Vehicles.jsx
│   │   ├── Orders.jsx
│   │   ├── LogsAndInvoices.jsx
│   │   └── Login.jsx
│   ├── services/           # External services
│   │   └── supabase.js
│   ├── utils/              # Helper functions
│   │   └── helpers.js
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── database-schema.sql     # Database setup script
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: Orange (#FF6B35) - Brand color for CTAs and highlights
- **Dark**: Navy blue gradient - Professional sidebar and headers
- **Success**: Green - Paid status, positive actions
- **Danger**: Red - Unpaid status, delete actions
- **Warning**: Yellow - COGS and alerts

### Typography
- **Display Font**: Bebas Neue - Bold headings and branding
- **Body Font**: Work Sans - Clean, readable text

### Components
All components follow a consistent design language with:
- Rounded corners (border-radius: 10-20px)
- Subtle shadows for depth
- Smooth transitions (200-300ms)
- Hover states with lift effect
- Focus states with ring effect

## 📊 Database Schema

### Tables

**clients**
- id, full_name, phone, email, address, timestamps

**cars**
- id, client_id (FK), make, model, year, color, license_plate, vin, timestamps

**orders**
- id, client_id (FK), car_id (FK), services, labor_cost, parts_cost, parts_sold, is_paid, timestamps

**daily_logs**
- id, log_date, description, staff_email, created_at

### Relationships
- One client → Many vehicles
- One client → Many orders
- One vehicle → Many orders
- CASCADE DELETE on client deletion

## 🔐 Security Features

- **Authentication**: Supabase Auth with email/password
- **Row Level Security**: All tables protected with RLS policies
- **Protected Routes**: Client-side route protection
- **Environment Variables**: Sensitive data in .env files
- **HTTPS**: Supabase handles SSL/TLS

## 🚀 Build and Deploy

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deploy Options

1. **Vercel** (Recommended)
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm run build
   # Drag and drop dist/ folder to Netlify
   ```

3. **Any Static Host**
   - Upload `dist/` folder contents
   - Ensure environment variables are set

### Environment Variables in Production
Make sure to set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📖 Usage Guide

### Dashboard
View real-time metrics:
- Total revenue from all orders
- Net profit (revenue - COGS)
- Cost of goods sold
- Pending unpaid orders

### Clients
- Click **Add Client** to register new customers
- Store contact details and addresses
- Delete clients (cascades to vehicles and orders)

### Vehicles
- Select client from dropdown
- Add vehicle details (make, model, year, VIN, etc.)
- Each vehicle linked to one client

### Orders
- Select client (vehicles auto-populate)
- Enter service description
- Input costs:
  - **Labor Cost**: Your service charge
  - **Parts Cost**: What you paid (COGS)
  - **Parts Sold**: What you charge customer
- Mark as paid/unpaid
- Print order receipts

### Daily Logs
- Record daily activities
- Staff email auto-populated
- Searchable history

### Invoices
- Generated automatically from orders
- Print with or without prices
- Professional invoice template

## 🎯 Best Practices

### Code Quality
- ✅ Component-based architecture
- ✅ Custom hooks for data fetching
- ✅ Context API for global state
- ✅ Consistent error handling
- ✅ Loading states for async operations

### Performance
- ✅ Code splitting with React lazy loading
- ✅ Optimized re-renders with React.memo
- ✅ Efficient data fetching with custom hooks
- ✅ Tailwind CSS purging in production

### Accessibility
- ✅ Semantic HTML elements
- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ ARIA labels where needed

## 🐛 Troubleshooting

### Environment Variables Not Working
- Make sure .env file is in project root
- Variable names must start with `VITE_`
- Restart dev server after changing .env

### Supabase Connection Issues
- Verify credentials in .env
- Check if RLS policies are enabled
- Ensure user is authenticated

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Errors
- Re-run database-schema.sql
- Check Row Level Security policies
- Verify foreign key relationships

## 🔄 Updates and Maintenance

### Adding New Features
1. Create new page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Sidebar.jsx`
4. Create corresponding hook in `src/hooks/useData.js` if needed

### Database Migrations
When modifying database schema:
1. Update `database-schema.sql`
2. Run new SQL in Supabase SQL Editor
3. Update TypeScript interfaces if using TS

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - DOM rendering
- `react-router-dom` - Routing
- `@supabase/supabase-js` - Database client

### Dev Dependencies
- `vite` - Build tool
- `tailwindcss` - CSS framework
- `autoprefixer` - CSS compatibility
- `postcss` - CSS processing

### UI Components
- `lucide-react` - Icon library
- `date-fns` - Date formatting

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)
- [React Router](https://reactrouter.com)

## 📄 License

This project is provided as-is for educational and commercial use.

## 🤝 Support

For issues:
- Check browser console for errors
- Verify Supabase connection
- Review environment variables
- Check database RLS policies

---

**Built with ❤️ using modern web technologies**

Ready to manage your auto service business efficiently!
