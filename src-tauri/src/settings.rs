use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

/// Application settings configuration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppSettings {
    /// Path to thumbnail cache directory
    pub thumbnail_cache_path: String,
    
    /// AI model selection: "clip" or "mobilenet"
    pub ai_model: String,
    
    /// Cloud sync configuration
    pub sync_config: SyncConfig,
    
    /// Format configuration for media files
    pub format_config: FormatConfig,
}

/// Format configuration for supported media types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatConfig {
    /// Supported image formats (lowercase, no dots)
    pub image_formats: Vec<String>,
    
    /// Supported video formats (lowercase, no dots)
    pub video_formats: Vec<String>,
}

/// Cloud synchronization settings
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SyncConfig {
    /// Whether sync is enabled
    pub enabled: bool,
    
    /// Whether to automatically sync on changes
    pub auto_sync: bool,
    
    /// Sync interval in minutes
    pub sync_interval: u32,
    
    /// Upload quality: "original", "high", or "medium"
    pub upload_quality: String,
    
    /// Glob patterns for files to exclude from sync
    pub exclude_patterns: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            thumbnail_cache_path: String::new(), // Will be set to app data dir
            ai_model: "mobilenet".to_string(),
            sync_config: SyncConfig::default(),
            format_config: FormatConfig::default(),
        }
    }
}

impl Default for FormatConfig {
    fn default() -> Self {
        Self {
            image_formats: vec![
                "jpg".to_string(),
                "jpeg".to_string(),
                "png".to_string(),
                "heic".to_string(),
                "raw".to_string(),
                "cr2".to_string(),
                "nef".to_string(),
                "dng".to_string(),
                "arw".to_string(),
                "webp".to_string(),
                "gif".to_string(),
                "bmp".to_string(),
                "tiff".to_string(),
            ],
            video_formats: vec![
                "mp4".to_string(),
                "mov".to_string(),
                "avi".to_string(),
                "mkv".to_string(),
                "webm".to_string(),
                "flv".to_string(),
                "wmv".to_string(),
                "m4v".to_string(),
                "mpg".to_string(),
                "mpeg".to_string(),
                "3gp".to_string(),
            ],
        }
    }
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            auto_sync: false,
            sync_interval: 60, // 60 minutes
            upload_quality: "high".to_string(),
            exclude_patterns: vec![],
        }
    }
}

/// Settings manager for persisting and loading configuration
pub struct SettingsManager {
    config_path: PathBuf,
    settings: Arc<Mutex<AppSettings>>,
}

impl SettingsManager {
    /// Create a new settings manager with the given config file path
    pub fn new(config_path: PathBuf) -> Result<Self, String> {
        let settings = if config_path.exists() {
            Self::load_from_file(&config_path)?
        } else {
            AppSettings::default()
        };
        
        Ok(Self {
            config_path,
            settings: Arc::new(Mutex::new(settings)),
        })
    }
    
    /// Load settings from file
    fn load_from_file(path: &Path) -> Result<AppSettings, String> {
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;
        
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse settings file: {}", e))
    }
    
    /// Get current settings
    pub fn get_settings(&self) -> Result<AppSettings, String> {
        self.settings
            .lock()
            .map(|s| s.clone())
            .map_err(|e| format!("Failed to lock settings: {}", e))
    }
    
