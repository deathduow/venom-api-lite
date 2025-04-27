# Gunakan image resmi Playwright yang sudah lengkap Chromium + dependensinya
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Set Working Directory
WORKDIR /app

# Copy file package.json dan install dependencies
COPY package.json ./
RUN npm install

# Copy semua source code ke container
COPY . .

# Expose port yang digunakan server.js
EXPOSE 3371

# Command to start server
CMD ["node", "server.js"]
