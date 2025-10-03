version: '3.8'

services:
  # =====================================================
  # NGINX REVERSE PROXY
  # =====================================================
  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/cache:/var/cache/nginx
    networks:
      - jobnexai-network
    depends_on:
      - n8n
      - fastapi
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # =====================================================
  # N8N WORKFLOWS
  # =====================================================
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    environment:
      # Auth
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=lionel
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      
      # Network
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.jobnexai.com/
      
      # Timezone
      - GENERIC_TIMEZONE=Europe/Paris
      - TZ=Europe/Paris
      
      # Performance
      - N8N_METRICS=true
      - N8N_LOG_LEVEL=info
      - N8N_LOG_OUTPUT=console,file
      
      # Execution
      - EXECUTIONS_PROCESS=main
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - EXECUTIONS_TIMEOUT=300
      - EXECUTIONS_TIMEOUT_MAX=600
      
      # Database PostgreSQL (recommandé production)
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=${DB_HOST}
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=${DB_USER}
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      
    volumes:
      - n8n-data:/home/node/.n8n
      - ./n8n-workflows:/home/node/.n8n/workflows:ro
      - n8n-logs:/var/log/n8n
      
    networks:
      - jobnexai-network
    
    depends_on:
      - redis
      - postgres
    
    deploy:
      resources:
        limits:
          cpus: '3'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 1G

  # =====================================================
  # FASTAPI WEBHOOKS
  # =====================================================
  fastapi:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: fastapi
    restart: always
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - N8N_WEBHOOK_URL=http://n8n:5678
      - REDIS_URL=redis://redis:6379
      - ENVIRONMENT=production
    volumes:
      - ./api:/app:ro
      - fastapi-logs:/var/log/fastapi
    networks:
      - jobnexai-network
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # =====================================================
  # REDIS (CACHE + QUEUE)
  # =====================================================
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: always
    command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 1G

  # =====================================================
  # POSTGRESQL (N8N DATABASE)
  # =====================================================
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # =====================================================
  # BULLMQ WORKERS (TÂCHES LOURDES)
  # =====================================================
  worker-cv-extraction:
    build:
      context: ./workers
      dockerfile: Dockerfile.worker
    container_name: worker-cv
    restart: always
    environment:
      - REDIS_URL=redis://redis:6379
      - WORKER_TYPE=cv_extraction
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    networks:
      - jobnexai-network
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  worker-ai-enrichment:
    build:
      context: ./workers
      dockerfile: Dockerfile.worker
    container_name: worker-ai
    restart: always
    environment:
      - REDIS_URL=redis://redis:6379
      - WORKER_TYPE=ai_enrichment
      - MAMMOUTH_API_KEY=${MAMMOUTH_API_KEY}
    networks:
      - jobnexai-network
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # =====================================================
  # MONITORING STACK
  # =====================================================
  
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    environment:
      - GF_SECURITY_ADMIN_USER=lionel
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_SERVER_ROOT_URL=https://monitoring.jobnexai.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    networks:
      - jobnexai-network
    depends_on:
      - prometheus
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: always
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: always
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M

  loki:
    image: grafana/loki:latest
    container_name: loki
    restart: always
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./monitoring/loki-config.yaml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    restart: always
    command: -config.file=/etc/promtail/config.yml
    volumes:
      - ./monitoring/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - n8n-logs:/var/log/n8n:ro
      - fastapi-logs:/var/log/fastapi:ro
    networks:
      - jobnexai-network
    depends_on:
      - loki

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    restart: always
    command:
      - '--config.file=/etc/alertmanager/config.yml'
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/config.yml:ro
      - alertmanager-data:/alertmanager
    networks:
      - jobnexai-network
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M

# =====================================================
# VOLUMES
# =====================================================
volumes:
  n8n-data:
    driver: local
  n8n-logs:
    driver: local
  fastapi-logs:
    driver: local
  redis-data:
    driver: local
  postgres-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  loki-data:
    driver: local
  alertmanager-data:
    driver: local

# =====================================================
# NETWORKS
# =====================================================
networks:
  jobnexai-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