    /// Save settings to file
    pub fn save_settings(&self, new_settings: AppSettings) -> Result<(), String> {
        // Validate settings before saving
        Self::validate_settings(&new_settings)?;
        
        // Update in-memory settings
        {
            let mut settings = self.settings
                .lock()
                .map_err(|e| format!("Failed to lock settings: {}", e))?;
            *settings = new_settings.clone();
        }
        
        // Persist to disk
        let json = serde_json::to_string_pretty(&new_settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;
        
        // Ensure parent directory exists
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
        
        fs::write(&self.config_path, json)
            .map_err(|e| format!("Failed to write settings file: {}", e))?;
        
        Ok(())
    }
    
    /// Validate settings values
    fn validate_settings(settings: &AppSettings) -> Result<(), String> {
        // Validate AI model
        if settings.ai_model != "clip" && settings.ai_model != "mobilenet" {
            return Err(format!(
                "Invalid AI model '{}'. Must be 'clip' or 'mobilenet'.",
                settings.ai_model
            ));
        }
        
        // Validate upload quality
        let valid_qualities = ["original", "high", "medium"];
        if !valid_qualities.contains(&settings.sync_config.upload_quality.as_str()) {
            return Err(format!(
                "Invalid upload quality '{}'. Must be one of: original, high, medium.",
                settings.sync_config.upload_quality
            ));
        }
        
        // Validate sync interval (must be at least 1 minute)
        if settings.sync_config.sync_interval < 1 {
            return Err("Sync interval must be at least 1 minute.".to_string());
        }
        
        // Validate thumbnail cache path is not empty
        if settings.thumbnail_cache_path.trim().is_empty() {
            return Err("Thumbnail cache path cannot be empty.".to_string());
        }
        
        // Validate format configuration
        Self::validate_format_config(&settings.format_config)?;
        
        Ok(())
    }
    
    /// Validate format configuration
    fn validate_format_config(config: &FormatConfig) -> Result<(), String> {
        // Validate image formats
        for format in &config.image_formats {
            Self::validate_format_string(format)?;
        }
        
        // Validate video formats
        for format in &config.video_formats {
            Self::validate_format_string(format)?;
        }
        
        // Ensure at least one format is selected in each category
        if config.image_formats.is_empty() {
            return Err("At least one image format must be selected.".to_string());
        }
        
        if config.video_formats.is_empty() {
            return Err("At least one video format must be selected.".to_string());
        }
        
        Ok(())
    }
    
    /// Validate a single format string (must be lowercase, no dots)
    fn validate_format_string(format: &str) -> Result<(), String> {
        if format.is_empty() {
            return Err("Format string cannot be empty.".to_string());
        }
        
        if format.contains('.') {
            return Err(format!(
                "Format string '{}' cannot contain dots. Use 'jpg' instead of '.jpg'.",
                format
            ));
        }
        
        if format != format.to_lowercase() {
            return Err(format!(
                "Format string '{}' must be lowercase.",
                format
            ));
        }
        
        // Check for invalid characters (only alphanumeric allowed)
        if !format.chars().all(|c| c.is_alphanumeric()) {
            return Err(format!(
                "Format string '{}' contains invalid characters. Only alphanumeric characters are allowed.",
                format
            ));
        }
        
        Ok(())
    }
    
    /// Initialize settings with default thumbnail cache path
    pub fn initialize_with_defaults(&self, default_cache_path: &str) -> Result<(), String> {
        let mut settings = self.get_settings()?;
        
        // Only set default if not already configured
        if settings.thumbnail_cache_path.is_empty() {
            settings.thumbnail_cache_path = default_cache_path.to_string();
            self.save_settings(settings)?;
        }
        
        Ok(())
    }
}

/// Tauri command to get format configuration
#[tauri::command]
pub fn get_format_config(
    settings_manager: tauri::State<Arc<Mutex<SettingsManager>>>,
) -> Result<FormatConfig, String> {
    let manager = settings_manager
        .lock()
        .map_err(|e| format!("Failed to lock settings manager: {}", e))?;
    
    let settings = manager.get_settings()?;
    Ok(settings.format_config)
}

/// Tauri command to set format configuration
#[tauri::command]
pub fn set_format_config(
    config: FormatConfig,
    settings_manager: tauri::State<Arc<Mutex<SettingsManager>>>,
) -> Result<(), String> {
    // Validate format configuration
    SettingsManager::validate_format_config(&config)?;
    
    let manager = settings_manager
        .lock()
        .map_err(|e| format!("Failed to lock settings manager: {}", e))?;
    
    let mut settings = manager.get_settings()?;
    settings.format_config = config;
    manager.save_settings(settings)?;
    
    Ok(())
}

/// Tauri command to get default format configuration
#[tauri::command]
pub fn get_default_formats() -> Result<FormatConfig, String> {
    Ok(FormatConfig::default())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_default_settings() {
        let settings = AppSettings::default();
        assert_eq!(settings.ai_model, "mobilenet");
        assert_eq!(settings.sync_config.enabled, false);
        assert_eq!(settings.sync_config.sync_interval, 60);
        assert_eq!(settings.sync_config.upload_quality, "high");
    }
    
    #[test]
    fn test_validate_settings_valid() {
        let settings = AppSettings {
            thumbnail_cache_path: "/tmp/cache".to_string(),
            ai_model: "clip".to_string(),
            sync_config: SyncConfig {
                enabled: true,
                auto_sync: true,
                sync_interval: 30,
                upload_quality: "original".to_string(),
                exclude_patterns: vec!["*.tmp".to_string()],
            },
            format_config: FormatConfig::default(),
        };
        
        assert!(SettingsManager::validate_settings(&settings).is_ok());
    }
    
    #[test]
    fn test_validate_settings_invalid_model() {
        let settings = AppSettings {
            thumbnail_cache_path: "/tmp/cache".to_string(),
            ai_model: "invalid_model".to_string(),
            sync_config: SyncConfig::default(),
            format_config: FormatConfig::default(),
        };
        
        let result = SettingsManager::validate_settings(&settings);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid AI model"));
    }
    
    #[test]
    fn test_validate_settings_invalid_quality() {
        let settings = AppSettings {
            thumbnail_cache_path: "/tmp/cache".to_string(),
            ai_model: "clip".to_string(),
            sync_config: SyncConfig {
                enabled: true,
                auto_sync: false,
                sync_interval: 60,
                upload_quality: "ultra".to_string(),
                exclude_patterns: vec![],
            },
            format_config: FormatConfig::default(),
        };
        
        let result = SettingsManager::validate_settings(&settings);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid upload quality"));
    }
    
    #[test]
    fn test_validate_settings_invalid_interval() {
        let settings = AppSettings {
            thumbnail_cache_path: "/tmp/cache".to_string(),
            ai_model: "mobilenet".to_string(),
            sync_config: SyncConfig {
                enabled: true,
                auto_sync: false,
                sync_interval: 0,
                upload_quality: "high".to_string(),
                exclude_patterns: vec![],
            },
            format_config: FormatConfig::default(),
        };
        
        let result = SettingsManager::validate_settings(&settings);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("at least 1 minute"));
    }
    
