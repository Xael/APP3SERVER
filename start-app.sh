#!/bin/sh

PRISMA_BIN="./node_modules/.bin/prisma"

echo "Aguardando o Banco de Dados (DB) antes da migração..."
sleep 5

echo "Forçando Sincronização do Schema (db push)..."
$PRISMA_BIN db push --accept-data-loss || { 
  echo "ERRO CRÍTICO: db push falhou. Verifique DATABASE_URL e logs do DB."
  exit 1
}

echo "Executando o Seed..."
$PRISMA_BIN db seed || { 
  echo "Aviso: db seed falhou (pode ser esperado se o seed já rodou)."
}

echo "Iniciando o Servidor Node.js..."
exec node server.js
