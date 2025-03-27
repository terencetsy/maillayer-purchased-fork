FROM node:20-alpine

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create a custom PM2 ecosystem file
RUN echo 'module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "npm",
      args: "run dev -- -H 0.0.0.0",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "email-worker",
      script: "./workers/email-processor.js",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "cron-checker",
      script: "./workers/cron-checker.js",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "campaign-manager",
      script: "./workers/campaign-manager.js",
      env: {
        NODE_ENV: "development"
      }
    }
  ]
}' > pm2.config.js

# Make worker scripts executable
RUN chmod +x workers/*.js

# Expose port
EXPOSE 3000

# Start PM2 in runtime mode (suitable for containers)
CMD ["pm2-runtime", "pm2.config.js"]