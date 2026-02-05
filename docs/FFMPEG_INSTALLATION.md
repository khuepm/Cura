# FFmpeg Installation Guide

Cura Photo Manager uses FFmpeg to generate thumbnails from video files. FFmpeg is a powerful multimedia framework that can decode, encode, transcode, and process video and audio files.

## Why FFmpeg is Required

FFmpeg is required for:
- Extracting frames from video files (MP4, MOV, AVI, MKV, etc.)
- Generating thumbnails for video preview
- Supporting various video codecs and formats

Without FFmpeg installed, Cura will still work for image files, but video thumbnail generation will be disabled.

## Installation Instructions

### Windows

#### Option 1: Using Chocolatey (Recommended)
If you have [Chocolatey](https://chocolatey.org/) installed:

```powershell
choco install ffmpeg
```

#### Option 2: Manual Installation
1. Download FFmpeg from the official builds:
   - Visit: https://www.gyan.dev/ffmpeg/builds/
   - Download the "ffmpeg-release-essentials.zip" file
   
2. Extract the archive:
   - Extract the ZIP file to a permanent location (e.g., `C:\ffmpeg`)
   
3. Add FFmpeg to your PATH:
   - Open System Properties (Win + Pause/Break or right-click "This PC" → Properties)
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and select "Path", then click "Edit"
   - Click "New" and add the path to the FFmpeg bin folder (e.g., `C:\ffmpeg\bin`)
   - Click "OK" on all dialogs
   
4. Verify installation:
   ```powershell
   ffmpeg -version
   ```

5. Restart Cura Photo Manager

### macOS

#### Option 1: Using Homebrew (Recommended)
If you have [Homebrew](https://brew.sh/) installed:

```bash
brew install ffmpeg
```

#### Option 2: Using MacPorts
If you have MacPorts installed:

```bash
sudo port install ffmpeg
```

#### Option 3: Manual Installation
1. Download a static build from: https://evermeet.cx/ffmpeg/
2. Extract the archive
3. Move the `ffmpeg` binary to `/usr/local/bin/`:
   ```bash
   sudo mv ffmpeg /usr/local/bin/
   sudo chmod +x /usr/local/bin/ffmpeg
   ```

4. Verify installation:
   ```bash
   ffmpeg -version
   ```

5. Restart Cura Photo Manager

### Linux

#### Ubuntu / Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Fedora
```bash
sudo dnf install ffmpeg
```

#### Arch Linux
```bash
sudo pacman -S ffmpeg
```

#### openSUSE
```bash
sudo zypper install ffmpeg
```

#### CentOS / RHEL
First, enable the EPEL and RPM Fusion repositories:
```bash
sudo yum install epel-release
sudo yum localinstall --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm
sudo yum install ffmpeg
```

#### Verify Installation
After installation, verify FFmpeg is available:
```bash
ffmpeg -version
```

Then restart Cura Photo Manager.

## Verifying FFmpeg in Cura

After installing FFmpeg:

1. Restart Cura Photo Manager
2. Check the application logs for FFmpeg status:
   - Windows: `%APPDATA%\cura\logs\`
   - macOS: `~/Library/Application Support/cura/logs/`
   - Linux: `~/.local/share/cura/logs/`
   
3. Look for log entries like:
   ```
   [INFO] FFmpeg is available: ffmpeg version 6.0
   ```

4. If FFmpeg is not detected, you'll see:
   ```
   [WARN] FFmpeg is not available - video thumbnail generation will be disabled
   ```

## Troubleshooting

### FFmpeg Not Found After Installation

**Windows:**
- Make sure you added the correct path to the `bin` folder (not the root folder)
- Restart your computer to ensure PATH changes take effect
- Open a new Command Prompt and try `ffmpeg -version`

**macOS/Linux:**
- Make sure FFmpeg is in your PATH: `which ffmpeg`
- Try running `ffmpeg -version` in a terminal
- If using a package manager, ensure the installation completed without errors

### Permission Issues (macOS/Linux)

If you get permission errors:
```bash
sudo chmod +x $(which ffmpeg)
```

### Codec Issues

If FFmpeg is installed but certain video formats don't work:
- Ensure you have a full FFmpeg build with all codecs
- On Linux, you may need to install additional codec packages:
  ```bash
  # Ubuntu/Debian
  sudo apt install ubuntu-restricted-extras
  
  # Fedora
  sudo dnf install ffmpeg-free
  ```

### Still Having Issues?

1. Check the Cura logs for detailed error messages
2. Verify FFmpeg works independently: `ffmpeg -i your_video.mp4 -vframes 1 test.jpg`
3. Report issues on the Cura GitHub repository with:
   - Your operating system and version
   - FFmpeg version (`ffmpeg -version`)
   - Relevant log entries from Cura

## Alternative: Portable FFmpeg

For development or testing, you can place FFmpeg binaries in the same directory as the Cura executable. The application will check for FFmpeg in:
1. System PATH
2. Application directory
3. Common installation locations

## Building FFmpeg from Source

Advanced users can build FFmpeg from source for optimal performance:

```bash
git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
cd ffmpeg
./configure --enable-gpl --enable-version3 --enable-nonfree
make
sudo make install
```

See the [FFmpeg Compilation Guide](https://trac.ffmpeg.org/wiki/CompilationGuide) for detailed instructions.

## Supported Video Formats

With FFmpeg installed, Cura supports:
- MP4 (H.264, H.265/HEVC)
- MOV (QuickTime)
- AVI
- MKV (Matroska)
- WebM
- FLV (Flash Video)
- WMV (Windows Media Video)
- M4V
- MPG/MPEG
- 3GP

The actual supported formats depend on your FFmpeg build and available codecs.

## Performance Considerations

- Video thumbnail generation is slower than image thumbnail generation
- First frame extraction is faster than seeking to a specific timestamp
- H.264 videos generally process faster than other codecs
- Large video files (>1GB) may take several seconds to process

## Privacy and Security

- FFmpeg runs locally on your machine
- No video data is sent to external servers
- Only a single frame is extracted for thumbnail generation
- Original video files are never modified
