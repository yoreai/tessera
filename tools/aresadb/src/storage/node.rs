//! Node and Edge types - the core data model
//!
//! AresaDB uses a property graph model where:
//! - Nodes represent entities with typed properties
//! - Edges represent relationships between nodes

use anyhow::{Result, bail};
use rkyv::{Archive, Deserialize, Serialize};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use std::collections::BTreeMap;
use std::fmt;
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Unique identifier for a node
#[derive(Debug, Clone, PartialEq, Eq, Hash, Archive, Serialize, Deserialize)]
#[archive(check_bytes)]
#[archive_attr(derive(Debug))]
pub struct NodeId {
    pub uuid: [u8; 16],
}

impl NodeId {
    /// Create a new random NodeId
    pub fn new() -> Self {
        Self {
            uuid: *Uuid::new_v4().as_bytes(),
        }
    }

    /// Parse a NodeId from a string (UUID format or type:uuid format)
    pub fn parse(s: &str) -> Result<Self> {
        // Support both "uuid" and "type:uuid" formats
        let uuid_str = if s.contains(':') {
            s.split(':').last().unwrap_or(s)
        } else if s.contains('/') {
            s.split('/').last().unwrap_or(s)
        } else {
            s
        };

        let uuid = Uuid::parse_str(uuid_str)
            .map_err(|_| anyhow::anyhow!("Invalid node ID: {}", s))?;

        Ok(Self {
            uuid: *uuid.as_bytes(),
        })
    }

    /// Get as UUID
    pub fn as_uuid(&self) -> Uuid {
        Uuid::from_bytes(self.uuid)
    }
}

impl Default for NodeId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for NodeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_uuid())
    }
}

impl SerdeSerialize for NodeId {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> SerdeDeserialize<'de> for NodeId {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        NodeId::parse(&s).map_err(serde::de::Error::custom)
    }
}

/// Unique identifier for an edge
#[derive(Debug, Clone, PartialEq, Eq, Hash, Archive, Serialize, Deserialize)]
#[archive(check_bytes)]
#[archive_attr(derive(Debug))]
pub struct EdgeId {
    pub uuid: [u8; 16],
}

impl EdgeId {
    /// Create a new random EdgeId
    pub fn new() -> Self {
        Self {
            uuid: *Uuid::new_v4().as_bytes(),
        }
    }

    /// Parse an EdgeId from a string
    pub fn parse(s: &str) -> Result<Self> {
        let uuid = Uuid::parse_str(s)
            .map_err(|_| anyhow::anyhow!("Invalid edge ID: {}", s))?;

        Ok(Self {
            uuid: *uuid.as_bytes(),
        })
    }

    /// Get as UUID
    pub fn as_uuid(&self) -> Uuid {
        Uuid::from_bytes(self.uuid)
    }
}

impl Default for EdgeId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for EdgeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_uuid())
    }
}

/// Timestamp wrapper for serialization
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Archive, Serialize, Deserialize)]
#[archive(check_bytes)]
#[archive_attr(derive(Debug))]
pub struct Timestamp {
    pub millis: i64,
}

impl Timestamp {
    /// Create timestamp for current time
    pub fn now() -> Self {
        Self {
            millis: Utc::now().timestamp_millis(),
        }
    }

    /// Create from DateTime
    pub fn from_datetime(dt: DateTime<Utc>) -> Self {
        Self {
            millis: dt.timestamp_millis(),
        }
    }

    /// Convert to DateTime
    pub fn to_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp_millis(self.millis).unwrap_or_default()
    }
}

impl Default for Timestamp {
    fn default() -> Self {
        Self::now()
    }
}

impl fmt::Display for Timestamp {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_datetime().format("%Y-%m-%d %H:%M:%S"))
    }
}

impl SerdeSerialize for Timestamp {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_i64(self.millis)
    }
}

impl<'de> SerdeDeserialize<'de> for Timestamp {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let millis = i64::deserialize(deserializer)?;
        Ok(Self { millis })
    }
}

/// A flexible value type that can hold any data
#[derive(Debug, Clone, PartialEq, Archive, Serialize, Deserialize, SerdeSerialize, SerdeDeserialize)]
#[archive(check_bytes)]
#[archive_attr(derive(Debug))]
#[serde(untagged)]
pub enum Value {
    Null,
    Bool(bool),
    Int(i64),
    Float(f64),
    String(String),
    Bytes(Vec<u8>),
    Array(Vec<Value>),
    Object(BTreeMap<String, Value>),
}

