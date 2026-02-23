# Development Guide

## Project Setup Complete ✓

The Cura Photo Manager development environment has been successfully configured with:

### Backend (Rust)
- ✓ Tauri 2.9.5 with filesystem and dialog plugins
- ✓ Image processing: `image`, `kamadak-exif`
- ✓ Video processing: `ffmpeg-sidecar` for thumbnail extraction
- ✓ Parallel processing: `rayon`
- ✓ Directory traversal: `walkdir`
- ✓ Database: `rusqlite` with bundled SQLite
- ✓ Testing: `proptest` for property-based testing
- ✓ Utilities: `chrono`, `sha2`

### Frontend (Next.js/React)
- ✓ Next.js 16.1.5 with React 19
- ✓ AI models: `@xenova/transformers`
- ✓ Virtual scrolling: `react-window`
- ✓ Testing: `vitest` + `fast-check`
- ✓ Styling: Tailwind CSS

### Database Schema
- ✓ SQLite database with three tables:
  - `images`: Image and video metadata, file paths, media type
  - `tags`: AI-generated content tags
  - `embeddings`: CLIP embeddings for semantic search
- ✓ Indexes for optimized queries
- ✓ Foreign key constraints with cascade delete
- ✓ Support for video-specific metadata (duration, codec)

## Running Tests

### Prerequisites for Video Tests
Video-related tests require FFmpeg to be installed:
- **Windows**: `choco install ffmpeg` or see [FFmpeg Installation Guide](docs/FFMPEG_INSTALLATION.md)
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg` (Ubuntu/Debian)

Verify installation: `ffmpeg -version`

### Frontend Tests
```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

### Backend Tests
```bash
cd src-tauri
cargo test
```

## Development Workflow

### Start Development Server
```bash
npm run tauri dev
```

This will:
1. Start the Next.js dev server on http://localhost:3000
2. Launch the Tauri desktop application
3. Enable hot-reload for both frontend and backend changes

### Build for Production
```bash
npm run tauri build
```

## Project Structure

```
.
├── src/                          # Next.js frontend
│   ├── app/                     # App router pages
│   ├── components/              # React components
│   └── __tests__/               # Frontend tests
├── src-tauri/                   # Rust backend
│   └── src/
│       ├── database.rs          # SQLite database module
│       ├── lib.rs               # Main application
│       └── main.rs              # Binary entry
├── .kiro/specs/                 # Feature specifications
│   └── cura-photo-manager/
│       ├── requirements.md      # Requirements document
│       ├── design.md            # Design document
│       └── tasks.md             # Implementation tasks
├── vitest.config.ts             # Vitest configuration
└── README.md                    # Project overview
```

## Next Steps

The project structure is ready. You can now proceed with implementing the tasks defined in `.kiro/specs/cura-photo-manager/tasks.md`:

1. ✅ Task 1: Set up project structure (COMPLETE)
2. Task 2: Implement image scanning and discovery
3. Task 3: Implement metadata extraction
4. Task 4: Implement thumbnail generation
5. ... and more

## Tauri Configuration

The application is configured with:
- **Product Name**: Cura Photo Manager
- **Window Size**: 1200x800 (resizable)
- **Filesystem Access**: Enabled for $APPDATA and $HOME
- **Dialog Plugin**: Enabled for folder selection
- **Database Location**: `{AppData}/cura.db`

## Testing Strategy

The project uses a dual testing approach:

### Unit Tests
- Test specific examples and edge cases
- Verify error handling and recovery
- Test component integration

### Property-Based Tests
- Test universal properties across all inputs
- Minimum 100 iterations per test
- Use `proptest` (Rust) and `fast-check` (TypeScript)

## Troubleshooting

### Database Issues
The database is automatically initialized on first run at:
- Windows: `%APPDATA%/cura/cura.db`
- macOS: `~/Library/Application Support/cura/cura.db`
- Linux: `~/.local/share/cura/cura.db`

### Build Errors
If you encounter build errors:
1. Ensure Rust 1.77.2+ is installed: `rustc --version`
2. Update dependencies: `cargo update` and `npm update`
3. Clean build: `cargo clean` and `rm -rf node_modules`

### Test Failures
If tests fail:
1. Check that all dependencies are installed
2. Verify database permissions
3. Run tests with verbose output: `cargo test -- --nocapture`
