# DeckNexus

A desktop application built with Electron, React, and TypeScript designed specifically for Magic: The Gathering Commander players. DeckNexus helps you search for commanders, generate AI-powered decklists, and export them to popular platforms.

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

### Desktop Integration
- Electron

### API & AI Integration
- Scryfall API (card data)
- User-selected AI models (OpenAI, Anthropic, etc.)

### Local Storage
- Plain text files (`.json`, `.txt`)

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
yarn
```

## Development

### Running the Application

To start the development server with Electron:
```bash
yarn electron:start
```

This will start both the Vite development server and launch the Electron app.

### Running Tests

To run all tests:
```bash
yarn test
```

To run tests in watch mode:
```bash
yarn test --watch
```

### Other Commands

- `yarn dev` - Start Vite development server only
- `yarn build` - Build the React application
- `yarn build:electron` - Build for Electron distribution
- `yarn lint` - Run ESLint
- `yarn preview` - Preview the built app

## Project Structure

```
decknexus/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # React entry point
│   └── setupTests.ts      # Test configuration
├── main.ts                # Electron main process
├── vite.config.ts         # Vite configuration
├── tsconfig*.json         # TypeScript configuration
└── package.json           # Project dependencies
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
- The Electron, React, and TypeScript communities for excellent tooling