impl Value {
    /// Convert from serde_json::Value
    pub fn from_json(v: serde_json::Value) -> Result<Self> {
        match v {
            serde_json::Value::Null => Ok(Value::Null),
            serde_json::Value::Bool(b) => Ok(Value::Bool(b)),
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    Ok(Value::Int(i))
                } else if let Some(f) = n.as_f64() {
                    Ok(Value::Float(f))
                } else {
                    bail!("Invalid number: {}", n)
                }
            }
            serde_json::Value::String(s) => Ok(Value::String(s)),
            serde_json::Value::Array(arr) => {
                let values: Result<Vec<_>> = arr.into_iter().map(Value::from_json).collect();
                Ok(Value::Array(values?))
            }
            serde_json::Value::Object(obj) => {
                let map: Result<BTreeMap<_, _>> = obj
                    .into_iter()
                    .map(|(k, v)| Value::from_json(v).map(|v| (k, v)))
                    .collect();
                Ok(Value::Object(map?))
            }
        }
    }

    /// Convert to serde_json::Value
    pub fn to_json(&self) -> serde_json::Value {
        match self {
            Value::Null => serde_json::Value::Null,
            Value::Bool(b) => serde_json::Value::Bool(*b),
            Value::Int(i) => serde_json::Value::Number((*i).into()),
            Value::Float(f) => serde_json::Number::from_f64(*f)
                .map(serde_json::Value::Number)
                .unwrap_or(serde_json::Value::Null),
            Value::String(s) => serde_json::Value::String(s.clone()),
            Value::Bytes(b) => serde_json::Value::String(base64::encode(b)),
            Value::Array(arr) => {
                serde_json::Value::Array(arr.iter().map(|v| v.to_json()).collect())
            }
            Value::Object(obj) => {
                let map: serde_json::Map<_, _> = obj
                    .iter()
                    .map(|(k, v)| (k.clone(), v.to_json()))
                    .collect();
                serde_json::Value::Object(map)
            }
        }
    }

    /// Get as string if possible
    pub fn as_str(&self) -> Option<&str> {
        match self {
            Value::String(s) => Some(s),
            _ => None,
        }
    }

    /// Get as i64 if possible
    pub fn as_int(&self) -> Option<i64> {
        match self {
            Value::Int(i) => Some(*i),
            Value::Float(f) => Some(*f as i64),
            _ => None,
        }
    }

    /// Get as f64 if possible
    pub fn as_float(&self) -> Option<f64> {
        match self {
            Value::Float(f) => Some(*f),
            Value::Int(i) => Some(*i as f64),
            _ => None,
        }
    }

    /// Get as bool if possible
    pub fn as_bool(&self) -> Option<bool> {
        match self {
            Value::Bool(b) => Some(*b),
            _ => None,
        }
    }

    /// Get a field from an object
    pub fn get(&self, key: &str) -> Option<&Value> {
        match self {
            Value::Object(obj) => obj.get(key),
            _ => None,
        }
    }

    /// Check if value is null
    pub fn is_null(&self) -> bool {
        matches!(self, Value::Null)
    }
}

impl Default for Value {
    fn default() -> Self {
        Value::Null
    }
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::Null => write!(f, "null"),
            Value::Bool(b) => write!(f, "{}", b),
            Value::Int(i) => write!(f, "{}", i),
            Value::Float(fl) => write!(f, "{}", fl),
            Value::String(s) => write!(f, "\"{}\"", s),
            Value::Bytes(b) => write!(f, "<{} bytes>", b.len()),
            Value::Array(arr) => {
                write!(f, "[")?;
                for (i, v) in arr.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", v)?;
                }
                write!(f, "]")
            }
            Value::Object(obj) => {
                write!(f, "{{")?;
                for (i, (k, v)) in obj.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "\"{}\": {}", k, v)?;
                }
                write!(f, "}}")
            }
        }
    }
}

// Implement base64 encoding helper
mod base64 {
    const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    pub fn encode(data: &[u8]) -> String {
        let mut result = String::new();
        for chunk in data.chunks(3) {
            let b0 = chunk[0] as usize;
            let b1 = chunk.get(1).copied().unwrap_or(0) as usize;
            let b2 = chunk.get(2).copied().unwrap_or(0) as usize;

            result.push(ALPHABET[b0 >> 2] as char);
            result.push(ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)] as char);

            if chunk.len() > 1 {
                result.push(ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] as char);
            } else {
                result.push('=');
            }

            if chunk.len() > 2 {
                result.push(ALPHABET[b2 & 0x3f] as char);
            } else {
                result.push('=');
            }
        }
        result
    }
}

/// A node in the property graph
#[derive(Debug, Clone, Archive, Serialize, Deserialize, SerdeSerialize, SerdeDeserialize)]
#[archive(check_bytes)]
#[archive_attr(derive(Debug))]
pub struct Node {
    /// Unique identifier
    pub id: NodeId,
    /// Node type (e.g., "user", "order", "product")
    pub node_type: String,
    /// Properties stored as key-value pairs
    pub properties: BTreeMap<String, Value>,
    /// Creation timestamp
    pub created_at: Timestamp,
    /// Last update timestamp
    pub updated_at: Timestamp,
}

