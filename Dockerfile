FROM node:20-alpine

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy the application
COPY . .

# Install dependencies
RUN npm install

# Make worker scripts executable
RUN chmod +x workers/*.js

# Expose the port Next.js runs on
EXPOSE 3000

# Create dev mode ecosystem file
RUN echo 'module.exports = { \
  apps: [ \
    { \
      name: "maillayer-nextjs", \
      script: "npm", \
      args: "run dev", \
      env: { NODE_ENV: "development" } \
    }, \
    { \
      name: "email-worker", \
      script: "workers/email-processor.js", \
      env: { NODE_ENV: "development" } \
    }, \
    { \
      name: "cron-checker", \
      script: "workers/cron-checker.js", \
      env: { NODE_ENV: "development" } \
    }, \
    { \
      name: "campaign-manager", \
      script: "workers/campaign-manager.js", \
      env: { NODE_ENV: "development" } \
    } \
  ] \
};' > ecosystem.dev.js

# Start the application using PM2 in dev mode
CMD ["pm2-runtime", "ecosystem.dev.js"]