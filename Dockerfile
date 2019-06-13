FROM node:9-alpine
LABEL version="1.6.2"
COPY . /src
WORKDIR /src
ENTRYPOINT ["npm", "start"]