impl Node {
    /// Create a new node
    pub fn new(node_type: &str, properties: Value) -> Self {
        let now = Timestamp::now();
        let props = match properties {
            Value::Object(obj) => obj,
            _ => {
                let mut map = BTreeMap::new();
                map.insert("value".to_string(), properties);
                map
            }
        };

        Self {
            id: NodeId::new(),
            node_type: node_type.to_string(),
            properties: props,
            created_at: now,
            updated_at: now,
        }
    }

    /// Create with a specific ID
    pub fn with_id(id: NodeId, node_type: &str, properties: BTreeMap<String, Value>) -> Self {
        let now = Timestamp::now();
        Self {
            id,
            node_type: node_type.to_string(),
            properties,
            created_at: now,
            updated_at: now,
        }
    }

    /// Get a property value
    pub fn get(&self, key: &str) -> Option<&Value> {
        self.properties.get(key)
    }

    /// Set a property value
    pub fn set(&mut self, key: &str, value: Value) {
        self.properties.insert(key.to_string(), value);
        self.updated_at = Timestamp::now();
    }

    /// Remove a property
    pub fn remove(&mut self, key: &str) -> Option<Value> {
        self.updated_at = Timestamp::now();
        self.properties.remove(key)
    }

    /// Get all property keys
    pub fn keys(&self) -> impl Iterator<Item = &String> {
        self.properties.keys()
    }

    /// Convert to JSON
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// An edge connecting two nodes
#[derive(Debug, Clone, Archive, Serialize, Deserialize, SerdeSerialize, SerdeDeserialize)]
#[archive(check_bytes)]
#[archive_attr(derive(Debug))]
pub struct Edge {
    /// Unique identifier
    pub id: EdgeId,
    /// Source node ID
    pub from: NodeId,
    /// Target node ID
    pub to: NodeId,
    /// Edge type (e.g., "purchased", "follows", "belongs_to")
    pub edge_type: String,
    /// Properties on the edge
    pub properties: BTreeMap<String, Value>,
    /// Creation timestamp
    pub created_at: Timestamp,
}

impl Edge {
    /// Create a new edge
    pub fn new(from: NodeId, to: NodeId, edge_type: &str, properties: Value) -> Self {
        let props = match properties {
            Value::Object(obj) => obj,
            Value::Null => BTreeMap::new(),
            _ => {
                let mut map = BTreeMap::new();
                map.insert("value".to_string(), properties);
                map
            }
        };

        Self {
            id: EdgeId::new(),
            from,
            to,
            edge_type: edge_type.to_string(),
            properties: props,
            created_at: Timestamp::now(),
        }
    }

    /// Get a property value
    pub fn get(&self, key: &str) -> Option<&Value> {
        self.properties.get(key)
    }

    /// Set a property value
    pub fn set(&mut self, key: &str, value: Value) {
        self.properties.insert(key.to_string(), value);
    }

    /// Convert to JSON
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_creation() {
        let props = Value::from_json(serde_json::json!({
            "name": "John",
            "age": 30
        })).unwrap();

        let node = Node::new("user", props);

        assert_eq!(node.node_type, "user");
        assert_eq!(node.get("name").unwrap().as_str(), Some("John"));
        assert_eq!(node.get("age").unwrap().as_int(), Some(30));
    }

    #[test]
    fn test_edge_creation() {
        let from = NodeId::new();
        let to = NodeId::new();

        let edge = Edge::new(from.clone(), to.clone(), "follows", Value::Null);

        assert_eq!(edge.from, from);
        assert_eq!(edge.to, to);
        assert_eq!(edge.edge_type, "follows");
    }

    #[test]
    fn test_value_conversion() {
        let json = serde_json::json!({
            "string": "hello",
            "number": 42,
            "float": 3.14,
            "bool": true,
            "null": null,
            "array": [1, 2, 3],
            "nested": {"a": 1}
        });

        let value = Value::from_json(json.clone()).unwrap();
        let back = value.to_json();

        assert_eq!(json, back);
    }

    #[test]
    fn test_node_id_parsing() {
        let id = NodeId::new();
        let str_id = id.to_string();

        let parsed = NodeId::parse(&str_id).unwrap();
        assert_eq!(id, parsed);

        // Test with type prefix
        let with_prefix = format!("user:{}", str_id);
        let parsed2 = NodeId::parse(&with_prefix).unwrap();
        assert_eq!(id, parsed2);
    }
}


