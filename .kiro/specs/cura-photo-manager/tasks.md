# Implementation Plan: Cura Photo Manager

## Overview

This implementation plan breaks down the Cura media management application into discrete coding tasks. The approach follows an incremental strategy: establish core infrastructure first, then build backend image processing capabilities, followed by frontend UI and AI features, cloud synchronization, and finally video support. Each major component includes property-based tests to validate correctness properties from the design document.

**Video Support Extension**: Tasks 19-32 add comprehensive video support including FFmpeg integration for thumbnail extraction, format configuration UI, database schema migration, video metadata extraction, and video playback in the UI. This extension builds on the existing image processing infrastructure.

## Tasks

- [x] 1. Set up project structure and development environment
  - Initialize Tauri project with Rust backend and Next.js frontend
  - Configure build tools: Cargo for Rust, npm/pnpm for Next.js
  - Set up SQLite database with initial schema (images, tags, embeddings tables)
  - Install core dependencies: image, kamadak-exif, rayon, walkdir for Rust; @xenova/transformers, react-window for Next.js
  - Configure Tauri allowlist for filesystem access and IPC commands
  - Set up testing frameworks: proptest for Rust, fast-check for TypeScript
    - create github commit for this task then push to github
  - _Requirements: 1.1, 6.3, 12.5_

- [x] 2. Implement image scanning and discovery (Rust backend)
  - [x] 2.1 Create image scanner module with recursive directory traversal
    - Implement `scan_folder` Tauri command that accepts a folder path
    - Use walkdir crate to recursively traverse directory tree
    - Filter files by image extensions: .jpg, .jpeg, .png, .heic, .raw, .cr2, .nef
    - Use Rayon's par_bridge() to parallelize file discovery across CPU cores
    - Return ScanResult struct with list of image paths, total count, and errors
    - Use buffered channel to emit progress events in batches (every 100 files) to avoid IPC congestion
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  
  - [x] 2.2 Write property test for recursive image discovery
    - **Property 1: Recursive Image Discovery**
    - **Validates: Requirements 1.2, 1.5**
    - Generate random directory trees with images at various depths
    - Verify all image files are discovered regardless of nesting level
    - Verify return structure contains both original paths and thumbnail paths
  
  - [x] 2.3 Write property test for format support
    - **Property 2: Format Support Completeness**
    - **Validates: Requirements 1.4**
    - Test with sample files in JPEG, PNG, HEIC, and RAW formats
    - Verify each format is successfully processed without errors
  
  - [x] 2.4 Write property test for error isolation
    - **Property 3: Error Isolation**
    - **Validates: Requirements 1.6, 11.3**
    - Create test batches with mix of valid and unreadable files
    - Verify processing continues for valid files when errors occur
    - Verify errors are logged and included in result

- [x] 3. Implement metadata extraction (Rust backend)
  - [x] 3.1 Create metadata extractor module
    - Implement `extract_metadata` Tauri command that accepts image path
    - Use kamadak-exif crate to parse EXIF data
    - Extract capture date, camera make/model, GPS coordinates, dimensions
    - Parse GPS coordinates from EXIF rational format to decimal degrees
    - Fallback to file system timestamps if EXIF date is missing
    - Handle EXIF orientation tag for correct dimension reporting
    - Return ImageMetadata struct with all extracted fields
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 3.2 Write property test for metadata field completeness
    - **Property 4: Metadata Field Completeness**
    - **Validates: Requirements 2.1**
    - Generate images with various EXIF data combinations
    - Verify all expected fields are present in extracted metadata
  
  - [x] 3.3 Write property test for GPS coordinate format
    - **Property 6: GPS Coordinate Format**
    - **Validates: Requirements 2.4**
    - Test with images containing GPS EXIF data
    - Verify coordinates are in decimal degrees format
    - Verify latitude is in range [-90, 90] and longitude in [-180, 180]
  
  - [x] 3.4 Write unit test for fallback to file system timestamps
    - Test images without EXIF date data
    - Verify file system modified time is used as fallback
    - _Requirements: 2.2_

