# 🚀 SwachhCity Docker Deployment - Quick Start

> Complete Docker deployment setup for SwachhCity - Ready to deploy in minutes!

## ⚡ Quick Commands

### Development (Local Testing)
```bash
# Start all services
./deploy.sh development up

# View logs
./deploy.sh development logs

# Stop services
./deploy.sh development down
```

### Production (Cloud Deployment)
```bash
# Deploy to production
./deploy.sh production up

# Check status
./deploy.sh production status

# View logs
./deploy.sh production logs

# Restart services
./deploy.sh production restart
```

### Windows Users
```cmd
# Replace ./deploy.sh with deploy.bat
deploy.bat development up
deploy.bat production logs
```

---

## 📦 What's Included

✅ **Multi-stage Dockerfiles** - Optimized builds for production  
✅ **Docker Compose** - Development & Production configurations  
✅ **Nginx Reverse Proxy** - Load balancing & SSL termination  
✅ **Health Checks** - Automatic service monitoring  
✅ **Environment Configuration** - Easy setup for any deployment  
✅ **Deployment Scripts** - One-command deployment  
✅ **Complete Documentation** - Step-by-step guides  

---

## 🎯 5-Minute Setup

### 1. Prerequisites
```bash
# Install Docker Desktop from: https://www.docker.com/products/docker-desktop
# Or on Linux:
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone & Configure
```bash
git clone https://github.com/MDAQUILKHAN963/SwachhCity.git
cd swachhcity1

# For production only:
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
# Edit and set your domain/settings
```

### 3. Deploy
```bash
# Development
./deploy.sh development up

# Production
./deploy.sh production up
```

### 4. Access Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development configuration |
| `docker-compose.prod.yml` | Production configuration |
| `frontend/Dockerfile` | Frontend build (multi-stage) |
| `backend/Dockerfile.prod` | Backend production build |
| `ml-service/Dockerfile.prod` | ML service production build |
| `nginx.conf` | Reverse proxy & load balancer |
| `deploy.sh` | Linux/Mac deployment script |
| `deploy.bat` | Windows deployment script |
| `DOCKER_DEPLOYMENT.md` | Full documentation |

---

## 🔧 Common Tasks

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ml-service
docker-compose logs -f frontend
```

### Access Shell
```bash
# Backend
docker exec -it swachhcity-backend sh

# ML Service
docker exec -it swachhcity-ml bash

# MongoDB
docker exec -it swachhcity-mongodb mongosh
```

### Backup Database
```bash
./deploy.sh development backup
./deploy.sh production backup
```

### Update Images
```bash
# Pull latest base images
./deploy.sh development pull

# Rebuild all images
./deploy.sh development build
```

### Clean Up
```bash
# Remove stopped containers and images
./deploy.sh development cleanup
```

---

## 🌐 Production Deployment on Cloud

### AWS EC2
1. Launch Ubuntu 22.04 instance (t3.medium)
2. SSH into instance
3. Run: `curl -fsSL https://get.docker.com | sh`
4. Follow "5-Minute Setup" above

### DigitalOcean
1. Create Droplet with Docker pre-installed
2. SSH into droplet
3. Follow "5-Minute Setup" above

### Render.com
Use Render's Docker deployment feature with `docker-compose.prod.yml`

### Railway.app
Connect GitHub repo for auto-deployment with `docker-compose.prod.yml`

---

## 🔐 Production Checklist

- [ ] Change JWT_SECRET in `.env`
- [ ] Set CORS_ORIGIN to your domain
- [ ] Generate SSL certificate (Let's Encrypt)
- [ ] Configure domain DNS
- [ ] Test HTTPS access
- [ ] Set up monitoring/alerts
- [ ] Configure database backups
- [ ] Test email/SMS (if configured)
- [ ] Load test application
- [ ] Document custom changes

---

## 🚨 Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose logs backend

# Verify Docker is running
docker ps

# Restart Docker
systemctl restart docker
```

### Database Connection Error
```bash
# Check MongoDB
docker exec swachhcity-mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker exec swachhcity-redis redis-cli ping
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Out of Memory
```bash
# Check usage
docker stats

# Reduce container limits in docker-compose.prod.yml
```

---

## 📚 Documentation

For detailed information, see:
- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Complete guide
- **[README.md](./README.md)** - Project overview
- **[PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md)** - Development roadmap

---

## 🤝 Support

Issues or questions?
- GitHub Issues: https://github.com/MDAQUILKHAN963/SwachhCity/issues
- Docker Docs: https://docs.docker.com
- Compose Reference: https://docs.docker.com/compose/compose-file/

---

## ✨ Features by Service

### Frontend
- React with Vite
- Real-time updates via Socket.io
- Responsive Tailwind CSS
- Maps integration (Leaflet)

### Backend
- Express.js REST API
- JWT authentication
- MongoDB + Redis
- Socket.io real-time
- File upload handling

### ML Service
- YOLOv8 garbage detection
- Severity classification
- Route optimization
- Hotspot prediction

### Infrastructure
- Nginx load balancing
- SSL/TLS support
- Rate limiting
- Health monitoring
- Data persistence

---

## 🎓 Learning Resources

- Docker Tutorial: https://docs.docker.com/get-started/
- Docker Compose: https://docs.docker.com/compose/
- Production Best Practices: https://docs.docker.com/compose/production/

---

**Happy Deploying! 🚀**
