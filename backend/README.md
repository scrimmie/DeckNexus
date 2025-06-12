# DeckNexus Backend API

A modern REST API built with TypeScript and Express for Magic: The Gathering card data and commander deck building.

## 🚀 Features

- **RESTful API Design** - Following modern REST API best practices from [freeCodeCamp's guide](https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/)
- **TypeScript** - Fully typed with strict TypeScript configuration
- **Express.js** - Fast, unopinionated web framework
- **Security** - Helmet, CORS, rate limiting, and input validation
- **Testing** - Comprehensive test suite with Vitest and Supertest
- **Error Handling** - Standardized error responses and logging
- **Rate Limiting** - Scryfall API compliance with intelligent throttling

## 📡 API Endpoints

All endpoints follow the pattern `/api/v1/cards/*` and return standardized JSON responses.

### Cards API

#### Search Cards
```http
GET /api/v1/cards/search?name=lightning&type=instant&page=1&limit=20
```

**Query Parameters:**
- `name` (optional) - Card name to search for
- `type` (optional) - Card type filter
- `colors` (optional) - Color identity filter
- `cmc` (optional) - Converted mana cost filter
- `commander` (optional) - Filter for commander-legal cards
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20, max: 175)

#### Search Commanders
```http
GET /api/v1/cards/commanders/search?name=edgar
```

**Query Parameters:**
- `name` (required) - Commander name to search for

#### Get Random Card
```http
GET /api/v1/cards/random
```

#### Get Card by ID
```http
GET /api/v1/cards/{scryfall-id}
```

**Parameters:**
- `id` - Scryfall UUID of the card

### Health Check
```http
GET /health
```

## 📝 Response Format

All API responses follow this standardized format:

```typescript
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Success Response Example
```json
{
  "status": "success",
  "data": [
    {
      "id": "12345678-1234-1234-1234-123456789012",
      "name": "Lightning Bolt",
      "type_line": "Instant",
      "mana_cost": "{R}",
      "oracle_text": "Lightning Bolt deals 3 damage to any target."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasMore": false
  }
}
```

### Error Response Example
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": ["Name must be at least 1 character long"]
  }
}
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Yarn package manager

### Installation
```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Start only backend
yarn dev:backend
```

### Scripts
- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test` - Run tests in watch mode
- `yarn test:run` - Run tests once
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking

### Environment Variables
```env
NODE_ENV=development
PORT=3001
```

## 🏗️ Architecture

The API follows a **3-layer architecture**:

```
src/
├── controllers/     # HTTP request/response handling
├── services/        # Business logic and external API calls
├── middleware/      # Express middleware (auth, validation, etc.)
├── routes/          # Route definitions
├── types/           # TypeScript type definitions
├── config/          # Configuration management
└── __tests__/       # Test files
```

### Key Components

- **Controllers** - Handle HTTP requests/responses, input validation
- **Services** - Business logic, Scryfall API integration with rate limiting
- **Middleware** - Error handling, CORS, security, logging
- **Types** - Comprehensive TypeScript definitions for all data structures

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing configuration
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Zod schema validation
- **Error Sanitization** - No sensitive data in error responses

## 🧪 Testing

Comprehensive test suite covering:
- API endpoint testing
- Error handling validation
- Service layer mocking
- Input validation testing

```bash
# Run tests
yarn test

# Run tests once
yarn test:run
```

## 📊 API Rate Limiting

The API respects Scryfall's rate limiting guidelines:
- 100ms delay between requests to Scryfall
- Exponential backoff on rate limit errors
- Request queuing for optimal throughput
- Automatic retry logic with circuit breaker

## 🚀 Production Deployment

```bash
# Build the application
yarn build

# Start production server
yarn start
```

The API will run on the configured port (default: 3001) and is ready for production deployment.

## 📚 Related Documentation

- [Scryfall API Documentation](https://scryfall.com/docs/api)
- [REST API Best Practices](https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) 