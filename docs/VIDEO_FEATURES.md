# Video Features User Guide

## Overview

Cura Photo Manager provides comprehensive video support alongside image management. You can import, organize, search, and backup your video collection just like your photos. This guide covers all video-related features and how to use them effectively.

## Quick Start

### Prerequisites

**FFmpeg Required**: Video support requires FFmpeg to be installed on your system.

- **Check if FFmpeg is installed**: Open a terminal and run `ffmpeg -version`
- **Not installed?** See the [FFmpeg Installation Guide](FFMPEG_INSTALLATION.md) for detailed instructions

### Importing Videos

1. **Open Cura Photo Manager**
2. **Click "Import Folder"** or use the folder selection button
3. **Select a folder** containing your videos (and/or images)
4. **Wait for processing**: Cura will automatically:
   - Discover all video files in the folder and subfolders
   - Extract a thumbnail from each video (frame at 5 seconds)
   - Extract video metadata (duration, codec, resolution)
   - Store everything in the database

5. **View your videos**: Videos appear in the grid view with a video icon overlay

## Supported Video Formats

Cura supports a wide range of video formats through FFmpeg:

### Default Supported Formats

| Format | Extension | Common Use |
|--------|-----------|------------|
| MP4 | `.mp4` | Most common format, excellent compatibility |
| MOV | `.mov` | Apple QuickTime format |
| AVI | `.avi` | Legacy Windows format |
| MKV | `.mkv` | Matroska container, supports many codecs |
| WebM | `.webm` | Web-optimized format |
| FLV | `.flv` | Flash video (legacy) |
| WMV | `.wmv` | Windows Media Video |
| M4V | `.m4v` | iTunes video format |
| MPG/MPEG | `.mpg`, `.mpeg` | MPEG video format |
| 3GP | `.3gp` | Mobile phone video format |


### Supported Video Codecs

The actual codecs supported depend on your FFmpeg installation. Common codecs include:

- **H.264 (AVC)**: Most widely used, excellent compatibility
- **H.265 (HEVC)**: Newer, better compression, slower processing
- **VP9**: Google's codec, used in WebM
- **VP8**: Older Google codec
- **MPEG-4**: Legacy codec
- **AV1**: Newest codec, excellent compression (if FFmpeg supports it)

**Note**: Codec support depends on your FFmpeg build. Most standard FFmpeg installations include all common codecs.

## Format Configuration

Cura allows you to customize which image and video formats to import. This is useful if you want to:
- Skip certain formats you don't use
- Improve scanning performance by filtering out unwanted formats
- Focus on specific media types

### Accessing Format Configuration

1. **Open Settings**: Click the settings icon or navigate to Settings page
2. **Find "Format Configuration"** section
3. **View current selections**: See which formats are currently enabled

### Configuring Video Formats

**Image Formats Section**:
- Shows all supported image formats with checkboxes
- Default: All common formats enabled (JPEG, PNG, HEIC, RAW, etc.)
- Select/deselect formats as needed

**Video Formats Section**:
- Shows all supported video formats with checkboxes
- Default: All common formats enabled (MP4, MOV, AVI, MKV, etc.)
- Select/deselect formats as needed

**Quick Actions**:
- **Select All**: Enable all formats in a category
- **Deselect All**: Disable all formats in a category
- **Reset to Defaults**: Restore default format selections


### Format Configuration Tips

**Performance Optimization**:
- Disable formats you don't use to speed up folder scanning
- Video processing is slower than images, so filtering helps

**Storage Considerations**:
- Each video generates two thumbnails (small and medium)
- Thumbnails are cached in your AppData directory
- Disabling formats reduces cache size

**Workflow Optimization**:
- If you only work with MP4 videos, disable other video formats
- If you don't have videos, disable all video formats to skip video processing

### Saving Configuration

Changes are saved immediately when you modify format selections. The configuration persists across application restarts.

## Video Thumbnails

### How Thumbnails Work

Cura automatically generates thumbnails for videos to provide fast previews:

**Extraction Method**:
- **Frame Selection**: Extracts the frame at 5 seconds into the video
- **Short Videos**: For videos shorter than 5 seconds, uses the first frame
- **Two Sizes**: Generates both small (150px) and medium (600px) thumbnails
- **Format**: Thumbnails are saved as JPEG images

**Caching**:
- Thumbnails are cached in your system's AppData directory
- Once generated, thumbnails load instantly on subsequent views
- Cache is persistent across application sessions

**Performance**:
- First-time generation: 200-500ms per video (depends on codec)
- Cached retrieval: <10ms (instant)
- H.264 videos process fastest
- 4K videos may take longer than HD videos


