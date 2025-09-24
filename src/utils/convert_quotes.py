import re
import os
import shutil
from pathlib import Path

def parse_quotes_from_file(file_path):
    """Parse the markdown file and extract quotes with metadata"""
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    print(f"File content length: {len(content)} characters")
    
    # Split by lines
    lines = content.split('\n')
    quotes = []
    current_quote = []
    current_location = None
    current_note = None
    current_tags = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Skip header lines
        if any(line.startswith(x) for x in ['# ', '![](', '### Metadata', '- Author:', '- Full Title:', '- Category:', '### Highlights']):
            continue
        
        # Look for bullet points with location markers
        if line.startswith('- ') and '(Location' in line:
            # If we have a previous quote, save it
            if current_quote and current_location is not None:
                quote_text = ' '.join(current_quote).strip()
                if quote_text:
                    quotes.append({
                        'text': quote_text,
                        'page': current_location,
                        'tags': current_tags.copy(),
                        'note': current_note
                    })
                    print(f"Saved quote: Location {current_location}, Text: {quote_text[:50]}...")
            
            # Start new quote
            current_quote = []
            current_tags = []
            current_note = None
            
            # Extract location
            location_match = re.search(r'\(Location\s*(\d+)\)', line)
            if location_match:
                current_location = int(location_match.group(1))
                print(f"Found new quote at location {current_location}")
            
            # Extract the quote text (remove the bullet and location)
            quote_part = re.sub(r'^-\s*', '', line)  # Remove bullet
            quote_part = re.sub(r'\s*\(Location\s*\d+\)\s*$', '', quote_part)  # Remove location
            if quote_part.strip():
                current_quote.append(quote_part.strip())
        
        # Look for note lines (indented with **Note:**)
        elif line.startswith('    - **Note:**'):
            note_text = re.sub(r'^\s*-\s*\*\*Note:\*\*\s*', '', line).strip()
            current_note = note_text
            print(f"Found note: {note_text[:50]}...")
        
        # Look for tags lines
        elif line.startswith('    - **Tags:**'):
            tags_text = re.sub(r'^\s*-\s*\*\*Tags:\*\*\s*#', '', line).strip()
            if tags_text:
                current_tags.append(tags_text)
                print(f"Found tag: {tags_text}")
        
        # Look for favorite tags
        elif '**Tags:** #favorite' in line:
            current_tags.append('favorite')
            print("Found favorite tag")
        
        # Add regular content lines to current quote (if we're in a quote)
        elif line and current_location is not None:
            # Skip if it's a note or tag line we already processed
            if not any(x in line for x in ['**Note:**', '**Tags:**', '    -']):
                current_quote.append(line)
    
    # Don't forget the last quote
    if current_quote and current_location is not None:
        quote_text = ' '.join(current_quote).strip()
        if quote_text:
            quotes.append({
                'text': quote_text,
                'page': current_location,
                'tags': current_tags,
                'note': current_note
            })
            print(f"Saved final quote: Location {current_location}, Text: {quote_text[:50]}...")
    
    print(f"Total quotes found: {len(quotes)}")
    return quotes

def generate_title(quote_text):
    """Generate a title from the quote text"""
    # Take first 5-7 words for the title
    words = quote_text.split()[:7]
    title = ' '.join(words)
    
    # Clean up the title - remove quotes, special characters, etc.
    title = re.sub(r'[MQ]:\s*', '', title)  # Remove M: or Q: prefixes
    title = re.sub(r'[^\w\s]', '', title)  # Remove special characters
    title = title.strip()
    
    # If title is too short, use more words
    if len(title) < 10:
        words = quote_text.split()[:12]
        title = ' '.join(words)
        title = re.sub(r'[MQ]:\s*', '', title)
        title = re.sub(r'[^\w\s]', '', title)
        title = title.strip()
    
    return title

