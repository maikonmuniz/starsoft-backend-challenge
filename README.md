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



## Routes:

endpoint de criação de pedidos.

### post --> /order/create
```json
{
  "description": "Generate order",
  "items": [
    {
      "price": 30
    }
  ],
  "quantity": 1,
  "status": "pendente"
}
```

Este endpoint de update serve para atualizar todos os campos de pedidos, consequentemente da para cancelar o pedido.

### put --> /order/update
```json
{
  "id": 1,
  "description": "Generate order",
  "items": [
    {
      "price": 30
    }
  ],
  "quantity": 1,
  "status": "processando"
}
```

Executar testes com Jest:

```bash
yarn test
```
Acompanhar logs do Logstash em tempo real:

```bash
docker logs -f logstash
```
Subir o projeto com Docker Compose:
```bash
docker compose up
```
