use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
    RedirectUrl, Scope, TokenResponse, TokenUrl,
};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const REDIRECT_URI: &str = "http://localhost:8080/oauth/callback";
const KEYRING_SERVICE: &str = "cura-photo-manager";
const KEYRING_ACCESS_TOKEN: &str = "google-drive-access-token";
const KEYRING_REFRESH_TOKEN: &str = "google-drive-refresh-token";
const KEYRING_EXPIRES_AT: &str = "google-drive-expires-at";

/// OAuth token storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenData {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: u64, // Unix timestamp
}

/// Authentication status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthStatus {
    pub success: bool,
    pub message: String,
}

/// OAuth state manager for handling callbacks
pub struct OAuthState {
    pub csrf_token: Option<String>,
    pub pkce_verifier: Option<String>,
}

impl OAuthState {
    pub fn new() -> Self {
        Self {
            csrf_token: None,
            pkce_verifier: None,
        }
    }
}

/// Google Drive authentication manager
pub struct GoogleDriveAuth {
    client_id: String,
    client_secret: String,
    oauth_state: Arc<Mutex<OAuthState>>,
}

impl GoogleDriveAuth {
    /// Create a new GoogleDriveAuth instance
    pub fn new(client_id: String, client_secret: String) -> Self {
        Self {
            client_id,
            client_secret,
            oauth_state: Arc::new(Mutex::new(OAuthState::new())),
        }
    }

    /// Build OAuth client
    fn build_oauth_client(&self) -> Result<BasicClient, String> {
        let client_id = ClientId::new(self.client_id.clone());
        let client_secret = Some(ClientSecret::new(self.client_secret.clone()));
        let auth_url = AuthUrl::new(GOOGLE_AUTH_URL.to_string())
            .map_err(|e| format!("Invalid authorization URL: {}", e))?;
        let token_url = Some(TokenUrl::new(GOOGLE_TOKEN_URL.to_string())
            .map_err(|e| format!("Invalid token URL: {}", e))?);

        let redirect_url = RedirectUrl::new(REDIRECT_URI.to_string())
            .map_err(|e| format!("Invalid redirect URL: {}", e))?;

        Ok(BasicClient::new(client_id, client_secret, auth_url, token_url)
            .set_redirect_uri(redirect_url))
    }

    /// Start OAuth flow and return authorization URL
    pub fn start_auth_flow(&self) -> Result<String, String> {
        let client = self.build_oauth_client()?;

        // Generate PKCE challenge
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        // Generate authorization URL
        let (auth_url, csrf_token) = client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new(
                "https://www.googleapis.com/auth/drive.file".to_string(),
            ))
            .set_pkce_challenge(pkce_challenge)
            .url();

        // Store state for callback verification
        let mut state = self.oauth_state.lock().unwrap();
        state.csrf_token = Some(csrf_token.secret().clone());
        state.pkce_verifier = Some(pkce_verifier.secret().clone());

