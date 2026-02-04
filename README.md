# Damaria's Travel - Cloud-Based Ticket Booking System

A modern, cloud-based ticket booking platform for buses, trains, and flights with real-time seat availability, transparent pricing, and exclusive student discounts. Built with Next.js 16, React 19, and SQLite for a fast, reliable booking experience.

## Features

### For Users
- **Multi-Transport Support** - Book buses, trains, and flights from a single platform
- **Advanced Search Interface** - Search routes by origin, destination, date, and passenger count (adults, children, infants)
- **Real-Time Seat Selection** - Visual seat maps with live availability updates via Socket.IO
- **Multi-Passenger Booking** - Book multiple seats with individual passenger details
- **Round-Trip Bookings** - Support for one-way and round-trip journeys
- **Dynamic Pricing** - Base prices with date-specific overrides, holiday multipliers, and weekend pricing
- **Student Discounts** - 30% automatic discount for verified students
- **Promo Codes** - Apply discount codes at checkout
- **Digital QR Tickets** - Instant ticket generation with unique QR codes
- **Booking Management** - View, manage, and cancel bookings in one place
- **PNR Lookup** - Search bookings by PNR number
- **Reviews & Ratings** - Rate and review your travel experience
- **Payment Methods** - Support for Card, UPI, and Wallet payments (mock payment system)
- **Transparent Pricing** - No hidden fees or taxes (all-inclusive pricing)

### For Admins
- **Comprehensive Dashboard** - Real-time stats, revenue charts, and performance metrics
- **Route Management** - Add, edit, and manage travel routes with multiple transport types
- **Schedule Management** - Create recurring schedules (daily, weekly, specific days) with automatic generation
- **Recurring Schedule Management** - Manage recurring patterns with price rules and automatic schedule generation
- **Booking Management** - View all bookings with passenger details, seat assignments, and transport types
- **Booking Actions** - Update status, cancel bookings, process refunds, and simulate payments
- **Customer Management** - Manage user accounts and view customer history
- **Revenue Analytics** - Detailed reports with date range filters, revenue trends, and top routes by date, mode, and route
- **Operator Management** - Add and manage transport operators
- **Price Override Management** - Set date-specific price overrides for routes
- **Holiday Pricing** - Configure holiday multipliers for automatic price adjustments
- **Real-Time Updates** - Live seat availability updates across all connected clients

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Database**: SQLite (with better-sqlite3)
- **Real-Time**: Socket.IO for live seat availability updates (custom server with WebSocket support)
- **Authentication**: JWT tokens with bcryptjs for password hashing
- **State Management**: React Context API (Auth, Socket.IO)
- **Form Handling**: React Hook Form with Zod validation
- **Payment**: Mock payment system supporting Card, UPI, and Wallet (ready for gateway integration)
- **Performance**: Code splitting, route prefetching, optimized font loading
- **Location Search**: Database-backed city search with international support via Country State City API

## Database Setup

The project uses SQLite and includes automated setup scripts:

### 1. Initialize Database
Run the setup script to create all tables and schema:
```bash
npm run setup-db
```

This creates all necessary tables:
- users (with admin and student flags)
- operators
- routes (with transport_type: bus, train, flight)
- schedules (with recurring schedule support)
- recurring_schedules (for recurring schedule patterns)
- bookings (with trip_type: one-way, round-trip)
- passengers (with individual seat assignments)
- seat_bookings (for real-time availability tracking)
- reviews (for user ratings and feedback)
- price_overrides (for dynamic pricing)
- holiday_pricing (for holiday multipliers)

### 2. Seed Sample Data
Run the seed script to populate with sample data:
```bash
npm run seed-data
```

This creates:
- Sample operators (QuickTravel, SafeRide, etc.)
- Multiple routes across major cities
- Schedules with recurring patterns
- Active promo codes (WELCOME40, STUDENT30, etc.)
- Sample users (including admin and student accounts)
- Sample bookings

### 3. Create Admin User
Create an admin account:
```bash
npm run create-admin
```

## Environment Variables

Create a `.env.local` file with:

```env
# Database (SQLite - file path)
# Default: ./travelflow.db or ./database.db
DATABASE_PATH=./travelflow.db

# Authentication
JWT_SECRET=your-jwt-secret-key-min-32-characters

# Socket.IO (for real-time updates)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Deployment
NEXT_PUBLIC_APP_URL=http://localhost:3000

# International City Search API (Country State City API)
# Get your free API key at: https://countrystatecity.in/
# This enables international city autocomplete (e.g., Des Moines, Iowa, USA)
COUNTRY_STATE_CITY_API_KEY=your-api-key-here
```

