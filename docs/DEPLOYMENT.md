# Deployment Guide

Deploy Portfolio Tracker using Docker on your local machine or NAS.

## Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)

## Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/arniesaha/portfolio-tracker.git
cd portfolio-tracker

# Build and start
docker compose up -d --build

# Check status
docker compose ps
```

Access the app at: `http://localhost:5173`

## Configuration

### Environment Variables

Edit `docker-compose.yml` to configure:

```yaml
environment:
  - ALLOWED_ORIGINS=http://localhost:5173,http://your-ip:5173
  - DEBUG=False
  - ANTHROPIC_API_KEY=your_key  # Optional, for AI features
```

### Changing the Port

Edit `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Change 5173 to your preferred port
```

Update `ALLOWED_ORIGINS` to match.

## NAS Deployment

### Ubuntu-based NAS (UGREEN, etc.)

1. **Transfer files to NAS:**
```bash
# Create archive
cd /path/to/portfolio-tracker
tar czf ../portfolio-tracker.tar.gz .

# Transfer
scp ../portfolio-tracker.tar.gz user@nas-ip:

# SSH and extract
ssh user@nas-ip
tar xzf portfolio-tracker.tar.gz -C portfolio-tracker
cd portfolio-tracker
```

2. **Update configuration:**
```bash
# Edit docker-compose.yml with your NAS IP
nano docker-compose.yml
# Change ALLOWED_ORIGINS to include your NAS IP
```

3. **Start the application:**
```bash
docker compose up -d --build
```

4. **Access:** `http://nas-ip:5173`

### Synology DSM

- Use Container Manager or SSH
- Place files in `/volume1/docker/portfolio-tracker`

### QNAP

- Use Container Station or SSH
- Place files in `/share/Container/portfolio-tracker`

## Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start in background |
| `docker compose down` | Stop all containers |
| `docker compose logs -f` | View live logs |
| `docker compose logs -f backend` | Backend logs only |
| `docker compose restart` | Restart services |
| `docker compose up -d --build` | Rebuild and start |

## Data Persistence

Database is stored in a Docker volume `portfolio-data`.

### Backup

```bash
# Backup database
docker compose cp backend:/app/data/portfolio.db ./backup-$(date +%Y%m%d).db
```

### Restore

```bash
# Restore database
docker compose cp ./backup.db backend:/app/data/portfolio.db
docker compose restart backend
```

## Auto-start on Boot

Containers use `restart: unless-stopped` policy. Ensure Docker service starts on boot:

```bash
sudo systemctl enable docker
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Rebuild from scratch
docker compose down
docker compose up -d --build --force-recreate
```

### Can't access from other devices

1. Check `ALLOWED_ORIGINS` includes the access URL
2. Verify firewall allows the port
3. Use the host's IP address, not `localhost`

### Database issues

```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d --build
```
