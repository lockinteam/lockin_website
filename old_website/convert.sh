#!/bin/bash
set -e
cd "$(dirname "$0")"
mkdir -p assets/videos assets/posters assets/images assets/fonts css js

convert_one() {
  local src="$1"
  local name="$2"
  echo "Converting $src -> $name.mp4"
  ffmpeg -y -i "assets/$src" \
    -vf "scale=720:-2,fps=30" \
    -c:v libx264 -preset medium -crf 24 \
    -profile:v high -pix_fmt yuv420p \
    -an \
    -movflags +faststart \
    "assets/videos/$name.mp4" 2>&1 | tail -2
  # Extract poster from middle frame
  local dur
  dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "assets/videos/$name.mp4")
  local mid
  mid=$(echo "$dur / 2" | bc -l)
  ffmpeg -y -ss "$mid" -i "assets/videos/$name.mp4" -frames:v 1 -q:v 4 "assets/posters/$name.jpg" 2>&1 | tail -1
}

convert_one "Login.mov" "login"
convert_one "Selecting a subject + subject selection.mov" "subject-select"
convert_one "Opening a subject + analytics.mov" "subject-open"
convert_one "All topics + notes.mov" "notes"
convert_one "Questions + Flashcards.mov" "questions"
convert_one "Past Papers.mov" "past-papers"
convert_one "Leaderboard.mov" "leaderboard"
convert_one "Streaks.mov" "streaks"

echo "DONE_CONVERSION"
ls -la assets/videos/
ls -la assets/posters/