- [x] 4. Implement thumbnail generation (Rust backend)
  - [x] 4.1 Create thumbnail generator module
    - Implement `generate_thumbnails` Tauri command that accepts image path
    - Use image crate for decoding and resizing
    - For HEIC files: use libheif-rs to decode, convert to JPEG
    - For RAW files: use rawloader crate to decode, convert to JPEG
    - Generate two thumbnail sizes: 150px width (small) and 600px width (medium)
    - Apply EXIF orientation transformation before resizing
    - Use Lanczos3 filter for high-quality downsampling
    - Store thumbnails in AppData directory: {AppData}/cura/thumbnails/{checksum}_{size}.jpg
    - Check if thumbnail exists and source file unchanged (compare mtime) before regenerating
    - Return ThumbnailPaths struct with paths to both thumbnail sizes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 4.2 Write property test for dual thumbnail generation
    - **Property 7: Dual Thumbnail Generation**
    - **Validates: Requirements 3.1**
    - Generate random test images
    - Verify exactly two thumbnails are created with correct dimensions (150px and 600px width)
    - Verify aspect ratio is maintained
  
  - [x] 4.3 Write property test for format conversion
    - **Property 8: Format Conversion for Compatibility**
    - **Validates: Requirements 3.2**
    - Test with HEIC and RAW format inputs
    - Verify output thumbnails are in JPEG format
  
  - [x] 4.4 Write property test for thumbnail generation idempotence
    - **Property 9: Thumbnail Generation Idempotence**
    - **Validates: Requirements 3.4, 10.3**
    - Generate thumbnails for an image twice without modifying source
    - Verify second generation skips regeneration and returns existing paths
  
  - [x] 4.5 Write property test for orientation preservation
    - **Property 10: Orientation Preservation**
    - **Validates: Requirements 3.6**
    - Test with images having different EXIF orientation tags (1-8)
    - Verify thumbnails are rotated correctly according to orientation value
  
  - [x] 4.6 Write unit test for thumbnail generation error handling
    - Test with corrupt image files
    - Verify errors are logged and placeholder is used
    - _Requirements: 3.5_

- [x] 5. Implement database operations (Rust backend)
  - [x] 5.1 Create database module with SQLite integration and migrations
    - Implement database initialization with schema creation
    - Set up database migration system (using diesel or custom version tracking)
    - Create migration scripts for schema versioning
    - Create functions for inserting image records with metadata
    - Create functions for inserting tags with confidence scores
    - Create functions for querying images with filters (date range, location, tags, device)
    - Implement foreign key constraints for referential integrity (cascade delete tags when image deleted)
    - Create function to update image path (for handling file moves)
    - Create function to delete image records and associated data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 5.2 Write property test for database round-trip consistency
    - **Property 5: Database Round-Trip Consistency**
    - **Validates: Requirements 2.3, 4.3, 6.1**
    - Generate random image metadata and tags
    - Store to database and query back
    - Verify retrieved data is equivalent to original data
  
  - [x] 5.3 Write property test for database query filtering
    - **Property 14: Database Query Filtering**
    - **Validates: Requirements 6.2**
    - Insert images with various metadata values
    - Test filtering by date range, location, tags, and device
    - Verify only matching images are returned
  
  - [x] 5.4 Write property test for referential integrity
    - **Property 15: Referential Integrity**
    - **Validates: Requirements 6.4**
    - Insert image with associated tags
    - Delete image record
    - Verify tags are automatically cascade deleted
  
  - [x] 5.5 Write property test for cleanup on deletion
    - **Property 16: Cleanup on Deletion**
    - **Validates: Requirements 6.5**
    - Create image with thumbnails and database record
    - Delete image from disk
    - Verify database record and thumbnail files are removed
  
  - [x] 5.6 Write property test for path update on move
    - **Property 17: Path Update on Move**
    - **Validates: Requirements 6.6**
    - Create image record with checksum
    - Move image to new location within monitored folders
    - Verify existing record is updated, not duplicated
  
  - [x] 5.7 Write unit test for schema initialization
    - Test database initialization on first run
    - Verify all tables and indexes are created
    - _Requirements: 6.3_

