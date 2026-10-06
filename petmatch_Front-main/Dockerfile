# Etapa 1: Construcción de la aplicación web Expo
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Argumento para URL de la API (por defecto http://localhost:8000)
ARG EXPO_PUBLIC_API_URL=http://localhost:8000
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Compilar la versión web con Expo Router
RUN npm run build

# Etapa 2: Servidor web ultra ligero con Nginx
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
