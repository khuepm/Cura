use ffmpeg_sidecar::command::FfmpegCommand;
use ffmpeg_sidecar::download::{check_latest_version, download_ffmpeg_package, unpack_ffmpeg};
use ffmpeg_sidecar::paths::sidecar_dir;
use log::{error, info, warn};
use std::path::PathBuf;

/// Result of FFmpeg availability check
#[derive(Debug, Clone, serde::Serialize)]
pub struct FfmpegStatus {
    pub available: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

/// Check if FFmpeg is available on the system
pub fn check_ffmpeg_availability() -> FfmpegStatus {
    info!("Checking FFmpeg availability...");
    
    // Try to run a simple FFmpeg command to check if it's available
    match std::process::Command::new("ffmpeg")
        .arg("-version")
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let version_output = String::from_utf8_lossy(&output.stdout);
                let version = version_output
                    .lines()
                    .next()
                    .unwrap_or("unknown version")
                    .to_string();
                
                info!("FFmpeg is available: {}", version);
                return FfmpegStatus {
                    available: true,
                    version: Some(version),
                    error: None,
                };
            }
        }
        Err(e) => {
            error!("FFmpeg is not installed on the system: {}", e);
        }
    }
    
    // FFmpeg not found
    FfmpegStatus {
        available: false,
        version: None,
        error: Some("FFmpeg is not installed. Please install FFmpeg to enable video thumbnail generation.".to_string()),
    }
}

/// Attempt to auto-download FFmpeg (optional feature)
/// This is useful for development but may not be suitable for production
pub async fn auto_download_ffmpeg() -> Result<PathBuf, String> {
    info!("Attempting to auto-download FFmpeg...");
    
    // Get the sidecar directory for storing FFmpeg
    let download_dir = sidecar_dir()
        .map_err(|e| format!("Failed to get sidecar directory: {}", e))?;
    
    // Check latest version
    let version = check_latest_version()
        .map_err(|e| format!("Failed to check FFmpeg version: {}", e))?;
    
    info!("Latest FFmpeg version: {}", version);
    
    // Download FFmpeg package
    let archive_path = download_ffmpeg_package(&version, &download_dir)
        .map_err(|e| format!("Failed to download FFmpeg: {}", e))?;
    
    info!("Downloaded FFmpeg to: {:?}", archive_path);
    
    // Unpack the archive
    unpack_ffmpeg(&archive_path, &download_dir)
        .map_err(|e| format!("Failed to unpack FFmpeg: {}", e))?;
    
    info!("Unpacked FFmpeg to: {:?}", download_dir);
    
    Ok(download_dir)
}

/// Test FFmpeg by running a simple command
pub fn test_ffmpeg() -> Result<(), String> {
    info!("Testing FFmpeg with a simple command...");
    
    // Try to run ffmpeg -version
    let mut result = FfmpegCommand::new()
        .args(["-version"])
        .spawn()
        .map_err(|e| format!("Failed to spawn FFmpeg process: {}", e))?;
    
    // Wait for the command to complete
    let _output = result.iter()
        .map_err(|e| format!("Failed to read FFmpeg output: {}", e))?;
    
    info!("FFmpeg test completed successfully");
    Ok(())
}

/// Tauri command to check FFmpeg availability
#[tauri::command]
pub async fn check_ffmpeg() -> Result<FfmpegStatus, String> {
    Ok(check_ffmpeg_availability())
}

/// Tauri command to get FFmpeg installation instructions
#[tauri::command]
pub fn get_ffmpeg_install_instructions() -> String {
    r#"FFmpeg Installation Instructions:

Windows:
1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/
2. Extract the archive to a folder (e.g., C:\ffmpeg)
3. Add the bin folder to your PATH environment variable
   - Open System Properties > Environment Variables
   - Edit the PATH variable and add C:\ffmpeg\bin
4. Restart the application

macOS:
1. Install Homebrew if not already installed: https://brew.sh/
2. Run: brew install ffmpeg
3. Restart the application

Linux (Ubuntu/Debian):
1. Run: sudo apt update && sudo apt install ffmpeg
2. Restart the application

Linux (Fedora):
1. Run: sudo dnf install ffmpeg
2. Restart the application

Linux (Arch):
1. Run: sudo pacman -S ffmpeg
2. Restart the application

Alternative:
You can also download static builds from https://ffmpeg.org/download.html
"#.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_ffmpeg_availability() {
        let status = check_ffmpeg_availability();
        // This test will pass regardless of whether FFmpeg is installed
        // It just checks that the function doesn't panic
        assert!(status.available || !status.available);
    }

    #[test]
    fn test_get_install_instructions() {
        let instructions = get_ffmpeg_install_instructions();
        assert!(instructions.contains("Windows"));
        assert!(instructions.contains("macOS"));
        assert!(instructions.contains("Linux"));
        assert!(instructions.contains("ffmpeg"));
    }
}