- [x] 6. Checkpoint - Ensure backend core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement frontend UI foundation (Next.js)
  - [x] 7.1 Create main application layout and routing
    - Set up Next.js app router with pages for grid view, detail view, and settings
    - Create navigation components for folder selection, search, and settings
    - Implement responsive layout with Tailwind CSS
    - _Requirements: 9.1, 9.5_
  
  - [x] 7.2 Create photo grid view component
    - Implement virtual scrolling using react-window for performance
    - Display thumbnail images in responsive grid layout
    - Show skeleton placeholders while thumbnails are loading
    - Handle click events to navigate to detail view
    - _Requirements: 9.1, 9.3, 9.4_
  
  - [x] 7.3 Create photo detail view component
    - Display medium thumbnail (600px) initially
    - Implement backend Tauri command to convert HEIC/RAW to JPEG for full-resolution viewing
    - Lazy load converted full-resolution image on demand (or use medium thumbnail for zoom)
    - Show metadata panel with EXIF information (date, camera, GPS, dimensions)
    - Display AI-generated tags with confidence scores
    - Implement map view for images with GPS coordinates
    - _Requirements: 9.2_
  
  - [x] 7.4 Write unit tests for UI components
    - Test grid view rendering with mock data
    - Test detail view navigation and data display
    - Test skeleton loader display during loading states
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 8. Implement state management and Tauri IPC integration (Next.js)
  - [x] 8.1 Set up state management for application state
    - Create state store for images, search, AI processing, sync, and settings
    - Implement actions for updating state based on user interactions
    - _Requirements: All_
  
  - [x] 8.2 Integrate Tauri commands for backend communication
    - Create TypeScript wrappers for Tauri commands (scan_folder, extract_metadata, generate_thumbnails)
    - Implement event listeners for progress updates from backend
    - Handle errors from backend and display user-friendly messages
    - _Requirements: 1.1, 2.1, 3.1, 11.2_
  
  - [x] 8.3 Implement folder selection and image import flow
    - Use Tauri dialog API to select folder
    - Call scan_folder command and display progress
    - Update state with discovered images
    - Display grid view with thumbnails
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 9. Implement AI classification (Next.js frontend)
  - [x] 9.1 Create web worker for AI inference
    - Set up web worker to run Transformers.js models
    - Load Xenova/clip-vit-base-patch32 or Xenova/mobilenetv4_conv_small model
    - Implement message handling for classification requests
    - Implement queue management to limit concurrent inference (max 2)
    - Return classification results with tags and confidence scores
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [x] 9.2 Integrate AI classifier with image processing pipeline
    - Send thumbnails to web worker for classification
    - Implement priority queue: prioritize images in current viewport over off-screen images
    - Process images in background queue with low priority (max 2 concurrent)
    - Save generated tags to database via Tauri command
    - Update UI with tags as they are generated
    - Display processing progress (queue size, processed count)
    - _Requirements: 4.2, 4.3, 4.5_
  
  - [x] 9.3 Write property test for classification output structure
    - **Property 11: Classification Output Structure**
    - **Validates: Requirements 4.2**
    - Generate random test images
    - Verify classification results contain at least one tag with label and confidence
  
  - [x] 9.4 Write unit test for web worker isolation
    - Test that inference runs in worker thread without blocking UI
    - Test queue management limits concurrent operations
    - _Requirements: 4.4, 4.5_

