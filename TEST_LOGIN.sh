#!/bin/bash
# Test login pour l'utilisateur créé

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

echo ""
echo ""
echo "💡 Pour formater la réponse en JSON, ajoutez | jq . à la fin"

