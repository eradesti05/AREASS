# AREASS
## Academic Risk Estimation and Adaptive Scheduling System
---
Tantan Nugraha (23525015)  
Era Desti Ramayani (23525020)  
Silvia Rahma (23525021)  
Versa Syahputra Santo (23525041)  

---

### Development command:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production command:
```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stop all service:
```bash
docker compose down
```