        Ok(auth_url.to_string())
    }

    /// Handle OAuth callback and exchange code for tokens
    pub async fn handle_callback(
        &self,
        code: String,
        state: String,
    ) -> Result<TokenData, String> {
        // Verify CSRF token and get PKCE verifier
        let pkce_verifier = {
            let oauth_state = self.oauth_state.lock().unwrap();
            let expected_csrf = oauth_state
                .csrf_token
                .as_ref()
                .ok_or("No CSRF token found")?;

            if &state != expected_csrf {
                return Err("CSRF token mismatch".to_string());
            }

            oauth_state
                .pkce_verifier
                .as_ref()
                .ok_or("No PKCE verifier found")?
                .clone()
        }; // Lock is dropped here

        let client = self.build_oauth_client()?;

        // Exchange authorization code for access token
        let token_result = client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(oauth2::PkceCodeVerifier::new(pkce_verifier))
            .request_async(async_http_client)
            .await
            .map_err(|e| format!("Failed to exchange code for token: {}", e))?;

        let access_token = token_result.access_token().secret().clone();
        let refresh_token = token_result
            .refresh_token()
            .map(|t| t.secret().clone());

        // Calculate expiration time
        let expires_in = token_result
            .expires_in()
            .unwrap_or(Duration::from_secs(3600));
        let expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            + expires_in.as_secs();

        let token_data = TokenData {
            access_token,
            refresh_token,
            expires_at,
        };

        // Store tokens in keychain
        self.store_tokens(&token_data)?;

        Ok(token_data)
    }

    /// Store tokens in system keychain
    fn store_tokens(&self, token_data: &TokenData) -> Result<(), String> {
        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCESS_TOKEN)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        entry
            .set_password(&token_data.access_token)
            .map_err(|e| format!("Failed to store access token: {}", e))?;

        if let Some(ref refresh_token) = token_data.refresh_token {
            let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_REFRESH_TOKEN)
                .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
            entry
                .set_password(refresh_token)
                .map_err(|e| format!("Failed to store refresh token: {}", e))?;
        }

        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_EXPIRES_AT)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        entry
            .set_password(&token_data.expires_at.to_string())
            .map_err(|e| format!("Failed to store expiration time: {}", e))?;

        Ok(())
    }

    /// Retrieve tokens from system keychain
    pub fn get_tokens(&self) -> Result<TokenData, String> {
        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCESS_TOKEN)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        let access_token = entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve access token: {}", e))?;

        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_REFRESH_TOKEN)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        let refresh_token = entry.get_password().ok();

        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_EXPIRES_AT)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        let expires_at_str = entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve expiration time: {}", e))?;
        let expires_at = expires_at_str
            .parse::<u64>()
            .map_err(|e| format!("Failed to parse expiration time: {}", e))?;

        Ok(TokenData {
            access_token,
            refresh_token,
            expires_at,
        })
    }

    /// Check if access token is expired
    pub fn is_token_expired(&self) -> Result<bool, String> {
        let token_data = self.get_tokens()?;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Consider token expired if it expires within 5 minutes
        Ok(now + 300 >= token_data.expires_at)
    }

    /// Refresh access token using refresh token
    pub async fn refresh_token(&self) -> Result<TokenData, String> {
        let token_data = self.get_tokens()?;
        let refresh_token = token_data
            .refresh_token
            .as_ref()
            .ok_or("No refresh token available")?
            .clone();

        let client = self.build_oauth_client()?;

        let token_result = client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token))
            .request_async(async_http_client)
            .await
            .map_err(|e| format!("Failed to refresh token: {}", e))?;

        let access_token = token_result.access_token().secret().clone();
        let new_refresh_token = token_result
            .refresh_token()
            .map(|t| t.secret().clone())
            .or(token_data.refresh_token); // Keep old refresh token if new one not provided

        let expires_in = token_result
            .expires_in()
            .unwrap_or(Duration::from_secs(3600));
        let expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            + expires_in.as_secs();

        let new_token_data = TokenData {
            access_token,
            refresh_token: new_refresh_token,
            expires_at,
        };

        // Update stored tokens
        self.store_tokens(&new_token_data)?;

        Ok(new_token_data)
    }

    /// Get valid access token (refresh if expired)
    pub async fn get_valid_access_token(&self) -> Result<String, String> {
        if self.is_token_expired()? {
            let token_data = self.refresh_token().await?;
            Ok(token_data.access_token)
        } else {
            let token_data = self.get_tokens()?;
            Ok(token_data.access_token)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_oauth_state_creation() {
        let state = OAuthState::new();
        assert!(state.csrf_token.is_none());
        assert!(state.pkce_verifier.is_none());
    }

    #[test]
    fn test_auth_manager_creation() {
        let auth = GoogleDriveAuth::new(
            "test_client_id".to_string(),
            "test_client_secret".to_string(),
        );
        assert_eq!(auth.client_id, "test_client_id");
        assert_eq!(auth.client_secret, "test_client_secret");
    }

    // Property test generators
    fn arb_token_data() -> impl Strategy<Value = TokenData> {
        (
            "[a-zA-Z0-9]{20,100}",
            proptest::option::of("[a-zA-Z0-9]{20,100}"),
            1000000000u64..2000000000u64,
        )
            .prop_map(|(access_token, refresh_token, expires_at)| TokenData {
                access_token,
                refresh_token,
                expires_at,
            })
    }

    // Feature: cura-photo-manager, Property 18: Token Persistence
    // Validates: Requirements 7.2
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        #[test]
        fn test_token_persistence_roundtrip(token_data in arb_token_data()) {
            // Create a unique service name for this test to avoid conflicts
            let test_service = format!("cura-test-{}", uuid::Uuid::new_v4());
            
            // Store tokens using a test keyring service
            let store_result = store_tokens_with_service(&test_service, &token_data);
            prop_assert!(store_result.is_ok(), "Failed to store tokens: {:?}", store_result.err());

            // Retrieve tokens
            let retrieved = get_tokens_with_service(&test_service);
            prop_assert!(retrieved.is_ok(), "Failed to retrieve tokens: {:?}", retrieved.err());

            let retrieved_data = retrieved.unwrap();
            prop_assert_eq!(retrieved_data.access_token, token_data.access_token);
            prop_assert_eq!(retrieved_data.refresh_token, token_data.refresh_token);
            prop_assert_eq!(retrieved_data.expires_at, token_data.expires_at);

            // Cleanup
            let _ = cleanup_tokens_with_service(&test_service);
        }
    }

    // Helper functions for testing with custom service names
    fn store_tokens_with_service(service: &str, token_data: &TokenData) -> Result<(), String> {
        let entry = keyring::Entry::new(service, KEYRING_ACCESS_TOKEN)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        entry
            .set_password(&token_data.access_token)
            .map_err(|e| format!("Failed to store access token: {}", e))?;

        if let Some(ref refresh_token) = token_data.refresh_token {
            let entry = keyring::Entry::new(service, KEYRING_REFRESH_TOKEN)
                .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
            entry
                .set_password(refresh_token)
                .map_err(|e| format!("Failed to store refresh token: {}", e))?;
        }

        let entry = keyring::Entry::new(service, KEYRING_EXPIRES_AT)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        entry
            .set_password(&token_data.expires_at.to_string())
            .map_err(|e| format!("Failed to store expiration time: {}", e))?;

        Ok(())
    }

    fn get_tokens_with_service(service: &str) -> Result<TokenData, String> {
        let entry = keyring::Entry::new(service, KEYRING_ACCESS_TOKEN)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        let access_token = entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve access token: {}", e))?;

        let entry = keyring::Entry::new(service, KEYRING_REFRESH_TOKEN)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        let refresh_token = entry.get_password().ok();

        let entry = keyring::Entry::new(service, KEYRING_EXPIRES_AT)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        let expires_at_str = entry
            .get_password()
            .map_err(|e| format!("Failed to retrieve expiration time: {}", e))?;
        let expires_at = expires_at_str
            .parse::<u64>()
            .map_err(|e| format!("Failed to parse expiration time: {}", e))?;

        Ok(TokenData {
            access_token,
            refresh_token,
            expires_at,
        })
    }

    fn cleanup_tokens_with_service(service: &str) -> Result<(), String> {
        let _ = keyring::Entry::new(service, KEYRING_ACCESS_TOKEN)
            .and_then(|e| e.delete_credential());
        let _ = keyring::Entry::new(service, KEYRING_REFRESH_TOKEN)
            .and_then(|e| e.delete_credential());
        let _ = keyring::Entry::new(service, KEYRING_EXPIRES_AT)
            .and_then(|e| e.delete_credential());
        Ok(())
    }
}