### Thumbnail Cache Location

Thumbnails are stored in:
- **Windows**: `%APPDATA%\cura\thumbnails\`
- **macOS**: `~/Library/Application Support/cura/thumbnails/`
- **Linux**: `~/.local/share/cura/thumbnails/`

You can change the cache location in Settings if needed.

## Viewing Videos

### Grid View

In the main grid view:
- **Video Indicator**: Videos show a video icon overlay (▶️) to distinguish them from images
- **Thumbnail Preview**: Shows the extracted thumbnail frame
- **Hover Info**: Hover to see video duration and format
- **Click to Open**: Click any video to open the detail view

### Detail View

When you open a video:
- **Video Player**: Full video player with standard controls
  - Play/Pause button
  - Seek bar for navigation
  - Volume control
  - Fullscreen option
- **Metadata Panel**: Shows video information
  - Duration (e.g., "2:34")
  - Resolution (e.g., "1920x1080")
  - Codec (e.g., "H.264")
  - File size
  - File path
- **AI Tags**: Shows AI-generated tags from the thumbnail
- **GPS Location**: If video has GPS metadata, shows map

### Video Playback

**Supported Playback**:
- Videos play directly in the application
- Uses your browser's native video capabilities
- Most common formats (MP4, WebM) play smoothly

**Fallback Behavior**:
- If a video codec isn't supported by your browser, the thumbnail is shown
- You can still open the video in an external player


## Searching and Filtering Videos

### Media Type Filter

Filter your collection by media type:
- **All**: Show both images and videos (default)
- **Images Only**: Show only photos
- **Videos Only**: Show only videos

**How to Filter**:
1. Look for the media type dropdown in the toolbar
2. Select your preferred filter
3. Grid view updates immediately

### Search with Videos

All search features work with videos:

**Text Search**:
- Search by filename
- Search by AI-generated tags
- Search by metadata (codec, resolution)

**Date Range**:
- Filter videos by creation date
- Useful for finding videos from specific events

**Advanced Filters**:
- Filter by resolution (SD, HD, 4K)
- Filter by codec (H.264, H.265, etc.)
- Filter by duration range

### AI Classification for Videos

Cura's AI classifier analyzes video thumbnails:
- Generates content tags (e.g., "landscape", "person", "cat")
- Enables semantic search using natural language
- Works the same as image classification

**Note**: AI analyzes the thumbnail frame, not the entire video content.

## Video Metadata

### Extracted Metadata

Cura automatically extracts metadata from videos:

**Video-Specific**:
- Duration (in seconds)
- Video codec (e.g., "h264", "hevc")
- Resolution (width x height)
- Frame rate (if available)
- Bitrate (if available)

**File Information**:
- File size
- File modified date
- File path

**GPS Data** (if available):
- Latitude and longitude
- Recorded from phone or camera GPS


### Viewing Metadata

**In Grid View**:
- Hover over a video to see basic info
- Video icon indicates it's a video file

**In Detail View**:
- Full metadata panel on the right side
- All extracted information displayed
- GPS location shown on map (if available)

## Cloud Backup for Videos

Videos can be backed up to Google Drive just like images:

### Syncing Videos

1. **Authenticate**: Connect your Google Drive account (Settings → Cloud Sync)
2. **Select Videos**: Choose videos to backup
3. **Upload**: Cura uploads videos to your Drive
4. **Deduplication**: Only new/modified videos are uploaded (checksum-based)

### Performance Considerations

**Upload Times**:
- Videos are much larger than images
- Upload time depends on:
  - Video file size
  - Your internet connection speed
  - Google Drive API limits

**Recommendations**:
- Use Wi-Fi for large video uploads
- Consider uploading during off-hours
- Monitor upload progress in the sync panel

**Storage Limits**:
- Videos consume more Google Drive storage
- Check your Drive storage quota before large uploads
- Consider Google One subscription for more storage

## Performance Tips

### Optimizing Video Performance

**1. Format Selection**:
- Disable unused video formats in Settings
- Reduces scanning time for large folders

**2. Cache Management**:
- Thumbnails are cached automatically
- First import is slower, subsequent views are instant
- Clear cache if running low on disk space


**3. Hardware Considerations**:
- SSD storage improves thumbnail generation speed
- More CPU cores = faster parallel processing
- Sufficient RAM prevents slowdowns

**4. FFmpeg Optimization**:
- Use the latest FFmpeg version
- Consider hardware-accelerated FFmpeg builds
- See [Video Thumbnail Optimization Guide](VIDEO_THUMBNAIL_OPTIMIZATION.md)

### Expected Performance

**Typical Times** (on modern hardware):

| Operation | Time | Notes |
|-----------|------|-------|
| Scan 1000 mixed files | 2-5s | Parallel processing |
| Generate video thumbnail (HD) | 200-500ms | First time, H.264 |
| Generate video thumbnail (4K) | 500-1000ms | First time, H.264 |
| Load cached thumbnail | <10ms | Instant |
| Video playback startup | <1s | Depends on codec |

## Troubleshooting

### FFmpeg Issues

**Problem**: "FFmpeg not available" error

**Solutions**:
1. Install FFmpeg (see [FFmpeg Installation Guide](FFMPEG_INSTALLATION.md))
2. Verify installation: `ffmpeg -version` in terminal
3. Restart Cura after installing FFmpeg
4. Check application logs for FFmpeg detection status

**Problem**: Some videos don't generate thumbnails

**Solutions**:
1. Check if the video codec is supported by your FFmpeg build
2. Try playing the video in another player to verify it's not corrupt
3. Check application logs for specific error messages
4. Update FFmpeg to the latest version


### Performance Issues

**Problem**: Video thumbnail generation is very slow

**Solutions**:
1. Check CPU usage - ensure not throttled
2. Use SSD for cache directory (Settings → Cache Location)
3. Update to latest FFmpeg version
4. Disable unused video formats to reduce processing
5. Check [Video Performance Testing Guide](VIDEO_PERFORMANCE_TESTING.md)

**Problem**: Videos don't play in detail view

**Solutions**:
1. Check if your browser supports the video codec
2. Try converting the video to MP4 (H.264) for better compatibility
3. Use the "Open in External Player" option
4. Update your browser to the latest version

### Format Configuration Issues

**Problem**: Videos not being imported

**Solutions**:
1. Check Settings → Format Configuration
2. Ensure the video format is enabled (checkbox checked)
3. Verify the file extension matches enabled formats
4. Check application logs for scanning errors

**Problem**: Too many unwanted files being imported

**Solutions**:
1. Open Settings → Format Configuration
2. Deselect formats you don't want to import
3. Use "Deselect All" then manually enable only needed formats
4. Re-scan the folder after changing configuration

## Advanced Features

### Codec Performance Monitoring

Cura tracks performance metrics for different video codecs:

**Viewing Metrics**:
1. Open Settings → Performance
2. View "Codec Performance Metrics" section
3. See average extraction time per codec
4. Identify slow or problematic codecs

**Using Metrics**:
- Identify which codecs process fastest on your system
- Detect problematic video files
- Optimize your video collection format


### Database Management

Videos are stored in the same database as images:

**Database Location**:
- **Windows**: `%APPDATA%\cura\cura.db`
- **macOS**: `~/Library/Application Support/cura/cura.db`
- **Linux**: `~/.local/share/cura/cura.db`

**Video Records Include**:
- File path and checksum
- Media type (video)
- Thumbnail paths
- Duration and codec
- Resolution and file size
- AI-generated tags
- Sync status

### Batch Operations

**Importing Multiple Folders**:
- Import multiple folders sequentially
- Progress shown for each folder
- Videos and images processed together

**Bulk Tagging**:
- Select multiple videos
- Add custom tags to all selected
- AI tags generated automatically

**Bulk Sync**:
- Select multiple videos
- Upload all to Google Drive
- Progress tracked per file

## Best Practices

### Organizing Your Video Collection

**1. Use Descriptive Folder Names**:
- Organize by date, event, or project
- Cura preserves folder structure in database

**2. Consistent Formats**:
- Convert videos to MP4 (H.264) for best compatibility
- Reduces processing time and improves playback

**3. Regular Backups**:
- Sync important videos to Google Drive
- Keep local copies on external drives
- Verify sync status regularly


**4. Metadata Preservation**:
- Keep original video files to preserve metadata
- Avoid re-encoding videos (quality loss)
- Use lossless formats when possible

**5. Performance Optimization**:
- Enable only formats you use
- Use SSD for cache directory
- Keep FFmpeg updated

### Mixed Media Workflows

**Photos and Videos Together**:
- Import folders with both photos and videos
- Use media type filter to focus on one type
- Search across both types simultaneously

**Event Documentation**:
- Combine photos and videos from events
- Use date range filters to find specific events
- Tag both photos and videos with event names

**Project Management**:
- Organize project assets (images and videos)
- Use custom tags for project categorization
- Export selections for sharing

## Privacy and Security

### Local Processing

**All video processing is local**:
- FFmpeg runs on your machine
- No video data sent to external servers
- Only thumbnails are generated, originals untouched

### Cloud Sync Privacy

**Google Drive Sync**:
- Videos uploaded to your personal Google Drive
- You control access and sharing
- Encrypted in transit (HTTPS)
- Subject to Google's privacy policy

**Recommendations**:
- Review Google Drive sharing settings
- Use strong Google account password
- Enable two-factor authentication
- Regularly audit shared files


### Data Storage

**What's Stored**:
- Video file paths (not the videos themselves)
- Extracted metadata
- Thumbnail images (JPEG)
- AI-generated tags
- Sync status

**What's NOT Stored**:
- Original video files (remain in your folders)
- Video content (only thumbnails)
- Viewing history
- Personal information

## Frequently Asked Questions

### General Questions

**Q: Do I need FFmpeg for images?**  
A: No, FFmpeg is only required for video thumbnail generation. Image processing works without FFmpeg.

**Q: Can I use Cura without videos?**  
A: Yes, disable all video formats in Settings to skip video processing entirely.

**Q: What happens if FFmpeg is not installed?**  
A: Image features work normally. Video thumbnail generation is disabled, and videos show placeholder icons.

**Q: Can I change which formats are imported?**  
A: Yes, use Settings → Format Configuration to enable/disable specific image and video formats.

### Performance Questions

**Q: Why is video import slower than images?**  
A: Video thumbnail extraction requires FFmpeg to decode video frames, which is more CPU-intensive than image processing.

**Q: How can I speed up video processing?**  
A: Use SSD storage, update FFmpeg, disable unused formats, and ensure sufficient CPU/RAM.

**Q: Do thumbnails take up a lot of space?**  
A: Each video generates ~50-200KB of thumbnails (two sizes). For 1000 videos, expect ~50-200MB cache.


### Format Questions

**Q: What video formats are supported?**  
A: MP4, MOV, AVI, MKV, WebM, FLV, WMV, M4V, MPG, MPEG, 3GP, and more. See "Supported Video Formats" section.

**Q: Can I add custom video formats?**  
A: Currently, only predefined formats are supported. Request additional formats via GitHub issues.

**Q: Why don't some videos play in the detail view?**  
A: Browser codec support varies. MP4 (H.264) has the best compatibility. Other formats may show thumbnails only.

**Q: Can I convert videos within Cura?**  
A: No, Cura is a management tool, not a video editor. Use external tools like HandBrake for conversion.

### Sync Questions

**Q: Are videos automatically synced to Google Drive?**  
A: No, you must manually select videos to sync. Auto-sync can be enabled in Settings.

**Q: How long does it take to upload videos?**  
A: Depends on video size and internet speed. A 100MB video on 10Mbps upload takes ~80 seconds.

**Q: Does Cura compress videos before uploading?**  
A: No, original videos are uploaded unchanged. Consider compressing large videos before import.

**Q: Can I sync to other cloud services?**  
A: Currently, only Google Drive is supported. Other services may be added in future versions.

## Additional Resources

### Documentation

- **[FFmpeg Installation Guide](FFMPEG_INSTALLATION.md)** - Detailed FFmpeg setup instructions
- **[Video Thumbnail Optimization](VIDEO_THUMBNAIL_OPTIMIZATION.md)** - Performance optimization details
- **[Video Performance Testing](VIDEO_PERFORMANCE_TESTING.md)** - Performance benchmarks and testing
- **[Release Process](RELEASE_PROCESS.md)** - Release and update information

### Support

- **GitHub Issues**: Report bugs or request features
- **Application Logs**: Check logs for detailed error information
  - Windows: `%APPDATA%\cura\logs\`
  - macOS: `~/Library/Application Support/cura/logs/`
  - Linux: `~/.local/share/cura/logs/`

### Community

- **GitHub Discussions**: Ask questions and share tips
- **Release Notes**: Check for new features and improvements
- **Contributing**: See CONTRIBUTING.md for development guidelines

## Conclusion

Cura's video support provides a seamless experience for managing both photos and videos in one application. With automatic thumbnail generation, AI classification, and cloud backup, you can organize your entire media collection efficiently.

**Key Takeaways**:
- ✅ Install FFmpeg for video support
- ✅ Configure formats in Settings for optimal performance
- ✅ Use media type filters to focus on videos or images
- ✅ Leverage AI classification for easy searching
- ✅ Backup important videos to Google Drive
- ✅ Monitor codec performance for optimization

For technical details and advanced usage, see the additional documentation linked throughout this guide.

---

**Last Updated**: 2024  
**Version**: 1.0  
**Feedback**: Please report issues or suggestions on GitHub

