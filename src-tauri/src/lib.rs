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

/// Tauri command to save tags for an image
#[tauri::command]
fn save_tags(
    image_id: i64,
    tags: Vec<(String, f64)>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let db = app_handle.state::<database::Database>();
    
    for (label, confidence) in tags {
        db.insert_tag(image_id, &label, confidence)
            .map_err(|e| format!("Failed to insert tag: {}", e))?;
    }
    
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
    app_handle: tauri::AppHandle,
) -> Result<Vec<database::ImageRecord>, String> {
    let db = app_handle.state::<database::Database>();
    
    // Parse date range if provided
    let date_range = if let (Some(start_str), Some(end_str)) = (date_start, date_end) {
        let start = chrono::DateTime::parse_from_rfc3339(&start_str)
            .map_err(|e| format!("Invalid start date: {}", e))?
            .with_timezone(&chrono::Utc);
        let end = chrono::DateTime::parse_from_rfc3339(&end_str)
            .map_err(|e| format!("Invalid end date: {}", e))?
            .with_timezone(&chrono::Utc);
        Some((start, end))
    } else {
        None
    };
    
    // Build filter
    let filter = database::ImageFilter {
        date_range,
        location: None, // Location filtering not implemented yet
        tags,
        camera_model,
    };
    
    // Query database
    let mut images = db.query_images(&filter)
        .map_err(|e| format!("Failed to query images: {}", e))?;
    
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
        .map_err(|e| format!("Failed to get tags: {}", e))
}

/// Tauri command to get an image by ID
#[tauri::command]
fn get_image_by_id(
    image_id: i64,
    app_handle: tauri::AppHandle,
) -> Result<Option<database::ImageRecord>, String> {
    let db = app_handle.state::<database::Database>();
    
    db.get_image_by_id(image_id)
        .map_err(|e| format!("Failed to get image: {}", e))
}

/// Tauri command to save an embedding for an image
#[tauri::command]
fn save_embedding(
    image_id: i64,
    embedding: Vec<f64>,
    model_version: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
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
    .map_err(|e| format!("Failed to save embedding: {}", e))?;
    
    Ok(())
}

/// Tauri command to get embeddings for all images
#[tauri::command]
fn get_all_embeddings(
    app_handle: tauri::AppHandle,
) -> Result<Vec<(i64, Vec<f64>)>, String> {
    let db = app_handle.state::<database::Database>();
    let conn = db.connection().lock().unwrap();
    
    let mut stmt = conn
        .prepare("SELECT image_id, embedding FROM embeddings")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
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
        .map_err(|e| format!("Failed to query embeddings: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect embeddings: {}", e))?;
    
    Ok(embeddings)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      scan_folder, 
      extract_metadata, 
      generate_thumbnails, 
      save_tags,
      search_images,
      get_image_tags,
      get_image_by_id,
      save_embedding,
      get_all_embeddings
    ])
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
