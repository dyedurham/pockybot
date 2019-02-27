FROM node:9-alpine
LABEL version "1.3.0"
COPY . /src
WORKDIR /src
ENTRYPOINT ["npm", "start"]