- [x] 10. Implement search functionality (Next.js frontend)
  - [x] 10.1 Create search interface component
    - Implement text input with debounced search (300ms delay)
    - Add filter chips for tags, date ranges, locations
    - Add toggle for semantic search vs tag search (when CLIP enabled)
    - Display result count and search time
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 10.2 Implement tag-based search
    - Query database for images matching search criteria
    - Support filtering by tags, date range, location, and device
    - Display results in grid view
    - _Requirements: 6.2_
  
  - [x] 10.3 Implement semantic search with CLIP
    - Compute query embedding in web worker
    - Compare against stored image embeddings in database
    - Rank results by semantic similarity score
    - Display ranked results in grid view
    - _Requirements: 4.6, 5.1, 5.2_
  
  - [x] 10.4 Write property test for semantic search
    - **Property 12: Semantic Search with CLIP**
    - **Validates: Requirements 4.6**
    - Test with natural language queries
    - Verify system returns ranked list of images
  
  - [x] 10.5 Write property test for search result ordering
    - **Property 13: Search Result Ordering**
    - **Validates: Requirements 5.2**
    - Generate search results with various relevance scores
    - Verify results are ordered by score in descending order
  
  - [x] 10.6 Write unit test for empty search results
    - Test with query that matches no images
    - Verify "no results found" message is displayed
    - _Requirements: 5.3_

- [x] 11. Checkpoint - Ensure frontend core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Google Drive authentication (Rust backend)
  - [x] 12.1 Create OAuth 2.0 authentication module
    - Implement `authenticate_google_drive` Tauri command
    - Use oauth2 crate to handle OAuth 2.0 flow
    - Open browser window for user authorization
    - Handle OAuth callback and extract tokens
    - Store access_token and refresh_token in system keychain using keyring crate
    - Support platform-specific secure storage (Windows Credential Manager, macOS Keychain, Linux Secret Service)
    - Return authentication status (success/failure)
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 12.2 Implement token refresh mechanism
    - Create function to check if access_token is expired
    - Automatically refresh access_token using refresh_token when expired
    - Update stored tokens in keychain
    - _Requirements: 7.4_
  
  - [x] 12.3 Write property test for token persistence
    - **Property 18: Token Persistence**
    - **Validates: Requirements 7.2**
    - Simulate successful authentication
    - Store tokens in keychain
    - Verify tokens are retrievable in subsequent sessions
  
  - [x] 12.4 Write property test for automatic token refresh
    - **Property 19: Automatic Token Refresh**
    - **Validates: Requirements 7.4**
    - Simulate expired access_token
    - Verify system automatically obtains new token using refresh_token
  
  - [x] 12.5 Write unit test for authentication flow
    - Test OAuth browser window opening
    - Test callback handling
    - _Requirements: 7.1_
  
  - [x] 12.6 Write unit test for authentication error handling
    - Test failed authentication scenarios
    - Verify error message is displayed and retry is allowed
    - _Requirements: 7.5_

- [x] 13. Implement Google Drive synchronization (Rust backend)
  - [x] 13.1 Create cloud sync module
    - Implement `sync_to_drive` Tauri command that accepts list of image IDs
    - Query database for images to sync
    - Compute SHA-256 checksum for each image
    - Use Google Drive API to check if file with checksum already exists
    - Upload only new or modified images (checksum-based deduplication)
    - Use reqwest crate to stream file uploads to minimize memory usage
    - Update database with sync status and timestamp after successful upload
    - Emit progress events with percentage and current file name
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 13.2 Implement retry logic with exponential backoff
    - Retry failed uploads up to 3 times
    - Use exponential backoff between retries (1s, 2s, 4s)
    - Log failures after all retries exhausted
    - _Requirements: 8.4_
  
  - [x] 13.3 Write property test for checksum-based deduplication
    - **Property 20: Checksum-Based Deduplication**
    - **Validates: Requirements 8.1**
    - Create set of images with some already in Drive
    - Verify only images with new checksums are uploaded
  
  - [x] 13.4 Write property test for sync status tracking
    - **Property 21: Sync Status Tracking**
    - **Validates: Requirements 8.3**
    - Upload images to Drive
    - Verify database records sync status as "synced" with timestamp
  
  - [x] 13.5 Write unit test for retry logic
    - Simulate upload failures
    - Verify retry attempts with exponential backoff
    - _Requirements: 8.4_

