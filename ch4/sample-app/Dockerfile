FROM node:21.7

WORKDIR /home/node/app

COPY *.json .

COPY *.js .

EXPOSE 8080

USER node

CMD ["npm", "start"]
