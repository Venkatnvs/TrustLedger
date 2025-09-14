# TrustLedger - Transparent Fund Flow Management Platform

A comprehensive web platform designed to provide complete transparency in fund flow management for institutions, enabling stakeholders to track, monitor, and analyze financial transactions with full accountability.

## 🚀 Live Demo

- **Frontend**: [https://trust-ledger.vercel.app](https://trust-ledger.vercel.app)
- **Backend API**: [https://trustledger-vvwh.onrender.com](https://trustledger-vvwh.onrender.com)
- **API Documentation (Swagger)**: [https://trustledger-vvwh.onrender.com](https://trustledger-vvwh.onrender.com)
- **Admin Panel**: [https://trustledger-vvwh.onrender.com/admin](https://trustledger-vvwh.onrender.com/admin)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** with refresh token support
- **Role-based Access Control** (Admin, Manager, User)
- **Secure Login/Registration** with form validation
- **Protected Routes** for sensitive operations

### 💰 Fund Flow Management
- **Real-time Fund Tracking** from sources to projects
- **Multi-level Fund Allocation** (Source → Department → Project)
- **Transaction Verification** and approval workflows
- **Fund Flow Visualization** with interactive diagrams
- **Anomaly Detection** using AI-powered analysis

### 📊 Project Management
- **Project Lifecycle Tracking** (Planning → Active → Completed)
- **Budget Management** with version control
- **Spending Records** with category classification
- **Progress Monitoring** with completion percentages
- **Timeline Tracking** with milestone management

### 📈 Analytics & Reporting
- **Comprehensive Dashboard** with key metrics
- **Budget Analytics** with spending trends
- **Impact Visualization** with beneficiary tracking
- **Trust Indicators** scoring system
- **Custom Reports** generation

### 📄 Document Management
- **Document Upload** with drag-and-drop support
- **File Organization** by project/department
- **Document Verification** and approval
- **Version Control** for document updates
- **Search & Filter** capabilities

### 🤖 AI-Powered Features
- **Intelligent Chatbot** for user assistance
- **Anomaly Detection** in fund flows
- **Automated Insights** and recommendations
- **Smart Search** with natural language processing

### 👥 Community Features
- **Community Feedback** system
- **Public Project Visibility** with transparency
- **Feedback Management** with priority levels
- **Response Tracking** and resolution

### 🔍 Advanced Search & Filtering
- **Multi-criteria Search** across all entities
- **Advanced Filters** for complex queries
- **Real-time Search** with instant results
- **Saved Search** configurations

## 🛠 Tech Stack

### Frontend
- **React** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Query** - Data fetching and caching
- **Wouter** - Lightweight routing
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Django** - Python web framework
- **Django REST Framework** - API development
- **JWT Authentication** - Secure token-based auth
- **CORS Headers** - Cross-origin resource sharing
- **Swagger/OpenAPI** - API documentation
- **Django Filters** - Advanced filtering

### AI & ML
- **Google Gemini AI** - Natural language processing
- **LangChain** - AI application framework
- **Custom AI Services** - Anomaly detection

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Vite** - Development server
- **Git** - Version control

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Frontend Setup
```bash
cd Trust-Ledger
npm install
npm run dev
```

### Backend Setup
```bash
cd TrustLedger_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
GEMINI_API_KEY=your-gemini-api-key
```

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
- **Swagger UI**: [https://trustledger-vvwh.onrender.com](https://trustledger-vvwh.onrender.com)
- **ReDoc**: [https://trustledger-vvwh.onrender.com/redoc](https://trustledger-vvwh.onrender.com/redoc)
- **JSON Schema**: [https://trustledger-vvwh.onrender.com/swagger.json](https://trustledger-vvwh.onrender.com/swagger.json)

### Key API Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/token/refresh/` - Token refresh

#### Fund Flows
- `GET /api/fund-flows/` - List all fund flows
- `POST /api/fund-flows/` - Create new fund flow
- `GET /api/fund-flows/{id}/` - Get specific fund flow

#### Projects
- `GET /api/core/projects/` - List all projects
- `POST /api/core/projects/` - Create new project
- `GET /api/core/projects/{id}/` - Get specific project

#### Analytics
- `GET /api/analytics/dashboard/` - Dashboard metrics
- `GET /api/analytics/budget/` - Budget analytics
- `GET /api/analytics/impact/` - Impact metrics

### Admin Panel
Access the Django admin interface at [https://trustledger-vvwh.onrender.com/admin](https://trustledger-vvwh.onrender.com/admin) to:
- Manage users and permissions
- View and edit all data models
- Monitor system activity
- Configure application settings

## 📁 Project Structure

```
TrustLedger/
├── Trust-Ledger/                 # Frontend React Application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities and API
│   │   └── utils/              # Helper functions
│   └── public/                 # Static assets
│
├── TrustLedger_backend/         # Backend Django Application
│   ├── accounts/               # User management
│   ├── core/                   # Core models and services
│   ├── fund_flows/            # Fund flow management
│   ├── documents/             # Document handling
│   ├── analytics/             # Analytics and reporting
│   └── ai_services/           # AI-powered features
│
└── README.md                   # This file
```

## 🎯 Key Features Overview

### 1. **Transparent Fund Tracking**
- Complete visibility into fund allocation and spending
- Real-time updates on financial transactions
- Multi-level approval workflows

### 2. **Project Management**
- End-to-end project lifecycle management
- Budget tracking with version control
- Progress monitoring and reporting

### 3. **AI-Powered Insights**
- Intelligent anomaly detection
- Automated recommendations
- Natural language chatbot assistance

### 4. **Community Engagement**
- Public project visibility
- Community feedback system
- Transparent communication channels

### 5. **Advanced Analytics**
- Comprehensive reporting dashboard
- Trust indicator scoring
- Impact measurement and visualization

## 🔧 Development

### Running Tests
```bash
# Frontend tests
npm run test

# Backend tests
python manage.py test
```

### Building for Production
```bash
# Frontend build
npm run build

# Backend deployment
python manage.py collectstatic
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Email**: venkatnvs2005@gmail.com
- **Project Link**: [https://github.com/Venkatnvs/TrustLedger](https://github.com/Venkatnvs/TrustLedger)

---

**TrustLedger** - Building trust through transparency in fund management.