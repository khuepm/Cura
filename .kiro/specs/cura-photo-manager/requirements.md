# Requirements Document - Cura Photo Manager

## Introduction

Cura is a desktop photo management application built with Tauri (Rust backend) and Next.js (React frontend). The system enables users to efficiently organize, search, and backup their photo collections through automated metadata extraction, AI-powered classification, and cloud synchronization with Google Drive.

## Glossary

- **Photo_Manager**: The complete Cura application system
- **Metadata_Extractor**: Rust backend component that reads EXIF data from images
- **Thumbnail_Generator**: Rust backend component that creates cached preview images
- **AI_Classifier**: Frontend component using Transformers.js for image recognition
- **Cloud_Sync**: Component managing Google Drive authentication and synchronization
- **Database**: SQLite or SurrealDB storage for metadata and tags
- **Original_Image**: Full-resolution photo file stored on local disk
- **Thumbnail_Small**: Cached 150px width preview image for grid view
- **Thumbnail_Medium**: Cached 600px width preview image for detail view
- **Thumbnail**: Generic term for cached preview images stored in AppData
- **Metadata**: EXIF information including capture date, device, GPS coordinates, dimensions
- **Tag**: AI-generated label describing image content (e.g., "cat", "landscape")
- **Checksum**: Hash value used to identify unique images for sync operations

## Requirements

### Requirement 1: Image Scanning and Discovery

**User Story:** As a user, I want to select a folder and have the system scan all images, so that I can manage my photo collection.

#### Acceptance Criteria

1. WHEN a user selects a folder, THE Photo_Manager SHALL request filesystem access permission through Tauri's allowlist mechanism
2. WHEN permission is granted, THE Metadata_Extractor SHALL recursively scan all subdirectories for image files
3. WHEN scanning files, THE Metadata_Extractor SHALL process images in parallel using multiple CPU cores
4. WHEN an image file is discovered, THE Photo_Manager SHALL support JPEG, PNG, HEIC, and RAW formats
5. WHEN scanning completes, THE Photo_Manager SHALL return a list containing original image paths and thumbnail paths
6. IF a file cannot be read, THEN THE Metadata_Extractor SHALL log the error and continue processing remaining files

### Requirement 2: Metadata Extraction

**User Story:** As a user, I want the system to automatically extract photo information, so that I can view capture details and organize by date or location.

#### Acceptance Criteria

1. WHEN processing an image, THE Metadata_Extractor SHALL read EXIF data including capture date, camera device, GPS coordinates, and image dimensions
2. WHEN EXIF data is missing, THE Metadata_Extractor SHALL use file system timestamps as fallback for date information
3. WHEN metadata is extracted, THE Database SHALL store all metadata fields with reference to the original image path
4. WHEN GPS coordinates exist, THE Metadata_Extractor SHALL parse latitude and longitude in decimal degrees format
5. THE Metadata_Extractor SHALL complete extraction for a single image within 100 milliseconds on average

### Requirement 3: Thumbnail Generation

**User Story:** As a user, I want fast-loading preview images, so that I can browse my collection smoothly without waiting for full-resolution images.

#### Acceptance Criteria

1. WHEN an image is processed, THE Thumbnail_Generator SHALL create two preview sizes: 150px width for grid view and 600px width for detail view
2. WHEN generating thumbnails from HEIC or RAW formats, THE Thumbnail_Generator SHALL convert them to JPEG format for browser compatibility
3. WHEN generating thumbnails, THE Thumbnail_Generator SHALL store cached files in the system AppData directory
4. WHEN a thumbnail already exists, THE Thumbnail_Generator SHALL skip regeneration unless the original image has been modified
5. WHEN thumbnail generation fails, THEN THE Photo_Manager SHALL display a placeholder icon and log the error
6. THE Thumbnail_Generator SHALL preserve image orientation based on EXIF orientation tags

### Requirement 4: AI-Powered Image Classification

**User Story:** As a user, I want the system to automatically categorize my photos, so that I can find images by content without manual tagging.

#### Acceptance Criteria

1. WHEN a thumbnail is available, THE AI_Classifier SHALL analyze the image using the Xenova/clip-vit-base-patch32 or Xenova/mobilenetv4_conv_small model
2. WHEN classification completes, THE AI_Classifier SHALL assign one or more content tags to the image
3. WHEN tags are generated, THE Database SHALL store tags with confidence scores linked to the image record
4. WHEN processing images, THE AI_Classifier SHALL run inference in a web worker thread to prevent UI blocking
5. WHEN processing large batches, THE AI_Classifier SHALL run as a low-priority background process with queue management
6. WHERE the CLIP model is used, THE AI_Classifier SHALL support natural language search queries

### Requirement 5: Natural Language Search

**User Story:** As a user, I want to search photos using descriptive phrases, so that I can find images without remembering exact tags.

#### Acceptance Criteria

