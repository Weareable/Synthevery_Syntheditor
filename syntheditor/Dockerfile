FROM node:20-bullseye

RUN apt-get update && apt-get install -y build-essential cmake

WORKDIR /app

COPY package.json ./

RUN npm install