    #[test]
    fn test_validate_settings_empty_cache_path() {
        let settings = AppSettings {
            thumbnail_cache_path: "".to_string(),
            ai_model: "mobilenet".to_string(),
            sync_config: SyncConfig::default(),
            format_config: FormatConfig::default(),
        };
        
        let result = SettingsManager::validate_settings(&settings);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot be empty"));
    }
    
    #[test]
    fn test_save_and_load_settings() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = SettingsManager::new(config_path.clone()).unwrap();
        
        let settings = AppSettings {
            thumbnail_cache_path: "/tmp/thumbnails".to_string(),
            ai_model: "clip".to_string(),
            sync_config: SyncConfig {
                enabled: true,
                auto_sync: true,
                sync_interval: 45,
                upload_quality: "medium".to_string(),
                exclude_patterns: vec!["*.raw".to_string()],
            },
            format_config: FormatConfig::default(),
        };
        
        // Save settings
        manager.save_settings(settings.clone()).unwrap();
        
        // Create new manager to load from file
        let manager2 = SettingsManager::new(config_path).unwrap();
        let loaded_settings = manager2.get_settings().unwrap();
        
        assert_eq!(loaded_settings, settings);
    }
    
    #[test]
    fn test_initialize_with_defaults() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = SettingsManager::new(config_path).unwrap();
        
        // Initialize with default cache path
        manager.initialize_with_defaults("/app/cache").unwrap();
        
        let settings = manager.get_settings().unwrap();
        assert_eq!(settings.thumbnail_cache_path, "/app/cache");
    }
    
    #[test]
    fn test_default_format_config() {
        let config = FormatConfig::default();
        
        // Verify default image formats
        assert!(config.image_formats.contains(&"jpg".to_string()));
        assert!(config.image_formats.contains(&"jpeg".to_string()));
        assert!(config.image_formats.contains(&"png".to_string()));
        assert!(config.image_formats.contains(&"heic".to_string()));
        assert!(config.image_formats.contains(&"raw".to_string()));
        assert_eq!(config.image_formats.len(), 13);
        
        // Verify default video formats
        assert!(config.video_formats.contains(&"mp4".to_string()));
        assert!(config.video_formats.contains(&"mov".to_string()));
        assert!(config.video_formats.contains(&"avi".to_string()));
        assert!(config.video_formats.contains(&"mkv".to_string()));
        assert_eq!(config.video_formats.len(), 11);
    }
    
    #[test]
    fn test_validate_format_string_valid() {
        assert!(SettingsManager::validate_format_string("jpg").is_ok());
        assert!(SettingsManager::validate_format_string("mp4").is_ok());
        assert!(SettingsManager::validate_format_string("heic").is_ok());
    }
    
    #[test]
    fn test_validate_format_string_with_dot() {
        let result = SettingsManager::validate_format_string(".jpg");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot contain dots"));
    }
    
    #[test]
    fn test_validate_format_string_uppercase() {
        let result = SettingsManager::validate_format_string("JPG");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("must be lowercase"));
    }
    
    #[test]
    fn test_validate_format_string_empty() {
        let result = SettingsManager::validate_format_string("");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot be empty"));
    }
    
    #[test]
    fn test_validate_format_string_special_chars() {
        let result = SettingsManager::validate_format_string("jpg-test");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("invalid characters"));
    }
    
    #[test]
    fn test_validate_format_config_valid() {
        let config = FormatConfig {
            image_formats: vec!["jpg".to_string(), "png".to_string()],
            video_formats: vec!["mp4".to_string(), "mov".to_string()],
        };
        assert!(SettingsManager::validate_format_config(&config).is_ok());
    }
    
    #[test]
    fn test_validate_format_config_empty_images() {
        let config = FormatConfig {
            image_formats: vec![],
            video_formats: vec!["mp4".to_string()],
        };
        let result = SettingsManager::validate_format_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("At least one image format"));
    }
    
    #[test]
    fn test_validate_format_config_empty_videos() {
        let config = FormatConfig {
            image_formats: vec!["jpg".to_string()],
            video_formats: vec![],
        };
        let result = SettingsManager::validate_format_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("At least one video format"));
    }
    
    #[test]
    fn test_validate_format_config_invalid_format() {
        let config = FormatConfig {
            image_formats: vec!["jpg".to_string(), ".png".to_string()],
            video_formats: vec!["mp4".to_string()],
        };
        let result = SettingsManager::validate_format_config(&config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot contain dots"));
    }
}


