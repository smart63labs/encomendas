#!/bin/bash

# Script para deploy em rede local
# Configura automaticamente os IPs para acesso externo

echo "🚀 Iniciando deploy para rede local..."

# Detectar IP da máquina
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "📍 IP detectado: $LOCAL_IP"

# Atualizar arquivo .env
echo "📝 Atualizando configurações..."
sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://$LOCAL_IP:3001/api|g" .env

# Atualizar docker-compose.yml
sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://$LOCAL_IP:3001/api|g" docker-compose.yml

# Atualizar backend .env
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:8081,http://localhost:8082,http://localhost:3000,http://$LOCAL_IP:8080,http://$LOCAL_IP:3001|g" backend/.env

echo "✅ Configurações atualizadas para IP: $LOCAL_IP"

# Rebuild e restart dos containers
echo "🔄 Reconstruindo containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "🎉 Deploy concluído!"
echo "🌐 Frontend disponível em: http://$LOCAL_IP:8080"
echo "🔗 Backend disponível em: http://$LOCAL_IP:3001"
echo "📚 Documentação: http://$LOCAL_IP:3001/docs"