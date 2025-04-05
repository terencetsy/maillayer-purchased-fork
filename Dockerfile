# Use official Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY . .

# Create logs directory to avoid PM2 issues
RUN mkdir -p logs

# Make worker scripts executable (optional safety)
RUN chmod +x workers/*.js || true

# Build Next.js app for production
RUN npm run build

# Expose the port Next.js serves on
EXPOSE 3000

# Start app and workers with PM2 using ecosystem config
CMD ["pm2-runtime", "ecosystem.config.js"]