#[cfg(test)]
mod property_tests {
    use super::*;
    use proptest::prelude::*;
    use tempfile::TempDir;
    
    // Feature: cura-photo-manager, Property 24: Settings Persistence Round-Trip
    // Validates: Requirements 12.2, 12.3
    
    fn arb_sync_config() -> impl Strategy<Value = SyncConfig> {
        (
            any::<bool>(),
            any::<bool>(),
            1u32..1000,
            prop_oneof!["original", "high", "medium"],
            prop::collection::vec(any::<String>(), 0..5),
        )
            .prop_map(|(enabled, auto_sync, sync_interval, upload_quality, exclude_patterns)| {
                SyncConfig {
                    enabled,
                    auto_sync,
                    sync_interval,
                    upload_quality: upload_quality.to_string(),
                    exclude_patterns,
                }
            })
    }
    
    fn arb_app_settings() -> impl Strategy<Value = AppSettings> {
        (
            "[a-zA-Z0-9/_-]{5,50}",
            prop_oneof!["clip", "mobilenet"],
            arb_sync_config(),
        )
            .prop_map(|(cache_path, ai_model, sync_config)| {
                AppSettings {
                    thumbnail_cache_path: cache_path.to_string(),
                    ai_model: ai_model.to_string(),
                    sync_config,
                    format_config: FormatConfig::default(),
                }
            })
    }
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn test_settings_persistence_round_trip(settings in arb_app_settings()) {
            let temp_dir = TempDir::new().unwrap();
            let config_path = temp_dir.path().join("config.json");
            
            // Create manager and save settings
            let manager = SettingsManager::new(config_path.clone()).unwrap();
            manager.save_settings(settings.clone()).unwrap();
            
            // Create new manager to simulate application restart
            let manager2 = SettingsManager::new(config_path).unwrap();
            let loaded_settings = manager2.get_settings().unwrap();
            
            // Verify settings are preserved
            prop_assert_eq!(loaded_settings.thumbnail_cache_path, settings.thumbnail_cache_path);
            prop_assert_eq!(loaded_settings.ai_model, settings.ai_model);
            prop_assert_eq!(loaded_settings.sync_config.enabled, settings.sync_config.enabled);
            prop_assert_eq!(loaded_settings.sync_config.auto_sync, settings.sync_config.auto_sync);
            prop_assert_eq!(loaded_settings.sync_config.sync_interval, settings.sync_config.sync_interval);
            prop_assert_eq!(loaded_settings.sync_config.upload_quality, settings.sync_config.upload_quality);
            prop_assert_eq!(loaded_settings.sync_config.exclude_patterns, settings.sync_config.exclude_patterns);
        }
    }

    // Feature: cura-photo-manager, Property 29: Format Configuration Persistence
    // Validates: Requirements 12.2, 12.3 (extended)
    
    fn arb_valid_format_string() -> impl Strategy<Value = String> {
        // Generate valid format strings (lowercase alphanumeric, 2-5 chars)
        "[a-z0-9]{2,5}"
    }
    
    fn arb_format_config() -> impl Strategy<Value = FormatConfig> {
        (
            prop::collection::vec(arb_valid_format_string(), 1..10),
            prop::collection::vec(arb_valid_format_string(), 1..10),
        )
            .prop_map(|(image_formats, video_formats)| {
                FormatConfig {
                    image_formats,
                    video_formats,
                }
            })
    }
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn test_format_configuration_persistence(format_config in arb_format_config()) {
            let temp_dir = TempDir::new().unwrap();
            let config_path = temp_dir.path().join("config.json");
            
            // Create manager with default settings
            let manager = SettingsManager::new(config_path.clone()).unwrap();
            manager.initialize_with_defaults("/tmp/cache").unwrap();
            
            // Get current settings and update format config
            let mut settings = manager.get_settings().unwrap();
            settings.format_config = format_config.clone();
            
            // Save the updated settings
            manager.save_settings(settings).unwrap();
            
            // Simulate application restart by creating a new manager
            let manager2 = SettingsManager::new(config_path).unwrap();
            let loaded_settings = manager2.get_settings().unwrap();
            
            // Verify format configuration is preserved
            prop_assert_eq!(
                loaded_settings.format_config.image_formats,
                format_config.image_formats,
                "Image formats should be preserved after restart"
            );
            prop_assert_eq!(
                loaded_settings.format_config.video_formats,
                format_config.video_formats,
                "Video formats should be preserved after restart"
            );
        }
    }
    
    // Feature: cura-photo-manager, Property 32: Default Format Configuration
    // Validates: Requirements 12.5 (extended)
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn test_default_format_configuration(cache_path in "[a-zA-Z0-9/_-]{5,50}") {
            // Simulate first-time application startup by creating a new settings manager
            // with a non-existent config file
            let temp_dir = TempDir::new().unwrap();
            let config_path = temp_dir.path().join("new_config.json");
            
            // Ensure config file doesn't exist (first-time startup)
            prop_assert!(!config_path.exists(), "Config file should not exist for first-time startup");
            
            // Create settings manager (simulates first-time startup)
            let manager = SettingsManager::new(config_path.clone()).unwrap();
            
            // Initialize with default cache path
            manager.initialize_with_defaults(&cache_path).unwrap();
            
            // Get the settings
            let settings = manager.get_settings().unwrap();
            let format_config = settings.format_config;
            
            // Verify default image formats are present
            let expected_image_formats = vec![
                "jpg", "jpeg", "png", "heic", "raw", "cr2", "nef", "dng", 
                "arw", "webp", "gif", "bmp", "tiff"
            ];
            
            for format in &expected_image_formats {
                prop_assert!(
                    format_config.image_formats.contains(&format.to_string()),
                    "Default configuration should include image format: {}",
                    format
                );
            }
            
            // Verify all common image formats are included
            prop_assert_eq!(
                format_config.image_formats.len(),
                expected_image_formats.len(),
                "Default configuration should include all {} common image formats",
                expected_image_formats.len()
            );
            
            // Verify default video formats are present
            let expected_video_formats = vec![
                "mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", 
                "m4v", "mpg", "mpeg", "3gp"
            ];
            
            for format in &expected_video_formats {
                prop_assert!(
                    format_config.video_formats.contains(&format.to_string()),
                    "Default configuration should include video format: {}",
                    format
                );
            }
            
            // Verify all common video formats are included
            prop_assert_eq!(
                format_config.video_formats.len(),
                expected_video_formats.len(),
                "Default configuration should include all {} common video formats",
                expected_video_formats.len()
            );
            
            // Verify format strings are valid (lowercase, no dots)
            for format in &format_config.image_formats {
                prop_assert!(
                    format == &format.to_lowercase(),
                    "Image format '{}' should be lowercase",
                    format
                );
                prop_assert!(
                    !format.contains('.'),
                    "Image format '{}' should not contain dots",
                    format
                );
            }
            
            for format in &format_config.video_formats {
                prop_assert!(
                    format == &format.to_lowercase(),
                    "Video format '{}' should be lowercase",
                    format
                );
                prop_assert!(
                    !format.contains('.'),
                    "Video format '{}' should not contain dots",
                    format
                );
            }
        }
    }
    
    // Feature: cura-photo-manager, Property 25: Settings Validation
    // Validates: Requirements 12.4
    
    fn arb_invalid_ai_model() -> impl Strategy<Value = String> {
        prop_oneof![
            Just("invalid".to_string()),
            Just("gpt4".to_string()),
            Just("".to_string()),
            Just("CLIP".to_string()), // Wrong case
            Just("MobileNet".to_string()), // Wrong case
        ]
    }
    
    fn arb_invalid_upload_quality() -> impl Strategy<Value = String> {
        prop_oneof![
            Just("ultra".to_string()),
            Just("low".to_string()),
            Just("".to_string()),
            Just("Original".to_string()), // Wrong case
        ]
    }
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        #[test]
        fn test_settings_validation_invalid_ai_model(invalid_model in arb_invalid_ai_model()) {
            let settings = AppSettings {
                thumbnail_cache_path: "/tmp/cache".to_string(),
                ai_model: invalid_model.clone(),
                sync_config: SyncConfig::default(),
                format_config: FormatConfig::default(),
            };
            
            let result = SettingsManager::validate_settings(&settings);
            prop_assert!(result.is_err(), "Expected validation error for AI model: {}", invalid_model);
            
            let error_msg = result.unwrap_err();
            prop_assert!(error_msg.contains("Invalid AI model"), "Error message should mention invalid AI model");
        }
        
        #[test]
        fn test_settings_validation_invalid_upload_quality(invalid_quality in arb_invalid_upload_quality()) {
            let settings = AppSettings {
                thumbnail_cache_path: "/tmp/cache".to_string(),
                ai_model: "clip".to_string(),
                sync_config: SyncConfig {
                    enabled: true,
                    auto_sync: false,
                    sync_interval: 60,
                    upload_quality: invalid_quality.clone(),
                    exclude_patterns: vec![],
                },
                format_config: FormatConfig::default(),
            };
            
            let result = SettingsManager::validate_settings(&settings);
            prop_assert!(result.is_err(), "Expected validation error for upload quality: {}", invalid_quality);
            
            let error_msg = result.unwrap_err();
            prop_assert!(error_msg.contains("Invalid upload quality"), "Error message should mention invalid upload quality");
        }
        
        #[test]
        fn test_settings_validation_invalid_sync_interval(interval in 0u32..1) {
            let settings = AppSettings {
                thumbnail_cache_path: "/tmp/cache".to_string(),
                ai_model: "mobilenet".to_string(),
                sync_config: SyncConfig {
                    enabled: true,
                    auto_sync: false,
                    sync_interval: interval,
                    upload_quality: "high".to_string(),
                    exclude_patterns: vec![],
                },
                format_config: FormatConfig::default(),
            };
            
            let result = SettingsManager::validate_settings(&settings);
            prop_assert!(result.is_err(), "Expected validation error for sync interval: {}", interval);
            
            let error_msg = result.unwrap_err();
            prop_assert!(error_msg.contains("at least 1 minute"), "Error message should mention minimum interval");
        }
        
        #[test]
        fn test_settings_validation_empty_cache_path(empty_path in prop_oneof![Just("".to_string()), Just("   ".to_string())]) {
            let settings = AppSettings {
                thumbnail_cache_path: empty_path.clone(),
                ai_model: "clip".to_string(),
                sync_config: SyncConfig::default(),
                format_config: FormatConfig::default(),
            };
            
            let result = SettingsManager::validate_settings(&settings);
            prop_assert!(result.is_err(), "Expected validation error for empty cache path");
            
            let error_msg = result.unwrap_err();
            prop_assert!(error_msg.contains("cannot be empty"), "Error message should mention empty path");
        }
    }
}
