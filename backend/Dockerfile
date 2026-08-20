FROM node:18-alpine

# Install ffmpeg, curl, python3 (needed by yt-dlp)
RUN apk add --no-cache ffmpeg curl python3

# Install yt-dlp (latest stable)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Install deno (required by yt-dlp for YouTube JS challenge solving)
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the code
COPY . .

# Create necessary directories
RUN mkdir -p /app/downloads /app/logs /app/backups /music

# Expose the port
EXPOSE 3001

# Default command
CMD ["node", "src/app.js"]
