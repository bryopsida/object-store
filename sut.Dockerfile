FROM node:18.12.1-alpine
WORKDIR /test
COPY package*.json ./
RUN npm ci
COPY postman/* postman/
COPY src src
COPY jest.config.js .
COPY tsconfig.json .
COPY .eslintrc.js .
COPY tests tests

