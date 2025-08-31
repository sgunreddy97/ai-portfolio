# AI Portfolio Project

An AI-powered personal portfolio website with an integrated chatbot.  
Built with a **Flask backend (Python 3.10)** and a **static frontend (HTML, CSS, JS)**, deployed on **Azure App Service** and **Azure Static Web Apps**.  
All secrets (API keys, admin credentials) are securely stored in **Azure Key Vault**.

---

## 🚀 Features

- **Interactive Chatbot**  
  - Built on Flask backend APIs.  
  - Supports text-based conversation and real-time responses.  
  - Backend URL configurable via `window.__API_BASE__`.

- **Secure Backend**  
  - Deployed to Azure App Service (Linux).  
  - Uses Gunicorn with multi-thread workers for scalability.  
  - Secrets managed via Azure Key Vault (never exposed in repo).

- **Frontend Portfolio**  
  - Responsive static site built with HTML, CSS, and vanilla JavaScript.  
  - Integrated chatbot widget.  
  - Deployed globally using Azure Static Web Apps.

- **Professional Deployment**  
  - CI/CD with GitHub Actions.  
  - Backend builds and deploys automatically to Azure.  
  - Frontend deploys to Azure Static Web Apps with preview builds for PRs.

---

## 🛠️ Tech Stack

**Frontend:**  
- HTML, CSS, JavaScript  

**Backend:**  
- Python 3.10 (Flask)  
- Gunicorn (production server)  

**Azure Services:**  
- App Service (Linux)  
- Static Web Apps  
- Key Vault (for secrets)  
- Application Settings with Key Vault references  

**Other:**  
- GitHub Actions for CI/CD  
- Bcrypt for secure admin password hashing  

---

## 🔧 Local Development

### Prerequisites
- Python 3.10  
- Node.js (optional, if extending frontend)  

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# or
source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
python server.py
Backend runs at: http://localhost:5000

Frontend Setup

Open frontend/main.html in your browser.
By default, it will point to http://localhost:5000 for API requests.

🌐 Deployment

Backend:

GitHub Actions → Deploys to Azure App Service.

Secrets pulled securely from Key Vault.

Frontend:

GitHub Actions → Deploys to Azure Static Web Apps.

Global CDN for fast access worldwide.