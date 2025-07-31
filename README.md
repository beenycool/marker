# AIMARKER 🎯

Free, anonymous AI-powered GCSE marking assistant with session-based analytics stored in your browser.

## Features

- 🤖 **AI-Powered Marking**: Multiple AI models including Gemini, Kimi-v2, and DeepSeek R1
- 📝 **OCR Integration**: Upload handwritten or typed answers for instant marking
- 📊 **Local Analytics**: Track progress in your browser session with automatic data cleanup
- 🎯 **Grade Boundaries**: Accurate GCSE grading based on official standards
- 🔒 **Privacy-First**: No accounts, no tracking, all data stored locally
- 🌐 **Anonymous Access**: Rate-limited usage without any personal information
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Edge Runtime**: Deployed on Cloudflare Workers for global performance

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript  
- **Database**: PostgreSQL with Supabase (submissions only, no user data)
- **Storage**: Browser localStorage for session analytics
- **AI Models**: Google Gemini, Moonshot Kimi-v2, DeepSeek R1 via OpenRouter
- **Deployment**: Cloudflare Workers (Edge Runtime)
- **Styling**: Tailwind CSS
- **Rate Limiting**: IP-based anonymous counters with automatic cleanup
- **Privacy**: GDPR-compliant with automatic data purging

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Cloudflare account (for deployment)
- API keys for AI services

### Database Setup

Run the anonymous features migration in your Supabase SQL editor:

```sql
-- Run migrations/anonymous_features.sql in Supabase
-- This creates IP-based rate limiting and GDPR-compliant cleanup
```

Enable the `pg_cron` extension and set up daily cleanup:

```sql
SELECT cron.schedule('daily-cleanup', '0 3 * * *', 
  'SELECT cleanup_old_counters(); SELECT cleanup_expired_shares();'
);
```

### Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs
GOOGLE_AI_API_KEY=your_google_ai_key
OPENROUTER_API_KEY=your_openrouter_key

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Monitoring
SENTRY_DSN=your_sentry_dsn
POSTHOG_KEY=your_posthog_key
DATADOG_CLIENT_TOKEN=your_datadog_token
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aimarker.git
   cd aimarker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
    - Create a new Supabase project
    - Run the SQL migrations in `prisma/migrations/` using the raw SQL files
    - Set up authentication providers (Email, Google, GitHub)
    - Note: While Prisma files are present for schema definition, the application uses the Supabase client directly for database operations

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required environment variables

5. **Run database migrations**
   ```bash
   # Apply migrations to your Supabase project
   # Use the SQL files in prisma/migrations/
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run e2e` - Run Playwright e2e tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Database Schema

The application uses Supabase with the following main tables:

- `users` - User accounts and subscription data
- `submissions` - Student answer submissions
- `feedback` - AI-generated marking feedback
- `usage_tracking` - Daily API usage tracking
- `past_papers` - GCSE past paper questions

### Authentication

Authentication is handled by **Supabase Auth** with support for:
- Email/password authentication
- OAuth providers (Google, GitHub)
- Magic link authentication
- Session management with secure cookies

### AI Integration

The application integrates with multiple AI providers through a unified interface:

- **Google Gemini** (Free tier)
- **Moonshot Kimi-v2** (Pro tier)
- **DeepSeek R1** (Pro tier)

All AI requests are routed through OpenRouter for consistent API access.

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run e2e tests
npm run e2e

# Run with UI
npm run e2e:ui
```

## Deployment

### Cloudflare Workers (Recommended)

1. **Build and deploy**
   ```bash
   npm run deploy
   ```

2. **Preview deployment**
   ```bash
   npm run preview
   ```

### Environment Setup

Use the provided script to set up Cloudflare secrets:
```bash
./setup-cloudflare-secrets.sh
```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Build for Cloudflare**
   ```bash
   opennextjs-cloudflare build
   ```

3. **Deploy to Cloudflare**
   ```bash
   wrangler deploy
   ```

## Architecture

### Edge Runtime
The application is optimized for Cloudflare Workers edge runtime:
- Server-side rendering at the edge
- Database connections via Supabase
- AI API calls through OpenRouter
- Static assets served from Cloudflare CDN

### Security Features
- Content Security Policy (CSP) headers
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure authentication with Supabase
- Environment variable protection

### Performance Optimizations
- Edge runtime for global performance
- Database query optimization
- Image optimization with Next.js
- Static asset caching
- API response caching

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@aimarker.tech or join our Discord server.