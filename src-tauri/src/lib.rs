mod auth;
mod database;
mod ffmpeg;
mod logging;
mod metadata;
mod migrations;
mod performance;
mod scanner;
mod settings;
mod sync;
pub mod thumbnail; // Made public for performance tests
mod updater;

use tauri::Manager;
use tauri::Emitter;

/// Tauri command to scan a folder for media files (images and videos)
#[tauri::command]
fn scan_folder(folder_path: String, config: Option<settings::FormatConfig>) -> Result<scanner::ScanResult, String> {
    logging::log_info("scanner", &format!("Starting scan of folder: {}", folder_path));
    
    match scanner::scan_folder(&folder_path, config) {
        Ok(result) => {
            logging::log_info("scanner", &format!(
                "Scan completed: {} total media files found ({} images, {} videos), {} errors", 
                result.total_count, 
                result.image_count, 
                result.video_count, 
                result.errors.len()
            ));
            
            // Log any errors encountered during scanning
            for error in &result.errors {
                logging::log_warning("scanner", &format!("Scan error at {}: {}", error.path, error.message));
            }
            
            Ok(result)
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("scanner", "Failed to scan folder", &io_error);
            Err(logging::user_friendly_error(&io_error))
        }
    }
}

/// Tauri command to extract metadata from an image
#[tauri::command]
fn extract_metadata(image_path: String) -> Result<metadata::ImageMetadata, String> {
    logging::log_debug("metadata", &format!("Extracting metadata from: {}", image_path));
    
    match metadata::extract_metadata(&image_path) {
        Ok(metadata) => {
            logging::log_debug("metadata", &format!("Metadata extracted successfully for: {}", image_path));
            Ok(metadata)
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("metadata", &format!("Failed to extract metadata from: {}", image_path), &io_error);
            Err(logging::user_friendly_error(&io_error))
        }
    }
}

/// Tauri command to extract metadata from a video file
#[tauri::command]
fn extract_video_metadata(video_path: String) -> Result<metadata::ImageMetadata, String> {
    logging::log_debug("metadata", &format!("Extracting video metadata from: {}", video_path));
    
    match metadata::extract_video_metadata(&video_path) {
        Ok(metadata) => {
            logging::log_debug("metadata", &format!("Video metadata extracted successfully for: {}", video_path));
            Ok(metadata)
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("metadata", &format!("Failed to extract video metadata from: {}", video_path), &io_error);
            Err(logging::user_friendly_error(&io_error))
        }
    }
}

/// Tauri command to generate thumbnails for an image
#[tauri::command]
fn generate_thumbnails(
    image_path: String,
    app_handle: tauri::AppHandle,
) -> Result<thumbnail::ThumbnailPaths, String> {
    logging::log_debug("thumbnail", &format!("Generating thumbnails for: {}", image_path));
    
    // Get the app data directory for thumbnail cache
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| {
            logging::log_error("thumbnail", "Failed to get app data directory", &e);
            logging::user_friendly_error(&e)
        })?;
    
    let cache_dir = app_data_dir.join("thumbnails");
    
    match thumbnail::generate_thumbnails(&image_path, &cache_dir) {
        Ok(paths) => {
            logging::log_debug("thumbnail", &format!("Thumbnails generated successfully for: {}", image_path));
            Ok(paths)
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("thumbnail", &format!("Failed to generate thumbnails for: {}", image_path), &io_error);
            Err(logging::user_friendly_error(&io_error))
        }
    }
}

/// Tauri command to generate thumbnails for a video file
#[tauri::command]
fn generate_video_thumbnails(
    video_path: String,
    app_handle: tauri::AppHandle,
) -> Result<thumbnail::ThumbnailPaths, String> {
    logging::log_debug("thumbnail", &format!("Generating video thumbnails for: {}", video_path));
    
    // Get the app data directory for thumbnail cache
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| {
            logging::log_error("thumbnail", "Failed to get app data directory", &e);
            logging::user_friendly_error(&e)
        })?;
    
    let cache_dir = app_data_dir.join("thumbnails");
    
    match thumbnail::generate_video_thumbnails(&video_path, &cache_dir) {
        Ok(paths) => {
            logging::log_debug("thumbnail", &format!("Video thumbnails generated successfully for: {}", video_path));
            Ok(paths)
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("thumbnail", &format!("Failed to generate video thumbnails for: {}", video_path), &io_error);
            Err(logging::user_friendly_error(&io_error))
        }
    }
}

