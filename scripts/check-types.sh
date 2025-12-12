#!/bin/bash

# Script para verificar tipos solo en nuestro código, ignorando node_modules

echo "🔍 Verificando tipos en el código fuente..."

# Verificar solo archivos src con TypeScript
npx tsc --noEmit --skipLibCheck --project tsconfig.json

if [ $? -eq 0 ]; then
    echo "✅ Verificación de tipos completada sin errores"
else
    echo "❌ Se encontraron errores de tipos"
    exit 1
fi

# Verificar ESLint
echo "🔍 Verificando ESLint..."
npm run lint

if [ $? -eq 0 ]; then
    echo "✅ ESLint completado sin errores"
else
    echo "❌ Se encontraron errores de ESLint"
    exit 1
fi

echo "🎉 Todas las verificaciones pasaron exitosamente"