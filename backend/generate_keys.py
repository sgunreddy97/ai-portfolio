#!/usr/bin/env python3
"""
Generate secure keys and passwords for the portfolio backend
Run this first to set up your admin credentials
"""

import bcrypt
import secrets
import string
from cryptography.fernet import Fernet
import os

def generate_secret_key(length=32):
    """Generate a secure secret key"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_password_hash(password):
    """Generate bcrypt hash for password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_encryption_key():
    """Generate Fernet encryption key"""
    return Fernet.generate_key().decode('utf-8')

def main():
    print("="*60)
    print("🔐 PORTFOLIO SECURITY SETUP")
    print("="*60)
    
    # Get admin password
    while True:
        password = input("\nEnter admin password (min 8 chars): ")
        if len(password) >= 8:
            confirm = input("Confirm password: ")
            if password == confirm:
                break
            else:
                print("❌ Passwords don't match. Try again.")
        else:
            print("❌ Password too short. Min 8 characters.")
    
    # Generate keys
    print("\n🔄 Generating secure keys...")
    
    secret_key = generate_secret_key()
    jwt_secret = generate_secret_key(64)
    password_hash = generate_password_hash(password)
    encryption_key = generate_encryption_key()
    
    # Update .env file
    env_path = '.env'
    
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        # Update existing values
        for i, line in enumerate(lines):
            if line.startswith('SECRET_KEY='):
                lines[i] = f'SECRET_KEY={secret_key}\n'
            elif line.startswith('ADMIN_PASSWORD_HASH='):
                lines[i] = f'ADMIN_PASSWORD_HASH={password_hash}\n'
            elif line.startswith('JWT_SECRET_KEY='):
                lines[i] = f'JWT_SECRET_KEY={jwt_secret}\n'
            elif line.startswith('ENCRYPTION_KEY='):
                lines[i] = f'ENCRYPTION_KEY={encryption_key}\n'
        
        with open(env_path, 'w') as f:
            f.writelines(lines)
    else:
        # Create new .env
        with open(env_path, 'w') as f:
            f.write(f"""# Generated Security Keys
SECRET_KEY={secret_key}
ADMIN_PASSWORD_HASH={password_hash}
JWT_SECRET_KEY={jwt_secret}
ENCRYPTION_KEY={encryption_key}

# Add your other keys here
TOGETHER_API_KEY=15378d4e0f85d5546431b80cb8d8dacd9a080e4dc501d7d95070f74fbf02554a
DATABASE_PATH=portfolio.db
VECTOR_DB_PATH=vectors.db
""")
    
    print("\n✅ Security setup complete!")
    print("\n📋 Generated Keys:")
    print(f"Secret Key: {secret_key[:20]}...")
    print(f"JWT Secret: {jwt_secret[:20]}...")
    print(f"Password Hash: {password_hash[:20]}...")
    print(f"Encryption Key: {encryption_key[:20]}...")
    
    print("\n⚠️  IMPORTANT:")
    print("1. Keep your .env file secret")
    print("2. Never commit it to Git")
    print("3. Your admin password is NOT stored, only its hash")
    print(f"4. Login with password: {password}")
    print("\n✨ You're all set! Run server.py to start.")

if __name__ == "__main__":
    main()