mod database;
mod metadata;
mod scanner;
mod thumbnail;

use tauri::Manager;

/// Tauri command to scan a folder for images
#[tauri::command]
fn scan_folder(folder_path: String) -> Result<scanner::ScanResult, String> {
    scanner::scan_folder(&folder_path)
}

/// Tauri command to extract metadata from an image
#[tauri::command]
fn extract_metadata(image_path: String) -> Result<metadata::ImageMetadata, String> {
    metadata::extract_metadata(&image_path)
}

/// Tauri command to generate thumbnails for an image
#[tauri::command]
fn generate_thumbnails(
    image_path: String,
    app_handle: tauri::AppHandle,
) -> Result<thumbnail::ThumbnailPaths, String> {
    // Get the app data directory for thumbnail cache
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let cache_dir = app_data_dir.join("thumbnails");
    
    thumbnail::generate_thumbnails(&image_path, &cache_dir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![scan_folder, extract_metadata, generate_thumbnails])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize database
      let app_data_dir = app.path().app_data_dir()?;
      std::fs::create_dir_all(&app_data_dir)?;
      let db_path = app_data_dir.join("cura.db");
      
      let db = database::Database::new(db_path)
        .expect("Failed to initialize database");
      
      // Store database in app state
      app.manage(db);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
