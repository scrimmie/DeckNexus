# DeckNexus

A web application built with React and TypeScript designed specifically for Magic: The Gathering Commander players. DeckNexus helps you search for commanders, generate AI-powered decklists, and export them to popular platforms.

## Project Overview

DeckNexus provides the following core functionality:
- Search for commanders via the Scryfall API
- AI-powered generation of synergistic decklists
- Tools to edit and refine generated decks
- Export compatibility with Moxfield and Archidekt

## Architecture & Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- shadCN/ui
- Tailwind CSS

### Backend (Coming Soon)
- API server for AI integration and data processing

### API & AI Integration
- Scryfall API (card data)
- User-selected AI models (OpenAI, Anthropic, etc.)

### Testing
- Vitest (unit testing)
- React Testing Library

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/decknexus.git
cd decknexus
```

2. Install dependencies:
```bash
yarn install
```

## Development

### Running the Application

To start the frontend development server:
```bash
yarn dev
```

This will start the Vite development server on `http://localhost:5173`.

### Running Tests

To run all tests:
```bash
yarn test
```

To run tests in watch mode:
```bash
yarn test:run
```

### Other Commands

- `yarn build` - Build the frontend application
- `yarn preview` - Preview the built frontend app
- `yarn lint` - Run ESLint

## Project Structure

```
decknexus/
├── frontend/               # React application
│   ├── components/         # React components
│   │   ├── ui/            # shadCN/ui components
│   │   └── __tests__/     # Component tests
│   ├── hooks/             # Custom React hooks
│   │   └── __tests__/     # Hook tests
│   ├── lib/               # Utility functions
│   ├── services/          # API services
│   │   ├── ai/           # AI integration services
│   │   └── __tests__/    # Service tests
│   ├── types/             # TypeScript type definitions
│   ├── assets/            # Static assets
│   ├── public/            # Public assets
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # React entry point
│   ├── index.html         # HTML template
│   ├── vite.config.mts    # Vite configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── package.json       # Frontend dependencies
├── backend/               # Backend API (coming soon)
│   └── package.json       # Backend dependencies
├── scripts/               # Build and utility scripts
└── package.json           # Workspace configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Scryfall for providing the comprehensive Magic: The Gathering card database
- The React, TypeScript, and Vite communities for excellent tooling
- shadCN/ui for beautiful, accessible UI components
