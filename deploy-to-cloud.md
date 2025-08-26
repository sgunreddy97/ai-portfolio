# 🌐 Cloud Deployment Guide

## Option 1: Deploy to AWS EC2

### Prerequisites
- AWS Account
- EC2 instance (t2.medium or larger recommended)
- Domain name (optional)

### Steps

1. **Launch EC2 Instance**
```bash
# Use Amazon Linux 2 or Ubuntu 20.04 LTS
# Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API)