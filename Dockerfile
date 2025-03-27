FROM node:20-alpine

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy the application
COPY . .

# Install dependencies
RUN npm install

# Make worker scripts executable
RUN chmod +x workers/*.js

# Create a startup script
RUN echo '#!/bin/sh\n\
echo "Starting Next.js application and workers..."\n\
npm run dev & \n\
node workers/email-processor.js & \n\
node workers/cron-checker.js & \n\
node workers/campaign-manager.js & \n\
wait\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose the port Next.js runs on
EXPOSE 3000

# Start directly without PM2 for troubleshooting
CMD ["/app/start.sh"]