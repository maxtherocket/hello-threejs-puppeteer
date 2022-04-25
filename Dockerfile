FROM node:18.0.0-bullseye

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    xorg \
    xserver-xorg \
    xvfb \
    libx11-dev \
    libxext-dev \
    chromium \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

USER node

# ENV PORT 3000

EXPOSE 3000

CMD npm run start
