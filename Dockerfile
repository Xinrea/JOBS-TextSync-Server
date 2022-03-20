FROM node:16
WORKDIR /work/
COPY package*.json .
COPY main.js .
COPY room.js .
RUN npm install
EXPOSE 9000
CMD ["node", "main.js"]