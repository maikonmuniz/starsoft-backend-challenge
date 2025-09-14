## 🚀 Teste para Desenvolvedor(a) Back-End Node.js/Nest.js

## Bem-vindo(a) ao Projeto para o processo seletivo da StartSoft

### Contexto

Todos os obejtivos foram implementados como:

- ✅ Prometheus e Grafana
- ✅ Elastic Stack (ELK)
- ✅ CRUD
- ✅ Kafka
- ✅ Docker Compose
- ✅ Clean Code
- ✅ Testes
- ✅ Swagger

📊 Grafana → http://localhost:3000

📈 Prometheus → http://localhost:9090

🔍 Elasticsearch → http://localhost:5601/

🔗 Kafka UI → http://localhost:8080

📖 Swagger (API Docs) → http://localhost:5050/api

#!/bin/bash
echo "🧪 Executando testes com Jest..."
yarn test

#!/bin/bash
echo "📜 Acompanhando logs do Logstash em tempo real..."
docker logs -f logstash

#!/bin/bash
echo "🚀 Subindo o projeto com Docker Compose..."
docker compose up
