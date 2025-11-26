FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY auditor.js ./
EXPOSE 3002
CMD ["node","auditor.js"]
