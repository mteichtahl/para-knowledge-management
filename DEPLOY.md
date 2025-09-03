# Docker Deployment

## Quick Start

1. **Start the application:**
```bash
docker-compose up -d
```

2. **Check health:**
```bash
curl http://localhost:3000/health
```

3. **View items:**
```bash
curl http://localhost:3000/items
```

## Services

- **PostgreSQL**: Port 5432 with pgvector extension
- **PARA App**: Port 3000 with REST API

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (production/development)
- `PORT`: Application port (default: 3000)

## Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Reset database
docker-compose down -v && docker-compose up -d
```