- [x] 14. Implement error handling and logging (Rust backend)
  - [x] 14.1 Create logging module
    - Set up logging framework (use tracing or log crate)
    - Configure log output to rotating file in application data directory
    - Implement structured logging with timestamp, component, and stack trace
    - _Requirements: 11.1, 11.4_
  
  - [x] 14.2 Add error handling throughout application
    - Wrap all file operations in error handling with logging
    - Display user-friendly error messages for critical errors
    - Implement graceful degradation for non-critical errors
    - Ensure data preservation on crashes (use transactions, atomic operations)
    - _Requirements: 11.2, 11.3, 11.5_
  
  - [x] 14.3 Write property test for error logging structure
    - **Property 22: Error Logging Structure**
    - **Validates: Requirements 11.1**
    - Trigger various errors
    - Verify log entries contain timestamp, component, and stack trace
  
  - [x] 14.4 Write property test for data preservation on crash
    - **Property 23: Data Preservation on Crash**
    - **Validates: Requirements 11.5**
    - Simulate application crash during operations
    - Restart application
    - Verify all previously imported images and metadata are intact
  
  - [x] 14.5 Write unit test for user-friendly error messages
    - Test critical error scenarios
    - Verify error messages are user-friendly without technical details
    - _Requirements: 11.2_

- [x] 15. Implement settings and configuration (Next.js frontend + Rust backend)
  - [x] 15.1 Create settings UI component
    - Implement settings page with form inputs
    - Add settings for thumbnail cache location, AI model selection, sync preferences
    - Display current settings values
    - Validate user inputs and show error messages for invalid values
    - _Requirements: 12.1, 12.4_
  
  - [x] 15.2 Create settings persistence module (Rust backend)
    - Implement Tauri commands to save and load settings
    - Store settings in configuration file (JSON or TOML)
    - Provide default values for all settings on first run
    - Load settings on application startup and apply them
    - _Requirements: 12.2, 12.3, 12.5_
  
  - [x] 15.3 Write property test for settings persistence round-trip
    - **Property 24: Settings Persistence Round-Trip**
    - **Validates: Requirements 12.2, 12.3**
    - Generate random configuration changes
    - Save settings and restart application
    - Verify changed values are preserved
  
  - [x] 15.4 Write property test for settings validation
    - **Property 25: Settings Validation**
    - **Validates: Requirements 12.4**
    - Test with invalid configuration values
    - Verify system rejects input with descriptive error messages
  
  - [x] 15.5 Write unit test for default settings
    - Test first run scenario
    - Verify all settings have sensible default values
    - _Requirements: 12.5_

- [x] 16. Final integration and polish
  - [x] 16.1 Wire all components together
    - Ensure all Tauri commands are properly registered
    - Verify event system works end-to-end
    - Test complete user flows from folder selection to cloud sync
    - _Requirements: All_
  
  - [x] 16.2 Optimize performance
    - Profile application to identify bottlenecks
    - Optimize thumbnail generation and AI inference
    - Ensure application starts within 3 seconds
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [x] 16.3 Add final polish to UI
    - Ensure consistent styling across all components
    - Add loading states and transitions
    - Test responsive design on different screen sizes
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 17. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Run integration tests for end-to-end flows
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Packaging and distribution
  - [x] 18.1 Configure Tauri bundler for platform-specific installers
    - Configure tauri.conf.json for Windows (.msi, .exe) and macOS (.dmg, .app) bundles
    - Set up application icons and metadata
    - Configure installer options (install location, shortcuts, etc.)
    - _Requirements: All_
  
  - [x] 18.2 Implement code signing for security
    - Set up code signing certificates for Windows (Authenticode)
    - Set up code signing for macOS (Apple Developer ID)
    - Configure Tauri to sign binaries during build
    - Test signed installers on target platforms
    - _Requirements: All_
  
  - [x] 18.3 Implement auto-update mechanism
    - Configure Tauri updater with update server endpoint
    - Implement update check on application startup
    - Add UI notification for available updates
    - Test update flow from old version to new version
    - _Requirements: All_
  
  - [x] 18.4 Create distribution artifacts
    - Build release binaries for Windows and macOS
    - Generate checksums for installers
    - Create release notes and documentation
    - Test installation on clean systems
    - _Requirements: All_

