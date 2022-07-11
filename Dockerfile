FROM node as debug

WORKDIR /app

RUN npm install -g nodemon

COPY . .

RUN npm install

ENTRYPOINT [ "nodemon", "-L", "--inspect=0.0.0.0:5858", "./server.js"]

FROM node as prod

WORKDIR /app

COPY . .

RUN npm install 

CMD ["npm","start"]