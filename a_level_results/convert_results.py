#!/usr/bin/env python3
"""
Universal parser for UK A-Level and GCSE results.
Converts both results_a_level.txt and results_gcse.txt into a unified results.csv.

Output format:
exam_type,subject,year,region,data_type,grade_system,g1,g2,g3,g4,g5,g6,g7,g8,g9,g10,u,pass_rate,pass_threshold,candidates

Grade systems:
- A*-U: A-Level grades (A*, A, B, C, D, E, N)
- 9-1: GCSE numeric grades (9-1)
- A*-G: GCSE letter grades (A*-G)
"""
import re
import csv
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# File paths
BASE_DIR = Path(__file__).parent
A_LEVEL_INPUT = BASE_DIR / 'results_a_level.txt'
GCSE_INPUT = BASE_DIR / 'results_gcse.txt'
OUTPUT = BASE_DIR / 'results.csv'

# Output columns
COLUMNS = [
    'exam_type', 'subject', 'year', 'region', 'data_type', 'grade_system',
    'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10',
    'u', 'pass_rate', 'pass_threshold', 'candidates'
]

# Regex patterns
YEAR_PATTERN = re.compile(r'^(?:\s*)(Teacher\s*)?(\d{4})\s+(.+)$')
REGION_PATTERN = re.compile(r'^\s*(England|UK)\s+(\d{4})\s+(.+)$')

def clean_value(val: str) -> str:
    """Remove % signs, commas, and extra whitespace"""
    if not val:
        return ''
    return val.strip().replace('%', '').replace(',', '')

def detect_grade_system(tokens: List[str], year: int, exam_type: str) -> str:
    """
    Detect which grade system is being used based on context.
    
    Returns: 'A*-U', '9-1', or 'A*-G'
    """
    if exam_type == 'A-Level':
        return 'A*-U'
    
    # GCSE detection
    if year >= 2019:
        return '9-1'
    else:
        return 'A*-G'

def parse_grade_line(tokens: List[str], year: int, exam_type: str) -> Optional[Dict]:
    """
    Parse a line of grade data into the universal format.
    
    Returns dict with grade data, or None if line cannot be parsed.
    """
    # Clean all tokens
    tokens = [clean_value(t) for t in tokens if t]
    
    if len(tokens) < 4:
        return None
    
    # Detect grade system
    grade_system = detect_grade_system(tokens, year, exam_type)
    
    # Initialize result
    result = {
        'g1': '', 'g2': '', 'g3': '', 'g4': '', 'g5': '',
        'g6': '', 'g7': '', 'g8': '', 'g9': '', 'g10': '',
        'u': '', 'pass_rate': '', 'pass_threshold': '', 'candidates': ''
    }
    
    # Last token should be candidates (Number/Entries)
    try:
        result['candidates'] = tokens[-1]
        int(result['candidates'])  # Validate it's a number
    except (ValueError, IndexError):
        return None
    
    # Second to last should be pass rate
    if len(tokens) >= 2:
        result['pass_rate'] = tokens[-2]
    
    # Third to last should be U (fail rate)
    if len(tokens) >= 3:
        result['u'] = tokens[-3]
    
    # Now parse the grade columns based on system
    remaining = tokens[:-3]  # Remove U, pass_rate, candidates
    
    if grade_system == 'A*-U':
        # A-Level: A*, A, B, C, D, E, [N]
        result['pass_threshold'] = 'A*-E'
        
        # Check if A* column exists (year >= 2010 and first value is small or empty)
        has_a_star = False
        if year >= 2010 and len(remaining) >= 6:
            first_val = remaining[0]
            if first_val == '' or (first_val.replace('.','').isdigit() and float(first_val) < 5):
                has_a_star = True
            elif len(remaining) >= 6:
                has_a_star = True
        
        if has_a_star and len(remaining) >= 6:
            result['g1'] = remaining[0]  # A*
            result['g2'] = remaining[1]  # A
            result['g3'] = remaining[2]  # B
            result['g4'] = remaining[3]  # C
            result['g5'] = remaining[4]  # D
            result['g6'] = remaining[5]  # E
            result['g7'] = remaining[6] if len(remaining) > 6 else ''  # N
        elif len(remaining) >= 5:
            # No A* column
            result['g1'] = ''  # No A*
            result['g2'] = remaining[0]  # A
            result['g3'] = remaining[1]  # B
            result['g4'] = remaining[2]  # C
            result['g5'] = remaining[3]  # D
            result['g6'] = remaining[4]  # E
            result['g7'] = remaining[5] if len(remaining) > 5 else ''  # N
    
    elif grade_system == '9-1':
        # GCSE numeric: 9, 8, 7, 6, 5, 4, 3, 2, 1
        result['pass_threshold'] = '9-4'
        
        if len(remaining) >= 9:
            result['g1'] = remaining[0]   # 9
            result['g2'] = remaining[1]   # 8
            result['g3'] = remaining[2]   # 7
            result['g4'] = remaining[3]   # 6
            result['g5'] = remaining[4]   # 5
            result['g6'] = remaining[5]   # 4
            result['g7'] = remaining[6]   # 3
            result['g8'] = remaining[7]   # 2
            result['g9'] = remaining[8]   # 1
    
    elif grade_system == 'A*-G':
        # GCSE letter: A*, A, B, C, D, E, F, G
        result['pass_threshold'] = 'A*-C'
        
        if len(remaining) >= 8:
            result['g1'] = remaining[0]   # A*
            result['g2'] = remaining[1]   # A
            result['g3'] = remaining[2]   # B
            result['g4'] = remaining[3]   # C
            result['g5'] = remaining[4]   # D
            result['g6'] = remaining[5]   # E
            result['g7'] = remaining[6]   # F
            result['g8'] = remaining[7]   # G
    
    return result

