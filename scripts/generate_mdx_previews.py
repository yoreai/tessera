#!/usr/bin/env python3
"""
Generate MDX preview files from Quarto publications.

Extracts Abstract + Introduction from .qmd files and creates preview.mdx
for web rendering in the ARESA app.

Usage:
    python scripts/generate_mdx_previews.py
"""

import os
import re
from pathlib import Path
from typing import Optional, Tuple


def extract_section(content: str, section_header: str) -> Optional[str]:
    """Extract content between a section header and the next # header."""
    # Match section header (# Abstract, ## Introduction, etc.)
    pattern = rf'^#+\s+{re.escape(section_header)}\s*(?:\{{[^}}]*\}})?\s*$'
    match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)

    if not match:
        return None

    start = match.end()

    # Find next header of same or higher level
    header_level = len(match.group().split()[0])
    next_header_pattern = rf'^#{{1,{header_level}}}\s+\w'
    next_match = re.search(next_header_pattern, content[start:], re.MULTILINE)

    if next_match:
        end = start + next_match.start()
        return content[start:end].strip()
    else:
        return content[start:].strip()


def clean_quarto_syntax(text: str) -> str:
    """Remove Quarto-specific syntax that doesn't work in MDX."""
    # Remove Python code blocks (they won't execute in MDX)
    text = re.sub(r'```\{?python.*?\n.*?```', '', text, flags=re.DOTALL)
    
    # Remove Quarto attributes from headers (e.g., {.unnumbered}, {#sec-intro})
    text = re.sub(r'\s*\{[^}]*\}\s*$', '', text, flags=re.MULTILINE)
    
    # Remove Quarto figure labels
    text = re.sub(r'\{#fig-[^}]+\}', '', text)
    
    # Remove Quarto cross-references
    text = re.sub(r'@fig-[\w-]+', 'Figure', text)
    text = re.sub(r'@tbl-[\w-]+', 'Table', text)
    text = re.sub(r'@eq-[\w-]+', 'Equation', text)
    text = re.sub(r'\[@[\w-]+\]', '', text)  # Remove citation references like [@nfpa2023]
    
    # Convert LaTeX/Quarto em-dashes to proper Unicode
    text = text.replace('---', '—')  # em-dash
    text = text.replace('--', '–')   # en-dash
    
    # Remove standalone em-dashes on their own line
    text = re.sub(r'^\s*—\s*$', '', text, flags=re.MULTILINE)
    
    # Keep LaTeX math as-is (MDX + KaTeX handles it)
    
    # Remove excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def generate_preview_mdx(pub_dir: Path) -> bool:
    """Generate preview.mdx for a publication."""
    index_qmd = pub_dir / "index.qmd"
    intro_qmd = pub_dir / "1_introduction.qmd"
    output_mdx = pub_dir / "preview.mdx"

    if not index_qmd.exists():
        print(f"  ⚠️  Skipping {pub_dir.name}: no index.qmd found")
        return False

    # Read index.qmd
    index_content = index_qmd.read_text(encoding='utf-8')

    # Try to extract Abstract
    abstract = extract_section(index_content, "Abstract")

    # Try to get Introduction from separate file, fallback to index.qmd
    if intro_qmd.exists():
        intro_content = intro_qmd.read_text(encoding='utf-8')
        introduction = extract_section(intro_content, "Introduction")
    else:
        introduction = extract_section(index_content, "Introduction")

    # For books without Abstract/Introduction, extract Table of Contents
    if not abstract and not introduction:
        # Try to extract Table of Contents section
        toc = extract_section(index_content, "Table of Contents")
        
        if toc:
            # Clean the TOC content
            toc_cleaned = clean_quarto_syntax(toc)
            
            mdx_content = f"## Table of Contents\n\n{toc_cleaned}\n\n---\n\n*Download the full book PDF to explore these topics in depth.*"
            output_mdx.write_text(mdx_content, encoding='utf-8')
            print(f"  ✅ Generated (book TOC): {output_mdx.relative_to(pub_dir.parent.parent.parent)}")
            return True
        else:
            print(f"  ⚠️  Skipping {pub_dir.name}: could not extract preview content")
            return False

    # Build MDX content for papers
    mdx_parts = []

    if abstract:
        mdx_parts.append("## Abstract\n\n" + clean_quarto_syntax(abstract))

    if introduction:
        mdx_parts.append("## Introduction\n\n" + clean_quarto_syntax(introduction))

    # Write preview.mdx
    mdx_content = "\n\n---\n\n".join(mdx_parts)
    output_mdx.write_text(mdx_content, encoding='utf-8')

    print(f"  ✅ Generated: {output_mdx.relative_to(pub_dir.parent.parent.parent)}")
    return True


def main():
    """Generate preview.mdx for all publications."""
    # Find publications directory
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    pub_root = repo_root / "apps" / "aresalab" / "public" / "publications"

    if not pub_root.exists():
        print(f"❌ Publications directory not found: {pub_root}")
        return 1

    print("🔄 Generating MDX previews from Quarto sources...")
    print(f"📂 Source: {pub_root.relative_to(repo_root)}")
    print()

    generated = 0
    skipped = 0

    # Process each subdirectory
    for pub_dir in sorted(pub_root.iterdir()):
        if not pub_dir.is_dir():
            continue

        # Skip special directories
        if pub_dir.name in ['pdf', '__pycache__', 'node_modules']:
            continue

        # Skip if no _quarto.yml
        if not (pub_dir / "_quarto.yml").exists():
            continue

        print(f"📄 Processing: {pub_dir.name}")

        if generate_preview_mdx(pub_dir):
            generated += 1
        else:
            skipped += 1

    print()
    print("=" * 60)
    print(f"✅ Generated: {generated}")
    print(f"⚠️  Skipped: {skipped}")
    print(f"📂 Preview files: apps/aresalab/public/publications/*/preview.mdx")
    print()
    print("Next steps:")
    print("  1. Update [slug]/page.tsx to read preview.mdx from publications/")
    print("  2. Delete apps/aresalab/content/ folder")
    print("  3. Test web rendering")

    return 0


if __name__ == "__main__":
    exit(main())

