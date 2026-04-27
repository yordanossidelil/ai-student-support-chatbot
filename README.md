# AI Student Support Chatbot

A full-stack AI chatbot for university student support — React + Node.js + MongoDB + OpenAI.

## Project Structure

```
ai-student-support-chatbot/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/authController.js
│   │   ├── controllers/chatController.js
│   │   ├── middleware/auth.js
│   │   ├── models/User.js
│   │   ├── models/Chat.js
│   │   ├── routes/auth.js
│   │   └── routes/chat.js
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── context/AuthContext.js
        ├── pages/Login.js
        ├── pages/Register.js
        ├── pages/Chat.js
        ├── App.js
        └── index.js
```

## Setup

### Backend
```bash
cd backend
# Add your OpenAI API key to .env
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables (backend/.env)

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
OPENAI_API_KEY=your_openai_key   # optional — fallback responses work without it
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register user |
| POST | /auth/login | Login user |
| POST | /chat/send-message | Send message & get AI response |
| GET | /chat/history | Get all chat sessions |
| GET | /chat/:id | Get single chat |
| DELETE | /chat/:id | Delete chat |

## Features

- JWT authentication (register/login)
- Persistent chat history per user in MongoDB
- OpenAI GPT-3.5 integration with smart fallback responses
- Sidebar with previous chat sessions
- Dark themed responsive UI
- Suggestion prompts on empty chat