def find_subject_for_line(lines: List[str], idx: int) -> str:
    """Find the subject name by searching upwards from the current line"""
    for i in range(idx - 1, -1, -1):
        line = lines[i].strip()
        if not line:
            continue
        
        # Skip common header/navigation lines
        lower = line.lower()
        skip_phrases = [
            'percentage of candidates',
            'click for top of page',
            'gaining grade',
            'grades  graded',
            'totals',
            'entries'
        ]
        if any(skip in lower for skip in skip_phrases):
            continue
        
        # Skip navigation letters
        if re.fullmatch(r'[A-Z](\s+[A-Z])+', line):
            continue
        
        # Skip grade header lines
        if 'A*' in line and ('A*-E' in line or 'A*-C' in line or '9-4' in line):
            continue
        
        # Skip year/data lines
        if re.match(r'^\s*(Teacher\s*)?(England\s*)?(UK\s*)?\d{4}', line):
            continue
        
        # Skip lines with mostly numbers (likely data lines)
        if re.search(r'\d+\.\d+.*\d+\.\d+.*\d+\.\d+', line):
            continue
        
        # This should be the subject name
        return line
    
    return 'Unknown'

def parse_file(filepath: Path, exam_type: str) -> List[Dict]:
    """
    Parse an exam results file.
    
    Args:
        filepath: Path to the text file
        exam_type: 'A-Level' or 'GCSE'
    
    Returns:
        List of parsed entry dicts
    """
    print(f"\n📖 Parsing {exam_type} data from {filepath.name}...")
    
    with filepath.open(encoding='utf-8', errors='ignore') as f:
        lines = f.read().splitlines()
    
    entries = []
    
    for idx, line in enumerate(lines):
        # Try to match region-specific lines first (GCSE has England/UK markers)
        region_match = REGION_PATTERN.match(line)
        if region_match:
            region = region_match.group(1)
            year = int(region_match.group(2))
            rest = region_match.group(3).strip()
            data_type = 'Exam'
        else:
            # Try standard year line
            year_match = YEAR_PATTERN.match(line)
            if not year_match:
                continue
            
            teacher_prefix = year_match.group(1)
            year = int(year_match.group(2))
            rest = year_match.group(3).strip()
            data_type = 'Teacher' if teacher_prefix else 'Exam'
            
            # Default region based on exam type and year
            if exam_type == 'GCSE' and year >= 2019:
                region = 'England'
            else:
                region = 'UK'
        
        # Handle special messages
        if 'too few' in rest.lower():
            continue
        
        # Split into tokens
        tokens = re.split(r'\s+', rest)
        tokens = [t for t in tokens if t]
        
        if len(tokens) < 4:
            continue
        
        # Find subject
        subject = find_subject_for_line(lines, idx)
        
        # Parse the grade data
        grade_data = parse_grade_line(tokens, year, exam_type)
        if not grade_data:
            continue
        
        # Build complete entry
        entry = {
            'exam_type': exam_type,
            'subject': subject,
            'year': str(year),
            'region': region,
            'data_type': data_type,
            'grade_system': detect_grade_system(tokens, year, exam_type)
        }
        entry.update(grade_data)
        
        entries.append(entry)
    
    print(f"   ✓ Parsed {len(entries)} entries")
    return entries

