FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the API port
EXPOSE 3001

# Start in development mode (assumes "dev" script runs nodemon)
CMD ["npm", "run", "dev"]
