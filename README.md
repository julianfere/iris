# Carrete

Plataforma de fotos privada y self-hosted para compartir fotos en calidad original con tu grupo. Sin compresión, sin algoritmos, sin anuncios.

## Características

- **Fotos sin compresión** — se guardan como WebP de alta calidad con los metadatos EXIF intactos
- **EXIF completo** — cámara, lente, apertura, velocidad, ISO, focal, GPS
- **Tags y búsqueda** — organizá fotos por etiquetas y buscá por título, tag o fotógrafo
- **Favoritos** — marcá las fotos que más te gustan
- **Perfiles** — avatar, bio, estadísticas de cámaras usadas y fotos subidas
- **PWA** — instalable en el celular como app nativa
- **Autenticación propia** — registro por invitación, sesiones JWT, sin servicios externos

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, standalone output)
- [NextAuth v5](https://authjs.dev/) — autenticación con Credentials provider
- [Drizzle ORM](https://orm.drizzle.team/) + SQLite (`better-sqlite3`)
- [Sharp](https://sharp.pixelplumbing.com/) — procesamiento de imágenes
- [exifr](https://github.com/MikeKovarik/exifr) — extracción de metadatos EXIF
- Docker + Docker Compose

---

## Desarrollo local

### Requisitos

- Node.js 20+
- npm

### Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de entorno
cp .env.example .env
# Editá .env con tus valores (ver sección Variables de entorno)

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). La base de datos y los directorios se crean solos en el primer arranque.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm start` | Correr el build de producción |
| `npm run db:studio` | Abrir Drizzle Studio (UI para la DB) |

---

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```env
# Clave para firmar los JWT de sesión
# Generá una con: openssl rand -base64 32
AUTH_SECRET=

# URL pública de la app (sin barra final)
AUTH_URL=http://localhost:3000

# Ruta al archivo SQLite
DATABASE_URL=file:./data/carrete.db

# Directorio donde se guardan las fotos
PHOTOS_DIR=./photos
```

---

## Deploy con Docker

### Opción 1 — Build local (recomendado para Raspberry Pi)

Buildea la imagen directamente en el servidor:

```bash
# En el servidor (ej: Raspberry Pi)
git clone <repo> carrete
cd carrete/carrete-app

# Crear .env con AUTH_SECRET y AUTH_URL
cp .env.example .env
# Editá .env

# Buildear y levantar
docker compose up -d --build
```

La primera vez el build tarda ~10-15 min en una Pi 4. Los builds siguientes son más rápidos gracias al cache de capas.

### Opción 2 — Build en otra máquina y transferencia por red local

Si buildear en la Pi es muy lento, podés buildear en tu PC y transferir la imagen:

```bash
# En tu PC — buildear para arm64
docker buildx build --platform linux/arm64 -t carrete:latest --load .

# Transferir la imagen a la Pi por SSH
docker save carrete:latest | ssh pi@192.168.x.x docker load

# En la Pi — copiar el docker-compose y .env, luego levantar
ssh pi@192.168.x.x "cd carrete && docker compose up -d"
```

### Actualizar a una nueva versión

```bash
# En la Pi
cd carrete/carrete-app
git pull
docker compose up -d --build
```

---

## Persistencia de datos

Docker Compose monta dos volúmenes en el directorio donde corrés `docker compose`:

```
./data/     → base de datos SQLite (carrete.db)
./photos/   → fotos originales, thumbnails y avatares
```

**Hacé backup de esas dos carpetas.** Con eso podés restaurar todo en otro servidor.

---

## Estructura del proyecto

```
carrete-app/
├── app/
│   ├── (auth)/          # Login / registro
│   ├── (app)/           # App protegida
│   │   ├── global/      # Feed principal, búsqueda, miembros
│   │   └── profile/     # Perfil de usuario
│   └── api/             # API routes
├── components/          # Componentes React
├── lib/
│   ├── auth.ts          # Configuración NextAuth
│   ├── db.ts            # Inicialización SQLite + migraciones
│   ├── schema.ts        # Tablas Drizzle
│   └── photos.ts        # Procesamiento de imágenes
├── public/              # Assets estáticos + PWA manifest
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Healthcheck

La app expone un endpoint de salud en `/api/health`. Docker Compose lo usa para verificar que el contenedor está listo.

```bash
curl http://localhost:3000/api/health
```
