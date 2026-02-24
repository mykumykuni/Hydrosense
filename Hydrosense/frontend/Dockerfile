# frontend/Dockerfile for React application
FROM node:24-alpine

# Create app directory
WORKDIR /usr/src/app

# copy package files and install dependencies
COPY package*.json ./
RUN npm install

# copy rest of the app
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