- [ ] 19. Add video support - Database migration
  - [x] 19.1 Create database migration for video support
    - Add migration script to add media_type column (default 'image')
    - Add migration script to add duration_seconds column (nullable)
    - Add migration script to add video_codec column (nullable)
    - Add index on media_type column
    - Test migration on existing database with data
    - Ensure backward compatibility with existing image records
    - create github commit for this task then push to github
    - _Requirements: 1.4 (extended), 2.1 (extended)_
  
  - [x] 19.2 Write unit test for database migration
    - Test migration on database with existing image records
    - Verify all existing records have media_type='image'
    - Verify new columns are added correctly
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 6.3_

- [ ] 20. Implement format configuration system
  - [x] 20.1 Create format configuration module (Rust backend)
    - Implement get_format_config Tauri command
    - Implement set_format_config Tauri command
    - Implement get_default_formats Tauri command
    - Define default image formats: jpg, jpeg, png, heic, raw, cr2, nef, dng, arw, webp, gif, bmp, tiff
    - Define default video formats: mp4, mov, avi, mkv, webm, flv, wmv, m4v, mpg, mpeg, 3gp
    - Store format configuration in settings file
    - Validate format strings (lowercase, no dots)
    - create github commit for this task then push to github
    - _Requirements: 12.1, 12.2, 12.5 (extended)_
  
  - [x] 20.2 Create format selection UI component (Next.js frontend)
    - Create FormatSelection component with checkboxes for each format
    - Add "Select All" / "Deselect All" buttons for image and video sections
    - Display format counts (e.g., "12 of 15 image formats selected")
    - Show file extension examples for each format
    - Integrate with settings page
    - Call set_format_config Tauri command on changes
    - create github commit for this task then push to github
    - _Requirements: 12.1_
  
  - [x] 20.3 Write property test for format configuration persistence
    - **Property 29: Format Configuration Persistence**
    - **Validates: Requirements 12.2, 12.3 (extended)**
    - Generate random format configuration changes
    - Save configuration and restart application
    - Verify changed format selections are preserved
  
  - [x] 20.4 Write property test for default format configuration
    - **Property 32: Default Format Configuration**
    - **Validates: Requirements 12.5 (extended)**
    - Test first-time application startup
    - Verify default configuration includes all common formats
  
  - [x] 20.5 Write unit test for format validation
    - Test with invalid format strings (uppercase, with dots, special characters)
    - Verify validation rejects invalid inputs
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 12.4_

- [ ] 21. Update media scanner for video support
  - [x] 21.1 Extend scanner to handle video files
    - Update scan_folder command to accept FormatConfig parameter
    - Add video format filtering based on configuration
    - Determine media type (image/video) based on file extension
    - Return MediaFile struct with path and media_type
    - Update progress events to show both image and video counts
    - create github commit for this task then push to github
    - _Requirements: 1.2, 1.4 (extended)_
  
  - [x] 21.2 Write property test for video format support
    - **Property 26: Video Format Support**
    - **Validates: Requirements 1.4 (extended)**
    - Test with sample videos in MP4, MOV, AVI, MKV formats
    - Verify each format is successfully discovered
  
  - [x] 21.3 Write unit test for format configuration filtering
    - Test scanner with custom format configuration
    - Verify only configured formats are discovered
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 1.4 (extended)_

