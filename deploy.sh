#!/bin/bash

echo "🚀 AI Portfolio Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check requirements
echo -e "${YELLOW}Checking requirements...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Requirements satisfied${NC}"

# Setup environment
echo -e "${YELLOW}Setting up environment...${NC}"

# Check if .env exists in backend
if [ ! -f backend/.env ]; then
    echo -e "${RED}.env file not found in backend directory${NC}"
    echo "Please run: cd backend && python generate_keys.py"
    exit 1
fi

# Copy .env to root for docker-compose
cp backend/.env .env

# Build and deploy
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo ""
    echo "🎉 Your AI Portfolio is now running!"
    echo "====================================="
    echo "📍 Portfolio: http://localhost"
    echo "📍 API: http://localhost:5000"
    echo "📍 Admin: http://localhost/admin/admin.html"
    echo ""
    echo "📝 Next steps:"
    echo "1. Add your profile image: frontend/assets/profile.jpg"
    echo "2. Add your resume: frontend/assets/SaiTejaReddy_Resume.pdf"
    echo "3. Add company logos in: frontend/assets/logos/"
    echo ""
    echo "🔒 Security reminder:"
    echo "- Change default passwords"
    echo "- Update API keys in production"
    echo "- Enable HTTPS with SSL certificate"
else
    echo -e "${RED}Deployment failed. Check logs with: docker-compose logs${NC}"
    exit 1
fi