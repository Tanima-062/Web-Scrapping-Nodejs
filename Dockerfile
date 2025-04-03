# Use an official Node.js runtime as a parent image
FROM node:20
ENV TZ=Australia/Sydney

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 8080

# Define the command to run the app
CMD ["npm", "start"]

