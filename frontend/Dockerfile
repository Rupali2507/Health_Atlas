# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json first (better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port Vite uses
EXPOSE 5173

# Run the dev server, but force it to be accessible from outside
CMD ["npm", "run", "dev", "--", "--host"]