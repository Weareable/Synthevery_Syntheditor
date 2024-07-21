FROM node:20-alpine

WORKDIR /syntheditor

COPY . .

RUN npm install
RUN npm run build

CMD ["npm", "start"]