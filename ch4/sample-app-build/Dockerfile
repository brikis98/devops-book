FROM node:21.7

WORKDIR /home/node/app

COPY package.json .
COPY app.js .

EXPOSE 8080

USER node

CMD ["npm", "start"]
