FROM node:9-alpine
LABEL version="1.5.1"
COPY . /src
WORKDIR /src
ENTRYPOINT ["npm", "start"]
