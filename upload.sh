#!/bin/bash

clear
echo "🧹 Cleaning up before upload..."

# Jangan pernah upload file .env
if [ -f ".env" ]; then
  echo "⚠️ .env file detected. Auto-skip upload for security reasons."
fi

# Pastikan semua perubahan tersimpan
git add .

# Cek apakah ada perubahan
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to upload."
    exit 0
fi

# Commit perubahan
read -p "📝 Masukkan pesan commit: " commitMessage

if [ -z "$commitMessage" ]; then
  commitMessage="🔄 Update minor changes"
fi

git commit -m "$commitMessage"

# Push ke GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo "✅ Upload selesai!"