- [ ] 22. Implement video thumbnail extraction
  - [x] 22.1 Set up FFmpeg integration
    - Add ffmpeg-next or ffmpeg-sidecar crate dependency
    - Implement FFmpeg availability check on startup
    - Display error message if FFmpeg not found
    - Add FFmpeg installation instructions to documentation
    - create github commit for this task then push to github
    - _Requirements: 3.1 (extended)_
  
  - [x] 22.2 Create video thumbnail extractor module
    - Implement generate_video_thumbnails Tauri command
    - Extract frame at 5 seconds using FFmpeg: `ffmpeg -ss 5 -i {video_path} -vframes 1 -f image2pipe -`
    - Handle videos shorter than 5 seconds by extracting first frame
    - Decode extracted frame using image crate
    - Generate two thumbnail sizes: 150px and 600px width
    - Use Lanczos3 filter for downsampling
    - Cache thumbnails in AppData directory with checksum-based naming
    - Skip regeneration if thumbnail exists and source unchanged
    - create github commit for this task then push to github
    - _Requirements: 3.1 (extended), 3.3, 3.4_
  
  - [x] 22.3 Write property test for video thumbnail extraction at 5 seconds
    - **Property 27: Video Thumbnail Extraction at 5 Seconds**
    - **Validates: Requirements 3.1 (extended)**
    - Test with videos longer than 5 seconds
    - Verify thumbnail is extracted from frame at 5 seconds
  
  - [x] 22.4 Write property test for short video thumbnail extraction
    - **Property 28: Video Thumbnail Extraction for Short Videos**
    - **Validates: Requirements 3.1 (extended)**
    - Test with videos shorter than 5 seconds
    - Verify thumbnail is extracted from first frame
  
  - [x] 22.5 Write unit test for FFmpeg error handling
    - Test with corrupt video files
    - Test with videos without video streams (audio only)
    - Test with unsupported codecs
    - Verify errors are logged and placeholder is used
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 3.5 (extended)_

- [ ] 23. Implement video metadata extraction
  - [x] 23.1 Create video metadata extractor
    - Extend extract_metadata command to handle video files
    - Use FFmpeg to extract video metadata (duration, codec, dimensions)
    - Extract file system metadata (size, modified date)
    - Return MediaMetadata struct with video-specific fields
    - create github commit for this task then push to github
    - _Requirements: 2.1 (extended)_
  
  - [x] 23.2 Write property test for video metadata extraction
    - **Property 31: Video Metadata Extraction**
    - **Validates: Requirements 2.1 (extended)**
    - Test with various video files
    - Verify metadata includes duration, codec, dimensions, file size
  
  - [x] 23.3 Write unit test for video metadata fallback
    - Test videos with missing metadata
    - Verify fallback to file system timestamps
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 2.2 (extended)_

- [ ] 24. Update database operations for video support
  - [x] 24.1 Extend database functions for media type
    - Update insert_image function to accept media_type parameter
    - Update insert_image function to accept video metadata (duration, codec)
    - Update query functions to support media_type filtering
    - Add media_type to all database queries and results
    - create github commit for this task then push to github
    - _Requirements: 6.1, 6.2 (extended)_
  
  - [x] 24.2 Write property test for media type filtering
    - **Property 30: Media Type Filtering**
    - **Validates: Requirements 6.2 (extended)**
    - Insert mix of images and videos
    - Test filtering by media_type (image, video, all)
    - Verify only matching media types are returned
  
  - [x] 24.3 Write unit test for video record insertion
    - Test inserting video records with all metadata fields
    - Verify video-specific fields are stored correctly
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 6.1 (extended)_

- [ ] 25. Update frontend UI for video support
  - [x] 25.1 Update photo grid to show video indicators
    - Add video icon overlay to video thumbnails
    - Add media type filter dropdown (All, Images, Videos)
    - Update grid rendering to handle both images and videos
    - create github commit for this task then push to github
    - _Requirements: 9.1 (extended)_
  
  - [x] 25.2 Update detail view for video playback
    - Add video player component with controls (play, pause, seek)
    - Show video-specific metadata (duration, codec)
    - Handle video loading and buffering states
    - Fallback to thumbnail if video cannot be played
    - create github commit for this task then push to github
    - _Requirements: 9.2 (extended)_
  
  - [x] 25.3 Update search interface for media type filtering
    - Add media type filter chip (All, Images, Videos)
    - Update search query to include media_type parameter
    - Display media type in search results
    - create github commit for this task then push to github
    - _Requirements: 5.1 (extended)_
  
  - [x] 25.4 Write unit test for video UI components
    - Test video grid rendering with video indicators
    - Test video detail view with player controls
    - Test media type filtering in search
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 9.1, 9.2 (extended)_