/// Tauri command to get codec performance metrics
#[tauri::command]
fn get_codec_performance_metrics() -> Vec<thumbnail::CodecPerformanceMetrics> {
    logging::log_debug("thumbnail", "Getting codec performance metrics");
    thumbnail::get_codec_performance_metrics()
}

/// Tauri command to reset codec performance metrics
#[tauri::command]
fn reset_codec_performance_metrics() {
    logging::log_debug("thumbnail", "Resetting codec performance metrics");
    thumbnail::reset_codec_performance_metrics();
}

/// Tauri command to save tags for an image
#[tauri::command]
fn save_tags(
    image_id: i64,
    tags: Vec<(String, f64)>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    logging::log_debug("tags", &format!("Saving {} tags for image ID: {}", tags.len(), image_id));
    
    let db = app_handle.state::<database::Database>();
    
    for (label, confidence) in tags {
        db.insert_tag(image_id, &label, confidence)
            .map_err(|e| {
                logging::log_error("tags", &format!("Failed to insert tag '{}' for image {}", label, image_id), &e);
                logging::user_friendly_error(&e)
            })?;
    }
    
    logging::log_debug("tags", &format!("Tags saved successfully for image ID: {}", image_id));
    Ok(())
}

/// Tauri command to search images with filters
#[tauri::command]
fn search_images(
    text: Option<String>,
    tags: Option<Vec<String>>,
    date_start: Option<String>,
    date_end: Option<String>,
    camera_model: Option<String>,
    media_type: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<Vec<database::ImageRecord>, String> {
    logging::log_debug("search", "Executing image search");
    
    let db = app_handle.state::<database::Database>();
    
    // Parse date range if provided
    let date_range = if let (Some(start_str), Some(end_str)) = (date_start, date_end) {
        let start = chrono::DateTime::parse_from_rfc3339(&start_str)
            .map_err(|e| {
                logging::log_warning("search", &format!("Invalid start date format: {}", e));
                format!("Invalid start date: {}", e)
            })?
            .with_timezone(&chrono::Utc);
        let end = chrono::DateTime::parse_from_rfc3339(&end_str)
            .map_err(|e| {
                logging::log_warning("search", &format!("Invalid end date format: {}", e));
                format!("Invalid end date: {}", e)
            })?
            .with_timezone(&chrono::Utc);
        Some((start, end))
    } else {
        None
    };
    
    // Parse media type if provided
    let parsed_media_type = media_type.and_then(|mt| {
        match mt.to_lowercase().as_str() {
            "image" => Some(database::MediaType::Image),
            "video" => Some(database::MediaType::Video),
            "all" | "" => None, // "all" means no filter
            _ => {
                logging::log_warning("search", &format!("Invalid media type: {}", mt));
                None
            }
        }
    });
    
    // Build filter
    let filter = database::ImageFilter {
        date_range,
        location: None, // Location filtering not implemented yet
        tags,
        camera_model,
        media_type: parsed_media_type,
    };
    
    // Query database
    let mut images = db.query_images(&filter)
        .map_err(|e| {
            logging::log_error("search", "Failed to query images", &e);
            logging::user_friendly_error(&e)
        })?;
    
    // If text search is provided, filter by text in tags (simple implementation)
    if let Some(search_text) = text {
        let search_lower = search_text.to_lowercase();
        images.retain(|img| {
            // Get tags for this image
            if let Ok(img_tags) = db.get_tags_for_image(img.id) {
                img_tags.iter().any(|tag| tag.label.to_lowercase().contains(&search_lower))
            } else {
                false
            }
        });
    }
    
    logging::log_debug("search", &format!("Search completed: {} results found", images.len()));
    Ok(images)
}

/// Tauri command to get tags for an image
#[tauri::command]
fn get_image_tags(
    image_id: i64,
    app_handle: tauri::AppHandle,
) -> Result<Vec<database::Tag>, String> {
    let db = app_handle.state::<database::Database>();
    
    db.get_tags_for_image(image_id)
        .map_err(|e| {
            logging::log_error("tags", &format!("Failed to get tags for image {}", image_id), &e);
            logging::user_friendly_error(&e)
        })
}

/// Tauri command to get an image by ID
#[tauri::command]
fn get_image_by_id(
    image_id: i64,
    app_handle: tauri::AppHandle,
) -> Result<Option<database::ImageRecord>, String> {
    let db = app_handle.state::<database::Database>();
    
    db.get_image_by_id(image_id)
        .map_err(|e| {
            logging::log_error("database", &format!("Failed to get image {}", image_id), &e);
            logging::user_friendly_error(&e)
        })
}

/// Tauri command to save an embedding for an image
#[tauri::command]
fn save_embedding(
    image_id: i64,
    embedding: Vec<f64>,
    model_version: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    logging::log_debug("embeddings", &format!("Saving embedding for image ID: {}", image_id));
    
    let db = app_handle.state::<database::Database>();
    
    // Convert embedding to bytes
    let embedding_bytes: Vec<u8> = embedding
        .iter()
        .flat_map(|f| f.to_le_bytes())
        .collect();
    
    let conn = db.connection().lock().unwrap();
    
    // Insert or replace embedding
    conn.execute(
        "INSERT OR REPLACE INTO embeddings (image_id, embedding, model_version) VALUES (?1, ?2, ?3)",
        rusqlite::params![image_id, embedding_bytes, model_version],
    )
    .map_err(|e| {
        logging::log_error("embeddings", &format!("Failed to save embedding for image {}", image_id), &e);
        logging::user_friendly_error(&e)
    })?;
    
    logging::log_debug("embeddings", &format!("Embedding saved successfully for image ID: {}", image_id));
    Ok(())
}

/// Tauri command to get embeddings for all images
#[tauri::command]
fn get_all_embeddings(
    app_handle: tauri::AppHandle,
) -> Result<Vec<(i64, Vec<f64>)>, String> {
    logging::log_debug("embeddings", "Retrieving all embeddings");
    
    let db = app_handle.state::<database::Database>();
    let conn = db.connection().lock().unwrap();
    
    let mut stmt = conn
        .prepare("SELECT image_id, embedding FROM embeddings")
        .map_err(|e| {
            logging::log_error("embeddings", "Failed to prepare statement", &e);
            logging::user_friendly_error(&e)
        })?;
    
    let embeddings = stmt
        .query_map([], |row| {
            let image_id: i64 = row.get(0)?;
            let embedding_bytes: Vec<u8> = row.get(1)?;
            
            // Convert bytes back to f64 vector
            let embedding: Vec<f64> = embedding_bytes
                .chunks_exact(8)
                .map(|chunk| {
                    let bytes: [u8; 8] = chunk.try_into().unwrap();
                    f64::from_le_bytes(bytes)
                })
                .collect();
            
            Ok((image_id, embedding))
        })
        .map_err(|e| {
            logging::log_error("embeddings", "Failed to query embeddings", &e);
            logging::user_friendly_error(&e)
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to collect embeddings: {}", e));
            logging::log_error("embeddings", "Failed to collect embeddings", &io_error);
            logging::user_friendly_error(&io_error)
        })?;
    
    logging::log_debug("embeddings", &format!("Retrieved {} embeddings", embeddings.len()));
    Ok(embeddings)
}

/// Tauri command to authenticate with Google Drive
#[tauri::command]
async fn authenticate_google_drive(
    app_handle: tauri::AppHandle,
) -> Result<auth::AuthStatus, String> {
    logging::log_info("auth", "Starting Google Drive authentication");
    
    // For now, use placeholder credentials - in production, these should be configured
    let client_id = std::env::var("GOOGLE_CLIENT_ID")
        .unwrap_or_else(|_| "placeholder_client_id".to_string());
    let client_secret = std::env::var("GOOGLE_CLIENT_SECRET")
        .unwrap_or_else(|_| "placeholder_client_secret".to_string());

    let auth = auth::GoogleDriveAuth::new(client_id, client_secret);

    // Start OAuth flow and get authorization URL
    let auth_url = auth.start_auth_flow().map_err(|e| {
        let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
        logging::log_error("auth", "Failed to start OAuth flow", &io_error);
        logging::user_friendly_error(&io_error)
    })?;

    // Open browser window for user authorization
    if let Err(e) = open::that(&auth_url) {
        logging::log_error("auth", "Failed to open browser", &e);
        return Ok(auth::AuthStatus {
            success: false,
            message: format!("Failed to open browser: {}", e),
        });
    }

    // Store auth manager in app state for callback handling
    app_handle.manage(auth);

    logging::log_info("auth", "Authorization URL opened successfully");
    Ok(auth::AuthStatus {
        success: true,
        message: format!("Authorization URL opened: {}", auth_url),
    })
}

/// Tauri command to handle OAuth callback
#[tauri::command]
async fn handle_oauth_callback(
    code: String,
    state: String,
    app_handle: tauri::AppHandle,
) -> Result<auth::AuthStatus, String> {
    logging::log_info("auth", "Handling OAuth callback");
    
    let auth = app_handle.state::<auth::GoogleDriveAuth>();

    match auth.handle_callback(code, state).await {
        Ok(_) => {
            logging::log_info("auth", "Authentication successful");
            Ok(auth::AuthStatus {
                success: true,
                message: "Authentication successful".to_string(),
            })
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("auth", "Authentication failed", &io_error);
            Ok(auth::AuthStatus {
                success: false,
                message: format!("Authentication failed: {}", e),
            })
        }
    }
}

/// Tauri command to check if user is authenticated
#[tauri::command]
fn is_authenticated(_app_handle: tauri::AppHandle) -> Result<bool, String> {
    let client_id = std::env::var("GOOGLE_CLIENT_ID")
        .unwrap_or_else(|_| "placeholder_client_id".to_string());
    let client_secret = std::env::var("GOOGLE_CLIENT_SECRET")
        .unwrap_or_else(|_| "placeholder_client_secret".to_string());

    let auth = auth::GoogleDriveAuth::new(client_id, client_secret);

    match auth.get_tokens() {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Tauri command to sync images to Google Drive
#[tauri::command]
async fn sync_to_drive(
    image_ids: Vec<i64>,
    app_handle: tauri::AppHandle,
) -> Result<sync::SyncResult, String> {
    logging::log_info("sync", &format!("Starting sync of {} images to Google Drive", image_ids.len()));
    
    let client_id = std::env::var("GOOGLE_CLIENT_ID")
        .unwrap_or_else(|_| "placeholder_client_id".to_string());
    let client_secret = std::env::var("GOOGLE_CLIENT_SECRET")
        .unwrap_or_else(|_| "placeholder_client_secret".to_string());

    let auth = std::sync::Arc::new(auth::GoogleDriveAuth::new(client_id, client_secret));
    let db = app_handle.state::<database::Database>();

    let sync_manager = sync::CloudSyncManager::new(auth, db.inner());

    // Create progress callback that emits events
    let app_handle_clone = app_handle.clone();
    let progress_callback = move |progress: sync::SyncProgress| {
        let _ = app_handle_clone.emit("sync-progress", progress);
    };

    match sync_manager.sync_to_drive(image_ids, progress_callback).await {
        Ok(result) => {
            logging::log_info("sync", &format!("Sync completed: {} uploaded, {} skipped, {} failed", 
                result.uploaded, result.skipped, result.failed.len()));
            
            // Log any failures
            for error in &result.failed {
                logging::log_warning("sync", &format!("Sync failed for image {}: {}", error.image_id, error.error));
            }
            
            Ok(result)
        }
        Err(e) => {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("sync", "Sync operation failed", &io_error);
            Err(logging::user_friendly_error(&io_error))
        }
    }
}

/// Tauri command to get current settings
#[tauri::command]
fn get_settings(
    app_handle: tauri::AppHandle,
) -> Result<settings::AppSettings, String> {
    logging::log_debug("settings", "Retrieving current settings");
    
    let settings_manager = app_handle.state::<settings::SettingsManager>();
    
    settings_manager.get_settings()
        .map_err(|e| {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("settings", "Failed to get settings", &io_error);
            logging::user_friendly_error(&io_error)
        })
}

/// Tauri command to save settings
#[tauri::command]
fn save_settings(
    new_settings: settings::AppSettings,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    logging::log_info("settings", "Saving settings");
    
    let settings_manager = app_handle.state::<settings::SettingsManager>();
    
    settings_manager.save_settings(new_settings)
        .map_err(|e| {
            let io_error = std::io::Error::new(std::io::ErrorKind::Other, e.clone());
            logging::log_error("settings", "Failed to save settings", &io_error);
            e // Return original error message for validation errors
        })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      scan_folder, 
      extract_metadata,
      extract_video_metadata,
      generate_thumbnails,
      generate_video_thumbnails,
      get_codec_performance_metrics,
      reset_codec_performance_metrics,
      save_tags,
      search_images,
      get_image_tags,
      get_image_by_id,
      save_embedding,
      get_all_embeddings,
      authenticate_google_drive,
      handle_oauth_callback,
      is_authenticated,
      sync_to_drive,
      get_settings,
      save_settings,
      settings::get_format_config,
      settings::set_format_config,
      settings::get_default_formats,
      ffmpeg::check_ffmpeg,
      ffmpeg::get_ffmpeg_install_instructions,
      updater::check_for_updates,
      updater::install_update
    ])
    .setup(|app| {
      // Start performance timer for startup
      let startup_timer = performance::Timer::new();

      // Get app data directory
      let app_data_dir = app.path().app_data_dir()?;
      std::fs::create_dir_all(&app_data_dir)?;

      // Initialize logging with rotating file output
      let log_dir = app_data_dir.join("logs");
      std::fs::create_dir_all(&log_dir)?;
      
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::LogDir { file_name: Some("cura".to_string()) }
          ))
          .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
          .max_file_size(10_000_000) // 10MB per file
          .build(),
      )?;

      // Initialize our logging module
      logging::init_logging(&app_data_dir)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

      logging::log_info("app", "Application starting up");

      // Initialize database
      let db_path = app_data_dir.join("cura.db");
      
      let db = database::Database::new(db_path)
        .map_err(|e| {
          logging::log_error("database", "Failed to initialize database", &e);
          std::io::Error::new(std::io::ErrorKind::Other, format!("Database initialization failed: {}", e))
        })?;
      
      logging::log_info("database", "Database initialized successfully");
      
      // Store database in app state
      app.manage(db);

      // Initialize settings manager
      let config_path = app_data_dir.join("config.json");
      let settings_manager = settings::SettingsManager::new(config_path)
        .map_err(|e| {
          logging::log_error("settings", "Failed to initialize settings manager", &std::io::Error::new(std::io::ErrorKind::Other, e.clone()));
          std::io::Error::new(std::io::ErrorKind::Other, format!("Settings initialization failed: {}", e))
        })?;
      
      // Set default thumbnail cache path if not configured
      let default_cache_path = app_data_dir.join("thumbnails").to_string_lossy().to_string();
      settings_manager.initialize_with_defaults(&default_cache_path)
        .map_err(|e| {
          logging::log_error("settings", "Failed to initialize default settings", &std::io::Error::new(std::io::ErrorKind::Other, e.clone()));
          std::io::Error::new(std::io::ErrorKind::Other, format!("Default settings initialization failed: {}", e))
        })?;
      
      logging::log_info("settings", "Settings manager initialized successfully");
      
      // Store settings manager in app state
      app.manage(settings_manager);

      // Initialize performance metrics
      let metrics = std::sync::Arc::new(performance::PerformanceMetrics::new());
      app.manage(metrics);

      // Log startup time
      let startup_time = startup_timer.elapsed_ms();
      logging::log_info("app", &format!("Application startup completed in {}ms", startup_time));

      // Verify startup time meets requirement (< 3000ms)
      if startup_time > 3000 {
        logging::log_warning("app", &format!("Startup time {}ms exceeds target of 3000ms", startup_time));
      }

      // Check FFmpeg availability on startup
      let ffmpeg_status = ffmpeg::check_ffmpeg_availability();
      if ffmpeg_status.available {
        if let Some(version) = &ffmpeg_status.version {
          logging::log_info("ffmpeg", &format!("FFmpeg is available: {}", version));
        } else {
          logging::log_info("ffmpeg", "FFmpeg is available");
        }
      } else {
        logging::log_warning("ffmpeg", "FFmpeg is not available - video thumbnail generation will be disabled");
        if let Some(error) = &ffmpeg_status.error {
          logging::log_warning("ffmpeg", error);
        }
      }

      // Check for updates on startup (async, non-blocking)
      let app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        updater::check_updates_on_startup(app_handle).await;
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
