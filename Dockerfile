FROM node:9-alpine
LABEL version="1.7.3"
COPY . /src
WORKDIR /src
ENTRYPOINT ["npm", "start"]
