FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the Vite port
EXPOSE 5173

# Start in development mode with --host to expose to the container network
CMD ["npm", "run", "dev", "--", "--host"]
