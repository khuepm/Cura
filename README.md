# Cura Photo Manager

A desktop photo management application built with Tauri (Rust backend) and Next.js (React frontend).

## Features

- Automated image scanning and metadata extraction
- AI-powered image classification using Transformers.js
- Fast thumbnail generation with caching
- Natural language search with CLIP
- Google Drive cloud synchronization
- SQLite database for efficient metadata storage

## Tech Stack

### Backend (Rust)
- **Tauri**: Desktop application framework
- **image**: Image processing and manipulation
- **kamadak-exif**: EXIF metadata extraction
- **rayon**: Parallel processing
- **walkdir**: Directory traversal
- **rusqlite**: SQLite database
- **proptest**: Property-based testing

### Frontend (Next.js/React)
- **Next.js**: React framework
- **@xenova/transformers**: Browser-based AI models
- **react-window**: Virtual scrolling for performance
- **Tailwind CSS**: Styling
- **fast-check**: Property-based testing
- **vitest**: Testing framework

## Development Setup

### Prerequisites
- Node.js 20+ and npm/pnpm
- Rust 1.77.2+
- Cargo

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run tauri dev
```

### Testing

Run frontend tests:
```bash
npm test
```

Run Rust tests:
```bash
cd src-tauri
cargo test
```

### Building

Build for production:
```bash
npm run tauri build
```

## Project Structure

```
.
├── src/                    # Next.js frontend source
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   └── __tests__/         # Frontend tests
├── src-tauri/             # Rust backend source
│   └── src/
│       ├── database.rs    # SQLite database module
│       ├── lib.rs         # Main application entry
│       └── main.rs        # Binary entry point
├── .kiro/specs/           # Feature specifications
└── public/                # Static assets
```

## Database Schema

The application uses SQLite with three main tables:
- **images**: Stores image metadata and file paths
- **tags**: AI-generated content tags with confidence scores
- **embeddings**: CLIP embeddings for semantic search

## License

[Your License Here]
