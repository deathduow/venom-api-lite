#!/bin/bash

echo "🚀 Starting upload process..."

git add .
echo "✅ Staged all changes."

echo "Masukkan pesan commit:"
read commit_message

git commit -m "$commit_message"
echo "✅ Commit done."

git push -u origin main
echo "✅ Push to GitHub done."

echo "🔥 Upload finished successfully!"
