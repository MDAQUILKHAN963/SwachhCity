# 🚀 Docker Deployment Guide for SwachhCity

Complete guide to deploy SwachhCity using Docker and Docker Compose.

## 📋 Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Domain Name** (optional but recommended)
- **SSL Certificate** (for production HTTPS)
- **Server** with at least 2GB RAM

### Install Docker & Docker Compose

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Windows/Mac:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install and follow setup instructions

---

## 🏗️ Project Structure

```
swachhcity1/
├── frontend/               # React frontend with Dockerfile
├── backend/                # Node.js API with Dockerfile.prod
├── ml-service/             # Python ML service with Dockerfile.prod
├── docker-compose.yml      # Development compose file
├── docker-compose.prod.yml # Production compose file
├── nginx.conf              # Reverse proxy configuration
└── .env files              # Environment configurations
```

---

## 📦 Available Images

- **Frontend**: Multi-stage build with Vite optimization
- **Backend**: Node.js with production dependencies
- **ML Service**: Python with YOLOv8 support
- **MongoDB**: Database service
- **Redis**: Caching service
- **Nginx**: Reverse proxy & load balancer

---

## 🔧 Configuration

### 1. Clone Repository

```bash
git clone https://github.com/MDAQUILKHAN963/SwachhCity.git
cd swachhcity1
```

### 2. Create Environment Files

**Backend Configuration:**
```bash
cd backend
cp .env.production .env
# Edit .env with your settings
nano .env
```

**Update these critical values:**
```
JWT_SECRET=your-secure-random-key-here
MONGODB_URI=mongodb://mongodb:27017/swachhcity
REDIS_URL=redis://redis:6379
ML_SERVICE_URL=http://ml-service:8000
CORS_ORIGIN=https://yourdomain.com
```

**Frontend Configuration:**
```bash
cd ../frontend
cp .env.production .env
# Update with your domain
nano .env
```

```
VITE_API_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
VITE_ML_API_URL=https://yourdomain.com/ml
```

### 3. SSL Certificate Setup (Production)

**Option A: Using Let's Encrypt (Recommended)**

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to ssl directory
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chmod 644 ssl/*
```

**Option B: Self-Signed Certificate (Testing Only)**

```bash
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -nodes -out ssl/cert.pem -keyout ssl/key.pem -days 365
```

---

## 🚀 Deployment Commands

### Development Deployment

```bash
# Start all services (development mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check individual service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs ml-service
docker-compose -f docker-compose.prod.yml logs frontend

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## 📊 Service Details

### Frontend (Port 3000)
- Built with Vite for optimal performance
- Served through Nginx reverse proxy
- Environment-based API configuration

### Backend API (Port 5000)
- Express.js server with full stack features
- MongoDB connection pooling
- Redis caching layer
- JWT authentication
- Health check at `/health`

### ML Service (Port 8000)
- FastAPI with async support
- YOLOv8 garbage detection
- Route optimization engine
- Health check at `/health`

### Nginx (Port 80/443)
- Reverse proxy for all services
- SSL/TLS termination
- Rate limiting & security headers
- Gzip compression
- Static file caching

### MongoDB (Port 27017)
- Data persistence with volumes
- Automatic initialization
- Health checks enabled

### Redis (Port 6379)
- Session caching
- Rate limiting storage
- Data persistence with AOF

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env files
echo ".env*" >> .gitignore
echo "ssl/" >> .gitignore

# Use strong secrets
JWT_SECRET=$(openssl rand -base64 32)
```

### 2. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH (if using)
sudo ufw enable
```

### 3. Regular Updates
```bash
# Rebuild images regularly
docker-compose -f docker-compose.prod.yml build --pull --no-cache

# Update base images
docker pull node:18-alpine
docker pull python:3.11-slim
docker pull mongo:7
docker pull redis:7-alpine
```

### 4. Backup Strategy
```bash
# Backup MongoDB data
docker exec swachhcity-mongodb mongodump --out /data/db/backup

# Backup Redis data
docker exec swachhcity-redis redis-cli BGSAVE

# Copy to local storage
docker cp swachhcity-mongodb:/data/db/backup ./backup
```

---

## 📈 Scaling & Performance

### Horizontal Scaling

**Run multiple backend instances:**
```yaml
backend-1:
  # ... config ...

backend-2:
  ports:
    - "5001:5000"
  # ... same config ...

backend-3:
  ports:
    - "5002:5000"
  # ... same config ...
```

Then configure Nginx for load balancing in `nginx.conf`.

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Monitor Resources

```bash
# View real-time resource usage
docker stats

# View detailed container info
docker inspect swachhcity-backend
```

---

## 🐛 Troubleshooting

### Container Not Starting

```bash
# Check logs
docker logs swachhcity-backend

# Inspect container
docker inspect swachhcity-backend

# Restart service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues

```bash
# Check MongoDB status
docker exec swachhcity-mongodb mongosh --eval "db.adminCommand('ping')"

# View MongoDB logs
docker logs swachhcity-mongodb
```

### ML Service Not Available

```bash
# Check Python dependencies
docker exec swachhcity-ml pip list

# View ML logs
docker logs swachhcity-ml

# Rebuild ML image
docker-compose -f docker-compose.prod.yml build --no-cache ml-service
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000

# Change port in docker-compose.prod.yml or kill process
kill -9 <PID>
```

---

## 📡 Deployment Platforms

### Deploy on Cloud Servers

**AWS EC2:**
1. Launch Ubuntu instance (t3.medium recommended)
2. Install Docker & Docker Compose
3. Clone repository
4. Configure environment & SSL
5. Run: `docker-compose -f docker-compose.prod.yml up -d`

**DigitalOcean:**
1. Create Droplet (2GB RAM minimum)
2. Select Ubuntu 22.04 with Docker pre-installed
3. SSH into droplet
4. Follow above steps

**Linode/Akamai:**
1. Create Linode instance (Nanode 2GB)
2. Install Docker
3. Clone & deploy

### Using Docker Swarm (Multiple Servers)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml swachhcity

# View services
docker service ls

# View logs
docker service logs swachhcity_backend
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Images
        run: docker-compose -f docker-compose.prod.yml build
      
      - name: Push to Registry
        env:
          REGISTRY: your-docker-registry
        run: |
          docker-compose -f docker-compose.prod.yml push
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd swachhcity1
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
```

---

## 📋 Maintenance Checklist

- [ ] Configure SSL certificate
- [ ] Set strong JWT_SECRET
- [ ] Update CORS_ORIGIN to your domain
- [ ] Test all endpoints
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
- [ ] Set up log aggregation
- [ ] Test failover procedures
- [ ] Document custom configurations
- [ ] Plan scaling strategy

---

## 🎯 Next Steps

1. **Domain Setup**: Point your domain to server IP
2. **DNS Records**: Add A record pointing to server
3. **SSL Renewal**: Set up auto-renewal cron job
4. **Monitoring**: Implement health checks & alerts
5. **Logging**: Set up centralized logging
6. **Backup**: Schedule daily database backups

---

## 📞 Support & Issues

For issues or questions:
- GitHub Issues: https://github.com/MDAQUILKHAN963/SwachhCity/issues
- Docker Documentation: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose

---

## 📄 License

MIT License - See LICENSE file for details