- [ ] 26. Update settings page for format configuration
  - [x] 26.1 Add format configuration section to settings
    - Integrate FormatSelection component into settings page
    - Load current format configuration on page load
    - Save format configuration changes
    - Display success/error messages
    - create github commit for this task then push to github
    - _Requirements: 12.1_
  
  - [x] 26.2 Write unit test for settings format configuration
    - Test loading format configuration
    - Test saving format configuration changes
    - Test validation of format selections
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 12.1, 12.4_

- [ ] 27. Update media import flow for videos
  - [x] 27.1 Integrate video processing into import pipeline
    - Update folder import flow to process both images and videos
    - Call generate_video_thumbnails for video files
    - Call extract_metadata for video files
    - Store video records in database with media_type='video'
    - Display progress for both images and videos
    - create github commit for this task then push to github
    - _Requirements: 1.2, 1.5 (extended)_
  
  - [x] 27.2 Write integration test for mixed media import
    - Test importing folder with both images and videos
    - Verify all media files are processed correctly
    - Verify thumbnails are generated for both types
    - Verify metadata is extracted for both types
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 1.2, 1.5 (extended)_

- [ ] 28. Checkpoint - Ensure video support works end-to-end
  - Test complete video import flow
  - Test video thumbnail generation
  - Test video playback in detail view
  - Test format configuration
  - Test media type filtering
  - Ensure all tests pass, ask the user if questions arise.
  - create github commit for this task then push to github

- [ ] 29. Update cloud sync for video support
  - [x] 29.1 Extend sync to handle video files
    - Update sync_to_drive to handle video files
    - Compute checksums for video files
    - Upload videos to Google Drive
    - Update sync status for video records
    - create github commit for this task then push to github
    - _Requirements: 8.1, 8.2, 8.3 (extended)_
  
  - [x] 29.2 Write unit test for video file uploads
    - Test uploading video files to Drive
    - Test checksum-based deduplication for videos
    - create github commit for this task then push to github
    - create github commit for this task then push to github
    - _Requirements: 8.1 (extended)_

- [ ] 30. Performance optimization for video support
  - [-] 30.1 Optimize video thumbnail extraction
    - Profile FFmpeg performance with various codecs
    - Implement thumbnail extraction caching
    - Optimize parallel processing for mixed media
    - create github commit for this task then push to github
    - _Requirements: 10.1, 10.2 (extended)_
  
  - [~] 30.2 Write performance tests for video processing
    - Benchmark video thumbnail extraction throughput
    - Test with various video codecs and sizes
    - Verify performance targets are met
    - create github commit for this task then push to github
    - _Requirements: 10.1, 10.2 (extended)_

- [ ] 31. Final integration and testing for video support
  - [~] 31.1 Comprehensive end-to-end testing
    - Test all video support features together
    - Test edge cases (short videos, corrupt videos, unsupported codecs)
    - Test format configuration with various combinations
    - Test media type filtering across all features
    - create github commit for this task then push to github
    - _Requirements: All (extended)_
  
  - [~] 31.2 Update documentation for video support
    - Document FFmpeg installation requirements
    - Document supported video formats
    - Document format configuration feature
    - Update user guide with video features
    - create github commit for this task then push to github
    - _Requirements: All (extended)_

- [ ] 32. Final checkpoint - Video support complete
  - Run all unit tests and property tests
  - Run integration tests for video features
  - Verify all video requirements are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation including video support
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Backend uses Rust with proptest for property-based testing
- Frontend uses TypeScript/Next.js with fast-check for property-based testing
- Video support requires FFmpeg to be installed on the system
- Tasks 19-32 add comprehensive video support on top of existing image functionality
