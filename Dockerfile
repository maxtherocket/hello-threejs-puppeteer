FROM node:18.0.0-bullseye

# RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
#     xorg \
#     xserver-xorg \
#     xvfb \
#     libx11-dev \
#     libxext-dev \
#     chromium \
#  && apt-get clean \
#  && rm -rf /var/lib/apt/lists/*

 # Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

USER node

# ENV PORT 3000

EXPOSE 3000

CMD npm run start
