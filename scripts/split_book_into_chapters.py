#!/usr/bin/env python3
"""
Split large book files into chapter-based Quarto projects.

Usage:
    uv run scripts/split_book_into_chapters.py <book_name>

Example:
    uv run scripts/split_book_into_chapters.py mathematical_awakening
"""

import sys
import re
from pathlib import Path
from typing import List, Tuple


def find_chapter_boundaries(content: str) -> List[Tuple[str, int, int]]:
    """Find all chapter boundaries in the content."""
    lines = content.split('\n')
    chapters = []

    for i, line in enumerate(lines):
        # Match: # Chapter X: Title
        if re.match(r'^# Chapter \d+:', line):
            chapters.append((line, i, None))

    # Set end boundaries
    for i in range(len(chapters) - 1):
        title, start, _ = chapters[i]
        next_start = chapters[i + 1][1]
        chapters[i] = (title, start, next_start)

    # Last chapter goes to end
    if chapters:
        title, start, _ = chapters[-1]
        chapters[-1] = (title, start, len(lines))

    return chapters


def extract_intro_section(content: str) -> str:
    """Extract everything before the first chapter."""
    lines = content.split('\n')

    for i, line in enumerate(lines):
        if re.match(r'^# Chapter \d+:', line):
            return '\n'.join(lines[:i]).strip()

    return content


def clean_chapter_title(title: str) -> str:
    """Clean chapter title for filename."""
    # "# Chapter 1: Building Intuition..." -> "building_intuition"
    match = re.match(r'^# Chapter (\d+): (.+)$', title)
    if match:
        num, name = match.groups()
        # Remove special chars, convert to snake_case
        clean_name = re.sub(r'[^\w\s-]', '', name.lower())
        clean_name = re.sub(r'[-\s]+', '_', clean_name)
        return f"{num}_{clean_name[:50]}"  # Limit length
    return "chapter"


def split_book(book_dir: Path) -> bool:
    """Split a book into chapters."""
    index_file = book_dir / "index.qmd"

    if not index_file.exists():
        print(f"❌ {book_dir.name}/index.qmd not found")
        return False

    print(f"📖 Splitting: {book_dir.name}")

    content = index_file.read_text(encoding='utf-8')

    # Extract intro (title, cover, TOC)
    intro = extract_intro_section(content)

    # Remove book cover image reference
    intro = re.sub(r'!\[Book Cover\]\([^)]+\)\s*\n*', '', intro)

    # Find chapters
    chapters = find_chapter_boundaries(content)

    if not chapters:
        print(f"  ⚠️  No chapters found")
        return False

    print(f"  📄 Found {len(chapters)} chapters")

    # Write index.qmd (just title + TOC)
    index_content = f"# Abstract {{.unnumbered}}\n\n{intro.split('## Table of Contents')[0].strip()}\n\n{intro}"
    index_file.write_text(index_content, encoding='utf-8')
    print(f"  ✅ Updated index.qmd")

    # Write each chapter
    lines = content.split('\n')
    chapter_files = []

    for title, start, end in chapters:
        filename = clean_chapter_title(title) + ".qmd"
        chapter_content = '\n'.join(lines[start:end]).strip()

        output_file = book_dir / filename
        output_file.write_text(chapter_content, encoding='utf-8')

        chapter_files.append(filename)
        print(f"  ✅ Created {filename}")

    # Update _quarto.yml
    quarto_yml = book_dir / "_quarto.yml"
    if quarto_yml.exists():
        yml_content = quarto_yml.read_text()

        # Build chapters list
        chapters_str = "    - index.qmd\n" + '\n'.join(f"    - {f}" for f in chapter_files)

        # Replace chapters section
        yml_content = re.sub(
            r'  chapters:\s*\n\s*- index\.qmd',
            f'  chapters:\n{chapters_str}',
            yml_content
        )

        quarto_yml.write_text(yml_content)
        print(f"  ✅ Updated _quarto.yml")

    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: uv run scripts/split_book_into_chapters.py <book_name>")
        print("\nAvailable books:")
        print("  - mathematical_awakening")
        print("  - practical_ml")
        return 1

    book_name = sys.argv[1]

    # Find book directory
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    book_dir = repo_root / "apps" / "aresalab" / "public" / "publications" / book_name

    if not book_dir.exists():
        print(f"❌ Book directory not found: {book_dir}")
        return 1

    if split_book(book_dir):
        print(f"\n✅ Successfully split {book_name}")
        print(f"📂 Location: {book_dir.relative_to(repo_root)}")
        return 0
    else:
        print(f"\n❌ Failed to split {book_name}")
        return 1


if __name__ == "__main__":
    exit(main())

