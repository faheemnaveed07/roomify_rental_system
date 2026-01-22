# Roomify Rental System

A MERN stack rental property and roommate matching platform for Pakistan.

## 🚀 Quick Start

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Install frontend dependencies
cd ../frontend && npm install

# 3. Start development servers
# Terminal 1 (Backend):
cd backend && npm run dev

# Terminal 2 (Frontend):
cd frontend && npm run dev
```

## 📁 Project Structure

```
roomify_rental_system/
├── backend/                    # Express + TypeScript API
│   ├── src/
│   │   ├── config/            # Database, AWS, Cloudinary configs
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, RBAC, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Logger, email, validators
│   └── package.json
│
└── frontend/                   # React + Vite + TypeScript
    ├── src/
    │   ├── components/
    │   │   ├── atoms/         # Button, Input, Badge, Checkbox
    │   │   ├── molecules/     # PropertyCard, SearchBar, FilterChip
    │   │   ├── organisms/     # Complex components
    │   │   └── templates/     # Page layouts
    │   ├── pages/             # Route pages
    │   ├── hooks/             # Custom React hooks
    │   ├── services/          # API clients
    │   ├── store/             # Zustand state management
    │   └── styles/theme/      # Design system tokens
    └── package.json
```

## 🔧 Configuration

### Backend (.env)
```bash
cp backend/.env.example backend/.env
# Edit with your MongoDB, JWT, Cloudinary, AWS, and SMTP credentials
```

### Frontend (.env)
```bash
cp frontend/.env.example frontend/.env
# Edit with your API URL configuration
```

## 🎨 Design System

- **Primary Color:** #2563EB (Blue)
- **Secondary Color:** #F59E0B (Amber)
- **Typography:** Inter (body) + Playfair Display (headings)
- **Spacing:** 8pt grid system

## 🔐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/properties` | GET | Search properties |
| `/api/properties` | POST | Create property (landlord) |
| `/api/admin/dashboard/stats` | GET | Admin statistics |

## 🏗️ Architecture

- **Backend:** Clean Architecture (controllers → services → models)
- **Frontend:** Atomic Design (atoms → molecules → organisms → templates)
- **State Management:** Zustand
- **Styling:** Tailwind CSS + CSS Variables

## 📝 Features

- Property listing (shared rooms & full houses)
- Roommate compatibility matching (0-100 score)
- CNIC verification workflow
- Real-time notifications (Socket.io)
- Geo-spatial property search
- Role-based access control (Tenant/Landlord/Admin)

## 📄 License

MIT