**Note**: The `COUNTRY_STATE_CITY_API_KEY` is optional but recommended for international city search. Without it, the system will fall back to Indian cities only. Get a free API key at [countrystatecity.in](https://countrystatecity.in/).

## Getting Started

1. **Install Dependencies**
```bash
npm install
```

2. **Set Up Database**
```bash
# Initialize database and create tables
npm run setup-db

# Seed with sample data
npm run seed-data

# Create admin user (optional)
npm run create-admin
```

3. **Configure Environment**
Create a `.env.local` file with the required environment variables (see above).

4. **Run Development Server**
```bash
npm run dev
```

5. **Open Application**
Navigate to [http://localhost:3000](http://localhost:3000)

**Note**: The development server uses a custom Node.js server (`server.js`) that integrates Next.js with Socket.IO for real-time functionality. The database file (`travelflow.db` or `database.db`) will be created automatically in the project root or `data/` directory.

## Sample Login Credentials

After running `npm run seed-data`, you can use these credentials:

### Admin Account
- Email: admin@travelflow.com
- Password: admin123

### Regular User
- Email: john@example.com
- Password: demo123

### Student Account
- Email: student@example.com
- Password: demo123

## Key Features Explained

### Real-Time Seat Availability
The system uses **Socket.IO** to broadcast seat availability updates in real-time. When a user selects or books a seat, all connected clients are immediately notified. The system uses:
- `seat_bookings` table to track booked seats
- Atomic transactions to prevent race conditions
- Optimistic locking for concurrent bookings
- Real-time WebSocket broadcasts

### Multi-Passenger Booking
Users can book multiple seats in a single transaction:
- Select multiple seats on the seat map
- Enter individual passenger details for each seat
- All passenger information is stored with seat assignments
- Admin panel displays all passengers for each booking

### Dynamic Pricing System
The pricing engine supports:
- **Base Price**: Set per route
- **Date Overrides**: Specific prices for certain dates
- **Holiday Multipliers**: Automatic price adjustments for holidays
- **Weekend Pricing**: Different rates for weekends
- **Student Discounts**: 30% automatic discount
- **Promo Codes**: Additional percentage or fixed discounts

### Recurring Schedules
Admins can create schedules with patterns:
- **Daily**: Every day
- **Weekly**: Specific days of the week
- **Custom**: Specific dates
- Schedules are automatically generated for future dates

### Round-Trip Bookings
Users can book:
- **One-Way**: Single journey
- **Round-Trip**: Outbound and return journeys
- Linked bookings with shared round-trip ID
- Independent seat selection for each leg

### QR Code Tickets
Each booking generates a unique QR code stored in the database. The QR code can be scanned at boarding for verification.

### Payment System
The platform includes a mock payment system that simulates payment processing:
- **Payment Methods**: Credit/Debit Card, UPI, and Digital Wallet
- **Instant Processing**: Simulated 1-2 second payment delay
- **Payment Status Tracking**: Tracks payment status per booking
- **Ready for Integration**: Code structure supports easy integration with Stripe, PayPal, or other payment gateways

### Location Search
The system uses a database-backed location search:
- **Database Storage**: Cities, states, and countries stored in SQLite
- **International Support**: Optional Country State City API integration for global city search
- **Fast Autocomplete**: Indexed queries for sub-10ms search results
- **Fallback**: Indian cities available without API key

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User signup with promotion support
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/profile` - Update user profile
- `PATCH /api/auth/change-password` - Change user password
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Routes & Schedules
- `GET /api/routes` - Search available routes (with filters)
- `GET /api/routes/[id]` - Get route details
- `GET /api/routes/[id]/seats` - Get seat availability for a schedule
- `GET /api/routes/[id]/schedules` - Get schedules for a route

### Bookings
- `POST /api/bookings` - Create new booking (multi-passenger support)
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/[id]` - Get booking details
- `GET /api/bookings/pnr/[pnr]` - Lookup booking by PNR
- `PATCH /api/bookings/[id]/cancel` - Cancel booking
- `PATCH /api/bookings/[id]/modify` - Modify booking (seats, date)

### Payments
- `POST /api/payments/confirm` - Confirm payment and create booking (mock payment)

### Reviews
- `GET /api/reviews` - Get reviews for a route
- `POST /api/reviews` - Create a review
- `PATCH /api/reviews/[id]/helpful` - Mark review as helpful

### Locations & Cities
- `GET /api/cities/search` - Search cities (with autocomplete)
- `GET /api/locations` - Get location data
- `GET /api/states` - Get states for a country

### Stats
- `GET /api/stats` - Get platform statistics

### Admin Routes

#### Bookings
- `GET /api/admin/bookings` - Get all bookings (with filters and autocomplete)
- `GET /api/admin/bookings/[id]` - Get booking details
- `PATCH /api/admin/bookings/[id]/status` - Update booking status
- `PATCH /api/admin/bookings/[id]/cancel` - Force cancel booking
- `PATCH /api/admin/bookings/[id]/refund` - Process refund
- `PATCH /api/admin/bookings/[id]/simulate-payment` - Simulate payment for booking

#### Routes
- `GET /api/admin/routes` - Get all routes
- `POST /api/admin/routes` - Create route
- `PATCH /api/admin/routes/[id]` - Update route
- `DELETE /api/admin/routes/[id]` - Delete route

#### Schedules
- `GET /api/admin/schedules` - Get all schedules
- `POST /api/admin/schedules` - Create schedule
- `PATCH /api/admin/schedules/[id]` - Update schedule
- `PATCH /api/admin/schedules/[id]/cancel` - Cancel schedule

#### Recurring Schedules
- `GET /api/admin/recurring-schedules` - Get all recurring schedules
- `POST /api/admin/recurring-schedules` - Create recurring schedule
- `PATCH /api/admin/recurring-schedules/[id]` - Update recurring schedule
- `PATCH /api/admin/recurring-schedules/[id]/disable` - Disable recurring schedule
- `POST /api/admin/recurring-schedules/[id]/generate` - Manually generate schedules
- `GET /api/admin/recurring-schedules/[id]/price-rules` - Get price rules
- `POST /api/admin/recurring-schedules/[id]/price-rules` - Set price rules

#### Operators
- `GET /api/admin/operators` - Get all operators
- `POST /api/admin/operators` - Create operator
- `PATCH /api/admin/operators/[id]` - Update operator
- `DELETE /api/admin/operators/[id]` - Delete operator

#### Customers
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/customers/[id]` - Get customer details

#### Promotions
- `GET /api/admin/promo` - Get all promo codes
- `POST /api/admin/promo` - Create promo code
- `PATCH /api/admin/promo/[id]` - Update promo code
- `PATCH /api/admin/promo/[id]/toggle` - Toggle promo code active status

#### Pricing
- `GET /api/admin/price-overrides` - Get price overrides
- `POST /api/admin/price-overrides` - Create price override
- `GET /api/admin/holidays` - Get holiday pricing
- `POST /api/admin/holidays` - Create holiday pricing

#### Reports & Analytics
- `GET /api/admin/reports` - Get analytics and reports
- `GET /api/admin/revenue` - Get revenue data
- `GET /api/admin/revenue/by-date` - Get revenue by date range
- `GET /api/admin/revenue/by-route` - Get revenue by route
- `GET /api/admin/revenue/by-mode` - Get revenue by transport mode
- `GET /api/admin/stats` - Get admin statistics

#### Schedule Generation
- `POST /api/admin/generate-schedules` - Generate schedules from recurring patterns

### Promotions
- `POST /api/promo-codes/validate` - Validate promo code
- `GET /api/promo-codes/student` - Get student promo codes

### Real-Time
- Socket.IO server at `/api/socket.io` for real-time seat availability updates
- WebSocket connection for live booking notifications
- Channel-based subscriptions for efficient broadcasting

## Deployment

### Custom Server Setup
This project uses a custom Node.js server (`server.js`) that integrates Next.js with Socket.IO. This is required for real-time functionality.

**Development:**
```bash
npm run dev  # Uses server.js with Socket.IO
```

**Production:**
```bash
npm run build
npm start  # Uses server.js in production mode
```

**Note**: The standard `next dev` command won't work for this project as it requires the custom server. Use `npm run dev` instead.

### Deploy to Vercel
For Vercel deployment, you'll need to:
1. Configure a custom server or use Vercel's serverless functions
2. Set up Socket.IO on a separate service (e.g., Railway, Render) or use Vercel's Edge Functions
3. Update `NEXT_PUBLIC_SOCKET_URL` to point to your Socket.IO server

**Alternative**: Deploy to platforms that support Node.js servers:
- Railway
- Render
- DigitalOcean App Platform
- AWS EC2/Elastic Beanstalk
- Heroku

### Database Considerations
- **SQLite**: File-based database, perfect for small to medium deployments
- **File Storage**: Ensure `travelflow.db` or `database.db` is persisted (use platform-specific storage or Vercel Blob Storage)
- **Backup**: Regularly backup the database file
- **Scaling**: For high-traffic applications, consider migrating to PostgreSQL
- **Location**: Database can be in project root or `data/` directory

### Environment Setup
Ensure all environment variables are set in your deployment platform:
- `DATABASE_PATH` (or use default `./travelflow.db`)
- `JWT_SECRET` (minimum 32 characters)
- `NEXT_PUBLIC_SOCKET_URL` (WebSocket URL for Socket.IO)
- `NEXT_PUBLIC_APP_URL` (Your application URL)
- `COUNTRY_STATE_CITY_API_KEY` (optional, for international city search)
- `PORT` (optional, defaults to 3000)

## Performance Optimization

### Frontend
- **Route Prefetching**: Aggressive prefetching on hover and focus for instant navigation
- **Code Splitting**: Webpack optimization with vendor, common, UI, and admin chunks
- **Font Optimization**: Optimized font loading with `display: "swap"`
- **Image Optimization**: Next.js Image component with automatic optimization
- **On-Demand Entries**: Pages kept in memory for faster navigation (25s, 5 pages buffer)
- **Package Optimization**: Tree-shaking for lucide-react, recharts, and date-fns

### Backend
- **Database Transactions**: Atomic operations prevent race conditions
- **Optimistic Locking**: Prevents concurrent booking conflicts
- **Connection Pooling**: Efficient database connection management
- **Indexed Queries**: Database indexes on frequently queried columns
- **Caching**: SessionStorage for route data caching

### Real-Time
- **Socket.IO**: Efficient WebSocket connections for live updates
- **Selective Broadcasting**: Only relevant clients receive updates
- **Connection Management**: Automatic reconnection and cleanup

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: React's built-in escaping and sanitization
- **JWT Authentication**: Secure token-based authentication
- **Admin Authorization**: Role-based access control
- **Input Validation**: Zod schema validation on all forms
- **Secure Session Management**: HTTP-only cookies for tokens
- **Environment Variable Protection**: Sensitive data in `.env.local`
- **Transaction Safety**: Atomic database operations prevent data corruption
- **Error Handling**: Comprehensive error handling without exposing internals

## Project Structure

```
cloud-booking-system/
├── app/                    # Next.js app directory
│   ├── admin/              # Admin panel pages
│   ├── api/                # API routes
│   ├── booking/            # Booking pages
│   ├── profile/            # User profile
│   ├── search/             # Search and results
│   └── seats/              # Seat selection
├── components/             # React components
│   ├── admin/              # Admin components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities and services
│   ├── db.ts              # Database operations
│   ├── transaction.ts     # Transaction utilities
│   └── services/           # Business logic services
├── hooks/                  # Custom React hooks
│   └── use-socketio.ts    # Socket.IO hook
├── contexts/               # React contexts
│   └── auth-context.tsx    # Authentication context
├── scripts/                # Database setup scripts
├── server.js               # Custom Node.js server with Socket.IO
├── data/                   # Database files directory
│   └── travelflow.db       # SQLite database file
└── travelflow.db           # Alternative database location (project root)
```

## Development Scripts

- `npm run dev` - Start development server (custom server with Socket.IO)
- `npm run dev:next` - Start Next.js dev server only (no Socket.IO)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run setup-db` - Initialize database and create tables
- `npm run init-db` - Alternative database initialization
- `npm run clear-db` - Clear all database data (keeps schema)
- `npm run seed-data` - Seed sample data (operators, routes, schedules, users, bookings)
- `npm run seed-operators` - Seed operators only
- `npm run create-admin` - Create admin user interactively
- `npm run fetch-locations` - Fetch and update location data
- `npm run validate-hooks` - Validate React hooks usage
- `npm run lint` - Run ESLint

## Future Enhancements

- **Payment Gateway Integration** - Replace mock payment with Stripe, PayPal, or Razorpay
- **SMS Notifications** - Send booking confirmations and updates via SMS
- **Email Notifications** - Enable email sending (currently disabled, infrastructure ready)
- **Mobile App** - React Native app for iOS and Android
- **Multi-language Support** - Internationalization (i18n) for multiple languages
- **GPS Tracking** - Real-time vehicle tracking for buses and trains
- **Enhanced Reviews** - Photo uploads, verified bookings, review moderation
- **Loyalty Points Program** - Rewards system for frequent travelers
- **Third-party API Integration** - Integration with external booking systems
- **Advanced Analytics** - Machine learning for demand forecasting
- **Mobile Wallet Integration** - Direct integration with popular mobile wallets
- **Booking Modifications** - Allow users to change dates/seats after booking
- **Waitlist System** - Queue system for fully booked routes

## Support

For issues or questions:
- Email: support@travelflow.com
- Documentation: See `PERFORMANCE_AUDIT.md` for performance optimizations
- See `FILE_STRUCTURE.md` for project structure details

## License

MIT License - feel free to use this project for learning or commercial purposes.
