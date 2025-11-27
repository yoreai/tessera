//! Secure credential storage using OS keychain

use anyhow::{Context, Result};
use keyring::Entry;

const SERVICE_NAME: &str = "aresa-cli";

/// Secure credential storage using the OS keychain
#[derive(Debug)]
pub struct CredentialStore;

impl CredentialStore {
    /// Create a new credential store
    pub fn new() -> Result<Self> {
        Ok(Self)
    }

    /// Store a credential in the keychain
    pub fn store(&self, name: &str, secret: &str) -> Result<()> {
        let entry = Entry::new(SERVICE_NAME, name)
            .context("Failed to create keyring entry")?;
        
        entry.set_password(secret)
            .context("Failed to store credential in keychain")?;
        
        Ok(())
    }

    /// Retrieve a credential from the keychain
    pub fn get(&self, name: &str) -> Result<String> {
        let entry = Entry::new(SERVICE_NAME, name)
            .context("Failed to create keyring entry")?;
        
        entry.get_password()
            .context(format!("Credential '{}' not found in keychain", name))
    }

    /// Delete a credential from the keychain
    pub fn delete(&self, name: &str) -> Result<()> {
        let entry = Entry::new(SERVICE_NAME, name)
            .context("Failed to create keyring entry")?;
        
        entry.delete_password()
            .context("Failed to delete credential")?;
        
        Ok(())
    }

    /// Check if a credential exists
    pub fn exists(&self, name: &str) -> bool {
        if let Ok(entry) = Entry::new(SERVICE_NAME, name) {
            entry.get_password().is_ok()
        } else {
            false
        }
    }
}

