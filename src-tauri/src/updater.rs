use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub date: String,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStatus {
    pub available: bool,
    pub info: Option<UpdateInfo>,
    pub error: Option<String>,
}

/// Check for available updates
#[tauri::command]
pub async fn check_for_updates(_app: AppHandle) -> Result<UpdateStatus, String> {
    // Note: The actual updater implementation depends on having a proper update server
    // For now, return a status indicating no updates available
    // In production, this would use tauri_plugin_updater::UpdaterExt
    
    #[cfg(target_os = "linux")]
    {
        return Ok(UpdateStatus {
            available: false,
            info: None,
            error: Some("Auto-update is not supported on Linux. Please update manually.".to_string()),
        });
    }
    
    #[cfg(not(target_os = "linux"))]
    {
        // Placeholder implementation - in production, this would check the update server
        Ok(UpdateStatus {
            available: false,
            info: None,
            error: None,
        })
    }
}

/// Download and install an available update
#[tauri::command]
pub async fn install_update(_app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        return Err("Auto-update is not supported on Linux".to_string());
    }
    
    #[cfg(not(target_os = "linux"))]
    {
        // Placeholder implementation - in production, this would download and install
        Err("Update installation not yet configured. Please configure the update server.".to_string())
    }
}

/// Check for updates on application startup
pub async fn check_updates_on_startup(app: AppHandle) {
    // Wait a few seconds after startup before checking
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    
    match check_for_updates(app.clone()).await {
        Ok(status) => {
            if status.available {
                // Emit event to notify frontend
                let _ = app.emit("update-available", status);
            }
        }
        Err(e) => {
            tracing::warn!("Failed to check for updates on startup: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_update_status_serialization() {
        let status = UpdateStatus {
            available: true,
            info: Some(UpdateInfo {
                version: "1.0.0".to_string(),
                current_version: "0.1.0".to_string(),
                date: "2026-01-31".to_string(),
                body: "New features and bug fixes".to_string(),
            }),
            error: None,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("1.0.0"));
        assert!(json.contains("0.1.0"));
    }

    #[test]
    fn test_update_status_with_error() {
        let status = UpdateStatus {
            available: false,
            info: None,
            error: Some("Network error".to_string()),
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("Network error"));
    }
}
