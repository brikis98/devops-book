FROM node:21.7

WORKDIR /home/node/app

COPY package.json .
COPY package-lock.json .

RUN npm ci --only=production

COPY *.js .

EXPOSE 8080

USER node

CMD ["npm", "start"]
