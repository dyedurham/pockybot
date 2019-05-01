FROM node:9-alpine
LABEL version "1.4.1"
COPY . /src
WORKDIR /src
ENTRYPOINT ["npm", "start"]