def main():
    """Main conversion function"""
    print("=" * 70)
    print("Universal UK Exam Results Parser")
    print("=" * 70)
    
    all_entries = []
    
    # Parse A-Level data
    if A_LEVEL_INPUT.exists():
        a_level_entries = parse_file(A_LEVEL_INPUT, 'A-Level')
        all_entries.extend(a_level_entries)
    else:
        print(f"⚠️  Warning: {A_LEVEL_INPUT} not found")
    
    # Parse GCSE data
    if GCSE_INPUT.exists():
        gcse_entries = parse_file(GCSE_INPUT, 'GCSE')
        all_entries.extend(gcse_entries)
    else:
        print(f"⚠️  Warning: {GCSE_INPUT} not found")
    
    # Write unified CSV
    print(f"\n📝 Writing unified CSV to {OUTPUT}...")
    with OUTPUT.open('w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=COLUMNS)
        writer.writeheader()
        for entry in all_entries:
            writer.writerow(entry)
    
    print(f"   ✓ Wrote {len(all_entries)} total entries")
    
    # Statistics
    print("\n" + "=" * 70)
    print("📊 Statistics")
    print("=" * 70)
    
    # Count by exam type
    a_level_count = sum(1 for e in all_entries if e['exam_type'] == 'A-Level')
    gcse_count = sum(1 for e in all_entries if e['exam_type'] == 'GCSE')
    print(f"A-Level entries: {a_level_count}")
    print(f"GCSE entries: {gcse_count}")
    
    # Count by grade system
    grade_systems = {}
    for entry in all_entries:
        gs = entry['grade_system']
        grade_systems[gs] = grade_systems.get(gs, 0) + 1
    
    print("\nGrade system breakdown:")
    for gs, count in sorted(grade_systems.items()):
        print(f"  {gs}: {count} entries")
    
    # Sample entries
    print("\n" + "=" * 70)
    print("📋 Sample Entries")
    print("=" * 70)
    
    # Show diverse samples
    samples = [
        ('A-Level', 'A*-U', 2025),
        ('A-Level', 'A*-U', 2009),  # Pre-A* era
        ('GCSE', '9-1', 2025),
        ('GCSE', 'A*-G', 2010),
    ]
    
    for exam_type, grade_system, year in samples:
        matching = [e for e in all_entries 
                   if e['exam_type'] == exam_type 
                   and e['grade_system'] == grade_system 
                   and int(e['year']) == year]
        if matching:
            e = matching[0]
            print(f"\n{exam_type} - {grade_system} - {year} - {e['subject']}")
            grades = [f"g{i+1}={e[f'g{i+1}']}" for i in range(10) if e[f'g{i+1}']]
            print(f"  Grades: {', '.join(grades)}")
            print(f"  U={e['u']}, Pass={e['pass_rate']} ({e['pass_threshold']}), Candidates={e['candidates']}")
    
    print("\n" + "=" * 70)
    print("✅ Conversion complete!")
    print("=" * 70)

if __name__ == '__main__':
    main()
