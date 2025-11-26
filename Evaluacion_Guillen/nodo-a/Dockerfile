FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY iniciador.js ./
EXPOSE 8080 3000
CMD ["node","iniciador.js"]
