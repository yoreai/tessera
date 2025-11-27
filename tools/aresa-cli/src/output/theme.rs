//! Color themes for terminal output

use colored::Color;

/// Color theme for output
#[derive(Debug, Clone)]
pub struct Theme {
    pub primary: Color,
    pub secondary: Color,
    pub accent: Color,
    pub success: Color,
    pub warning: Color,
    pub error: Color,
    pub muted: Color,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            primary: Color::Cyan,
            secondary: Color::White,
            accent: Color::Yellow,
            success: Color::Green,
            warning: Color::Yellow,
            error: Color::Red,
            muted: Color::BrightBlack,
        }
    }
}

impl Theme {
    /// Create a dark theme
    pub fn dark() -> Self {
        Self::default()
    }

    /// Create a light theme
    pub fn light() -> Self {
        Self {
            primary: Color::Blue,
            secondary: Color::Black,
            accent: Color::Magenta,
            success: Color::Green,
            warning: Color::Yellow,
            error: Color::Red,
            muted: Color::BrightBlack,
        }
    }
}