1. WHERE CLIP model is enabled, WHEN a user enters a search query, THE AI_Classifier SHALL compute semantic similarity between query and image embeddings
2. WHEN search results are returned, THE Photo_Manager SHALL rank images by relevance score in descending order
3. WHEN no images match the query above a threshold, THE Photo_Manager SHALL display a message indicating no results found
4. THE Photo_Manager SHALL return search results within 2 seconds for collections up to 10,000 images

### Requirement 6: Metadata Storage and Retrieval

**User Story:** As a developer, I want efficient metadata storage, so that the application can handle large photo collections with fast queries.

#### Acceptance Criteria

1. THE Database SHALL store image records containing original path, thumbnail paths, metadata fields, and tags
2. WHEN querying images, THE Database SHALL support filtering by date range, location, tags, and device
3. WHEN the application starts, THE Database SHALL initialize schema if not present
4. THE Database SHALL maintain referential integrity between images and their associated tags
5. WHEN an image is deleted from disk, THE Photo_Manager SHALL remove corresponding database records and cached thumbnails
6. WHEN an image is moved within monitored folders, THE Photo_Manager SHALL update the path in the database instead of creating duplicate entries

### Requirement 7: Google Drive Authentication

**User Story:** As a user, I want to connect my Google Drive account, so that I can backup my photos to the cloud.

#### Acceptance Criteria

1. WHEN a user initiates authentication, THE Cloud_Sync SHALL open a browser window for OAuth 2.0 authorization
2. WHEN authorization succeeds, THE Cloud_Sync SHALL store access_token and refresh_token using the system keychain
3. WHEN storing tokens, THE Cloud_Sync SHALL use platform-specific secure storage (Windows Credential Manager, macOS Keychain, Linux Secret Service)
4. WHEN the access_token expires, THE Cloud_Sync SHALL automatically refresh it using the refresh_token
5. IF authentication fails, THEN THE Cloud_Sync SHALL display an error message and allow retry

### Requirement 8: Cloud Backup and Synchronization

**User Story:** As a user, I want to backup my photos to Google Drive, so that my collection is protected against data loss.

#### Acceptance Criteria

1. WHEN a user selects backup, THE Cloud_Sync SHALL upload only new or modified images based on checksum comparison
2. WHEN uploading images, THE Cloud_Sync SHALL stream file data to Google Drive API to minimize memory usage
3. WHEN upload completes, THE Database SHALL record sync status and timestamp for each image
4. IF upload fails, THEN THE Cloud_Sync SHALL retry up to 3 times with exponential backoff
5. WHEN synchronization is active, THE Photo_Manager SHALL display progress with percentage and current file name

### Requirement 9: User Interface and Navigation

**User Story:** As a user, I want an intuitive interface to browse and manage photos, so that I can efficiently work with my collection.

#### Acceptance Criteria

1. WHEN the application loads, THE Photo_Manager SHALL display a grid view of thumbnail images
2. WHEN a user clicks a thumbnail, THE Photo_Manager SHALL open a detail view showing the full image and metadata
3. WHEN browsing images, THE Photo_Manager SHALL implement virtual scrolling for collections larger than 1,000 images
4. WHEN images are loading, THE Photo_Manager SHALL display skeleton placeholders to indicate loading state
5. THE Photo_Manager SHALL provide navigation controls for folder selection, search, and settings

### Requirement 10: Performance and Resource Management

**User Story:** As a user, I want the application to run smoothly, so that I can work with large photo collections without lag or crashes.

#### Acceptance Criteria

1. WHEN processing images, THE Metadata_Extractor SHALL utilize all available CPU cores through parallel processing
2. WHEN running AI classification, THE Photo_Manager SHALL limit concurrent inference operations to prevent memory exhaustion
3. THE Photo_Manager SHALL cache thumbnails to disk and reuse them across application sessions
4. WHEN memory usage exceeds 80% of available RAM, THE Photo_Manager SHALL pause background operations
5. THE Photo_Manager SHALL start and display the main window within 3 seconds on modern hardware

### Requirement 11: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling, so that I can diagnose issues and maintain application stability.

#### Acceptance Criteria

1. WHEN an error occurs, THE Photo_Manager SHALL log error details including timestamp, component, and stack trace
2. IF a critical error occurs, THEN THE Photo_Manager SHALL display a user-friendly error message without exposing technical details
3. WHEN file operations fail, THE Photo_Manager SHALL continue processing remaining files and report failures in a summary
4. THE Photo_Manager SHALL write logs to a rotating file in the application data directory
5. WHEN the application crashes, THE Photo_Manager SHALL preserve user data and allow recovery on next launch

### Requirement 12: Configuration and Settings

**User Story:** As a user, I want to customize application behavior, so that it fits my workflow and preferences.

#### Acceptance Criteria

1. THE Photo_Manager SHALL provide settings for thumbnail cache location, AI model selection, and sync preferences
2. WHEN a user changes settings, THE Photo_Manager SHALL persist configuration to disk immediately
3. WHEN the application starts, THE Photo_Manager SHALL load saved settings and apply them
4. THE Photo_Manager SHALL validate configuration values and reject invalid inputs with descriptive error messages
5. THE Photo_Manager SHALL provide default values for all configuration options
