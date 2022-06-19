FROM node:17.9.1-alpine
WORKDIR test
COPY package*.json ./
RUN npm ci
COPY postman/* postman/
COPY src src
COPY jest.config.js .
COPY tsconfig.json .
COPY .eslintrc.js .
COPY tests tests

