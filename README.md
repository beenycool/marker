# AI Marker - Anonymous GCSE Marking Tool

A free, privacy-first AI marking tool for GCSE students during summer holidays. No accounts, no tracking, all processing ephemeral.

## 🔒 Privacy-First Architecture

- **Zero Storage**: No questions, answers, or personal data stored on servers
- **Ephemeral Processing**: All data processed in real-time and immediately discarded
- **Local Analytics**: Dashboard data stored only in your browser's localStorage
- **Anonymous Rate Limiting**: IP hashing with daily deletion for abuse prevention
- **GDPR Compliant**: No personal data collection or storage

## 🚀 Features

- **AI-Powered Marking**: Advanced AI models provide accurate, consistent marking
- **OCR Support**: Upload photos of handwritten work for instant text conversion
- **Grade Boundaries**: Optional GCSE grade boundary integration
- **Progress Tracking**: Local session analytics with privacy guarantees
- **Multiple AI Providers**: OpenRouter, GPT, Claude, Gemini support
- **Subject-Specific**: Tailored marking for different GCSE subjects

## 🏗️ Architecture

### Cloudflare Workers Deployment
- **Frontend**: Next.js deployed to Cloudflare Pages
- **API**: Cloudflare Workers for serverless marking endpoints
- **Database**: Supabase (anonymous counters only, no personal data)
- **OCR Service**: Separate service connected via Cloudflare Tunnel

### Anonymous Design
- No user authentication or accounts
- No session management or cookies
- No personal data persistence
- IP-based rate limiting with daily hash rotation

## 📁 Project Structure

```
src/
├── app/
│   ├── (main)/           # Main marking interface
│   ├── dashboard/        # Local analytics dashboard
│   ├── privacy/          # Privacy policy
│   └── api/
│       ├── mark/         # Core marking endpoint
│       ├── ocr/          # Image text extraction
│       └── health/       # Service health check
├── components/
│   ├── forms/            # Marking form components
│   ├── dashboard/        # Analytics components
│   └── tours/            # User onboarding
├── hooks/
│   └── useLocalDashboard.ts  # localStorage analytics
└── lib/
    ├── ai/               # AI provider integrations
    ├── rate-limit.ts     # Anonymous rate limiting
    └── logger.ts         # Privacy-safe logging
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Cloudflare account
- Supabase project (for anonymous counters)

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables
```env
# Supabase (for anonymous counters only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Providers
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# OCR Service
OCR_SERVICE_URL=your_ocr_service_url
OCR_API_KEY=your_ocr_key
```

## 🚀 Deployment

### Cloudflare Workers
```bash
# Build and deploy
npm run deploy

# Or deploy to Cloudflare Pages
npm run cf-pages:deploy
```

### OCR Service Setup
1. Deploy OCR service to a VM/container platform
2. Set up Cloudflare Tunnel for secure connection
3. Configure tunnel in `wrangler.toml`

## 📊 Analytics & Monitoring

### Anonymous Analytics
- Aggregate usage counters (no personal data)
- Subject popularity statistics
- Response time metrics
- Error rate monitoring

### Local Analytics
- Session statistics in localStorage
- Personal progress tracking
- Grade distribution (browser-only)

## 🔧 Rate Limiting

Anonymous rate limiting implementation:
- Daily IP hash rotation with salt
- Redis-based counters
- Graceful degradation for exceeded limits
- No permanent IP storage

## 🛡️ Security

- No authentication attack surface
- Cloudflare DDoS protection
- Tunnel-secured OCR service
- Content validation and sanitization
- No SQL injection risks (no user data storage)

## 📝 API Endpoints

### `POST /api/mark`
Submit work for AI marking
- **Input**: Question, answer, optional metadata
- **Output**: Ephemeral marking results
- **Rate Limited**: Anonymous IP-based
- **Storage**: None (ephemeral processing)

### `POST /api/ocr`
Extract text from uploaded images
- **Input**: Image file
- **Output**: Extracted text
- **Rate Limited**: Yes
- **Storage**: None (immediate deletion)

### `GET /api/health`
Service health check
- **Output**: Service status
- **Rate Limited**: No

## 📚 Dependencies

### Core
- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations

### AI & Processing
- **OpenRouter**: AI model routing
- **OpenAI SDK**: GPT integration
- **Google AI**: Gemini integration
- **Zod**: Schema validation

### Infrastructure
- **@upstash/ratelimit**: Anonymous rate limiting
- **@upstash/redis**: Redis client
- **@opennextjs/cloudflare**: Cloudflare deployment

## 🤝 Contributing

1. Maintain privacy-first principles
2. No personal data storage
3. Test with anonymous rate limiting
4. Follow existing code patterns

## 📄 License

MIT License - See LICENSE file

## 🔒 Privacy Policy

See `/privacy` for detailed privacy information. Key points:
- No personal data storage
- Ephemeral processing only
- Local analytics in browser
- GDPR compliant by design

---

**Built for students, by developers who respect privacy.**