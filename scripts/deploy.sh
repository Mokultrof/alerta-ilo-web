#!/bin/bash

# Deployment Script for Alerta Ilo
# This script handles the complete deployment process to Firebase

set -e  # Exit on any error

echo "🚀 Starting deployment process for Alerta Ilo..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase:"
    firebase login
fi

# Select deployment type
DEPLOY_TYPE=${1:-"full"}

case $DEPLOY_TYPE in
    "hosting")
        echo "🌐 Deploying hosting only..."
        npm run build:prod
        firebase deploy --only hosting
        ;;
    "rules")
        echo "🔒 Deploying security rules only..."
        firebase deploy --only firestore:rules,storage:rules
        ;;
    "full")
        echo "🚀 Full deployment (hosting + rules)..."
        npm run build:prod
        firebase deploy
        ;;
    *)
        echo "❌ Invalid deployment type. Use: hosting, rules, or full"
        exit 1
        ;;
esac

echo "✅ Deployment completed successfully!"

# Get the hosting URL
PROJECT_ID=$(firebase use --current 2>/dev/null || echo "alerta-ilo")
echo "🌍 Your app is live at: https://$PROJECT_ID.web.app"