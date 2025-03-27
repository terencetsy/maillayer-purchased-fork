FROM node:20-alpine

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy everything
COPY . .

# Install all dependencies
RUN npm install

# Build Next.js app
RUN NODE_ENV=production npm run build

# Start Next.js and workers with PM2
CMD ["npm", "run", "pm2:start"]