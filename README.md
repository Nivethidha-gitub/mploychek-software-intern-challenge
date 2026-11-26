# Access Ledger: Angular + Node.js + MongoDB

Role-based user portal. General Users see their own details and records; Admins see everything and manage users.

## Run
1. Backend (http://localhost:3000)
   cd backend && npm install && npm run dev
   - Default storage is a local JSON file (data/db.json), so it runs with nothing else installed.
   - MongoDB: set MONGO_URI (see .env.example) before starting.
   - AWS DynamoDB: set STORAGE=dynamodb (and AWS credentials/region, or DYNAMO_ENDPOINT for DynamoDB Local).
   - Sample users and records are seeded automatically on first start. Delete backend/data/db.json to reseed the JSON store.
     PowerShell: $env:MONGO_URI="mongodb://127.0.0.1:27017/accessledger"; npm run dev
2. Frontend (http://localhost:4200)
   cd frontend && npm install && npm start
   Needs Node 18.19+. Angular 17 with NgModules.

## Demo logins
| Role | User ID | Password |
|---|---|---|
| Admin | admin001 | admin123 |
| General User | user001 | user123 |
| General User (inactive, login blocked) | user003 | user123 |

## Architecture
backend/src
  server.ts  Express routes, JWT auth, role checks, ?delay=ms on every route
  repo.ts    Storage interface with JsonRepo, MongoRepo and DynamoRepo (AWS)
  seed.ts    Sample users and records (passwords bcrypt-hashed)
frontend/src/app
  core/      services (session, auth, user, record, latency, activity), guards, HTTP interceptor
  features/  login, dashboard, user-management (lazy-loaded modules)
  shared/    models, status badge, API activity panel

## API
POST /api/auth/login   { userId, password, role } -> { token, user }
GET  /api/users/me     current user
GET  /api/records      own records (General User) or all (Admin)
GET/POST /api/users, PUT/DELETE /api/users/:id   Admin only
Append ?delay=5000 to any call to simulate a slow API (max 10000 ms).

## Access levels
Users have clearance from their role: General User = level 1 (Public only), Admin = level 3 (Full).
Each record is classified Public (1), Internal (2) or Restricted (3). The records table shows the classification and
"Can open" / "Restricted" per row. The server masks the description of records above the caller's clearance.

## Async demo
Move the "Simulated API delay" slider in the header, then open the dashboard. Account, user summary and records
are three independent calls; each panel shows its own spinner and fills in when its call returns.
The "API activity" panel lists every call with its live state and response time.

## Security
Permissions are enforced on the server (JWT + role middleware), not only by hiding buttons.
Passwords are bcrypt-hashed. Admins cannot delete, deactivate or demote themselves. Set JWT_SECRET in production.

## AWS path
Frontend: ng build, host on S3 + CloudFront. Backend: Express on Elastic Beanstalk, or Lambda behind API Gateway.
Database: DynamoDB (built in, STORAGE=dynamodb) or MongoDB Atlas.
