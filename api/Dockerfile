FROM node:20

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json ./
RUN npm install

# App source (in dev, compose bind-mounts over this).
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
