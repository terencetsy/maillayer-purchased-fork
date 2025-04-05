FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install PM2 globally
RUN npm install -g pm2

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Make worker scripts executable
RUN chmod +x workers/*.js || true

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start PM2 in production mode using the ecosystem file
CMD ["pm2-runtime", "ecosystem.config.js"]