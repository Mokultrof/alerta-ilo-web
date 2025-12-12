#!/bin/bash

# Script para arreglar errores de linting automáticamente

echo "🔧 Arreglando errores de linting..."

# Arreglar variables no utilizadas en archivos de test
find src -name "*.test.tsx" -o -name "*.test.ts" | while read file; do
    # Reemplazar variables no utilizadas con prefijo _
    sed -i 's/(auth, callback)/(\_auth, \_callback)/g' "$file"
    sed -i 's/(error, errorInfo)/(error, \_errorInfo)/g' "$file"
    echo "✅ Arreglado: $file"
done

# Arreglar dependencias faltantes en useEffect
echo "🔧 Arreglando dependencias de useEffect..."

# Arreglar ErrorContext
sed -i 's/\[errors\]/[errors, removeError]/g' src/contexts/ErrorContext.tsx

# Arreglar ReportsContext  
sed -i 's/\[user\]/[user, loadInitialData]/g' src/contexts/ReportsContext.tsx

echo "✅ Errores de linting arreglados"