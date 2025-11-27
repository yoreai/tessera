# Homebrew formula for ARESA CLI
# To install: brew install yoreai/tap/aresa-cli

class AresaCli < Formula
  desc "Natural language interface for searching filesystems, databases, and cloud storage"
  homepage "https://github.com/yoreai/aresa"
  version "0.1.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/yoreai/aresa/releases/download/cli-v#{version}/aresa-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_ARM64"
    end
    on_intel do
      url "https://github.com/yoreai/aresa/releases/download/cli-v#{version}/aresa-darwin-x64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_X64"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/yoreai/aresa/releases/download/cli-v#{version}/aresa-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_LINUX_ARM64"
    end
    on_intel do
      url "https://github.com/yoreai/aresa/releases/download/cli-v#{version}/aresa-linux-x64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_LINUX_X64"
    end
  end

  def install
    bin.install "aresa"
  end

  def caveats
    <<~EOS
      To get started with ARESA CLI:

      1. Configure your LLM provider:
         aresa config set-llm openai --api-key YOUR_API_KEY

      2. Add a data source:
         aresa config add postgres mydb --uri postgresql://...

      3. Start searching:
         aresa "find python files with TODO comments"

      For more information, run:
         aresa --help
    EOS
  end

  test do
    assert_match "ARESA", shell_output("#{bin}/aresa --version")
  end
end