def determine_theme_and_difficulty(quote_text):
    """Determine the theme and difficulty based on quote content"""
    
    theme_keywords = {
        'reality': ['reality', 'real', 'unreal', 'appearance', 'manifest', 'projection', 'world'],
        'self-inquiry': ['who am i', 'self', 'investigate', 'enquiry', 'discover', 'find yourself'],
        'awareness': ['awareness', 'witness', 'observer', 'attention', 'conscious'],
        'consciousness': ['consciousness', 'mind', 'thought', 'memory'],
        'wisdom': ['wisdom', 'wise', 'understand', 'knowledge', 'learn'],
        'acceptance': ['accept', 'surrender', 'allow', 'present moment', 'as they are'],
        'unity': ['unity', 'one', 'non-dual', 'whole', 'humanity', 'all'],
        'being': ['being', 'existence', 'am', 'presence', 'is'],
        'identity': ['i am', 'me', 'mine', 'person', 'ego', 'self'],
        'liberation': ['free', 'liberation', 'freedom', 'bondage', 'attachment'],
        'presence': ['now', 'present', 'moment', 'here'],
        'truth': ['truth', 'true', 'real', 'authentic']
    }
    
    difficulty_keywords = {
        'beginner': ['love', 'happy', 'good', 'simple', 'basic', 'start'],
        'intermediate': ['mind', 'desire', 'fear', 'practice', 'observe'],
        'advanced': ['reality', 'consciousness', 'absolute', 'beyond', 'void', 'emptiness']
    }
    
    text_lower = quote_text.lower()
    
    # Determine theme
    theme_scores = {theme: 0 for theme in theme_keywords}
    for theme, keywords in theme_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                theme_scores[theme] += 1
    
    theme = max(theme_scores, key=theme_scores.get) if max(theme_scores.values()) > 0 else 'wisdom'
    
    # Determine difficulty
    difficulty_scores = {diff: 0 for diff in difficulty_keywords}
    for difficulty, keywords in difficulty_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                difficulty_scores[difficulty] += 1
    
    difficulty = max(difficulty_scores, key=difficulty_scores.get) if max(difficulty_scores.values()) > 0 else 'intermediate'
    
    return theme, difficulty

def create_slug(quote_text):
    """Create a filename-friendly slug from quote text"""
    # Take first 5-7 words max for filename
    words = quote_text.split()[:7]
    short_text = ' '.join(words)
    
    # Remove special characters and create slug
    slug = re.sub(r'[^\w\s-]', '', short_text.lower())
    slug = re.sub(r'[-\s]+', '-', slug).strip('-')
    
    # Ensure slug is not empty
    if not slug:
        slug = 'quote'
    
    return slug

def clean_quotes_directory(quotes_dir):
    """Remove all existing files in the quotes directory"""
    if os.path.exists(quotes_dir):
        print(f"Cleaning up existing quotes in {quotes_dir}...")
        for filename in os.listdir(quotes_dir):
            file_path = os.path.join(quotes_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f"Removed: {filename}")
        print("Cleanup completed.")
    else:
        print(f"Quotes directory {quotes_dir} does not exist. Creating it...")
        os.makedirs(quotes_dir)

def write_quote_files(quotes, output_dir):
    """Write each quote to individual markdown files"""
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for i, quote in enumerate(quotes):
        theme, difficulty = determine_theme_and_difficulty(quote['text'])
        title = generate_title(quote['text'])
        slug = create_slug(quote['text'])
        filename = f"{i+1:03d}-{slug}.md"
        filepath = os.path.join(output_dir, filename)
        
        # Prepare frontmatter
        frontmatter = f"""---
title: "{title}"
theme: "{theme}"
difficulty: "{difficulty}"
page: {quote['page']}
"""
        
        # Add tags if available
        if quote['tags']:
            tags_str = ', '.join([f'"{tag}"' for tag in quote['tags']])
            frontmatter += f"tags: [{tags_str}]\n"
        
        frontmatter += "---\n\n"
        
        # Prepare content
        content = quote['text']
        
        # Add note if available
        if quote['note']:
            content += f"\n\n**Note:** {quote['note']}"
        
        # Write file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(frontmatter + content)
        
        print(f"Created: {filename}")

def main():
    # Configuration - using relative paths from the script location
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent  # Go up two levels from src/utils to src/
    
    input_file = project_root / "i-am-that.md"
    output_directory = project_root / "content" / "quotes"
    
    print(f"Script directory: {script_dir}")
    print(f"Project root: {project_root}")
    print(f"Input file: {input_file}")
    print(f"Output directory: {output_directory}")
    
    if not input_file.exists():
        print(f"Error: Input file '{input_file}' not found!")
        print(f"Files in project root: {list(project_root.iterdir())}")
        return
    
    # Clean up existing quotes
    clean_quotes_directory(output_directory)
    
    print("Parsing quotes from file...")
    quotes = parse_quotes_from_file(input_file)
    
    if not quotes:
        print("No quotes found! Check the file format.")
        return
    
    print(f"Found {len(quotes)} quotes")
    print("Creating individual quote files...")
    
    write_quote_files(quotes, output_directory)
    
    print(f"\nDone! Created {len(quotes)} files in '{output_directory}' directory")

if __name__ == "__main__":
    main()