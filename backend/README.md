# SilentMode Backend API

## Setup

Configure environment variables in `.env`:

```text
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret_here"
```

Initialize database:

```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

Start server:

```bash
npm run dev
# or
npx ts-node src/index.ts
```

Server runs on `http://localhost:3000`

## API Endpoints

### 🔐 Authentication

**Register**

`POST /api/auth/register`

Content-Type: `application/json`

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "mypassword123"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Login**

`POST /api/auth/login`

Content-Type: `application/json`

```json
{
  "email": "john@example.com",
  "password": "mypassword123"
}
```

Response: Same as register

**Get Profile**

`GET /api/auth/profile`

Authorization: `Bearer {token}`

Response:

```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2026-02-12T08:32:29.335Z",
  "superUpvoteUsedToday": false,
  "lastSuperUpvoteDate": null,
  "contentCount": 5
}
```

### 📝 Content Management

**List Contents**

`GET /api/contents`
`GET /api/contents?hashtag=dev`

Query Parameters:
- `hashtag` (optional): Filter by hashtag (without # symbol)

Response:

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "contentType": "text",
    "title": "Post Title",
    "description": "Post description",
    "mainHashtag": "#dev",
    "mediaUrl": null,
    "score": 12.5,
    "viewCount": 150,
    "createdAt": "2026-02-12T08:36:09.345Z",
    "isArchived": false
  }
]
```

Note: Archived content (score < -10) is excluded from list

**Get Single Content**

`GET /api/contents/:id`

Response: Single content object (increments viewCount)

**Create Content**

`POST /api/contents`

Authorization: `Bearer {token}`
Content-Type: `application/json`

```json
{
  "title": "My Post Title",
  "description": "Post description with **markdown** support",
  "mainHashtag": "#technology",
  "contentType": "text"
}
```

Response: Created content object

**Update Content**

`PUT /api/contents/:id`

Authorization: `Bearer {token}`
Content-Type: `application/json`

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "mainHashtag": "#updated"
}
```

Note: Only owner can update

**Delete Content**

`DELETE /api/contents/:id`

Authorization: `Bearer {token}`

Response:

```json
{ "message": "Content deleted successfully" }
```

### 👍 Voting System

**Vote on Content**

`POST /api/votes`

Authorization: `Bearer {token}`
Content-Type: `application/json`

```json
{
  "contentId": "uuid",
  "voteType": "upvote"
}
```

Vote Types:
- `upvote`: +1 point
- `downvote`: -0.33 points (1 downvote cancels 1/3 of an upvote)
- `super_upvote`: +10 points (once per day per user)

Response:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "contentId": "uuid",
  "voteType": "upvote",
  "createdAt": "2026-02-12T09:28:56.909Z"
}
```

Note: Score is automatically recalculated after each vote

### Score Algorithm

Score = (Upvotes + SuperUpvotes×10 - Downvotes/3) + (ViewCount/100 × 0.1)

Example:
5 upvotes + 1 super upvote + 100 views = 5 + 10 + 0.1 = 15.1
2 upvotes + 3 downvotes = 2 - 1 = 1.0

### Shadow Archiving

Content with score < -10 is automatically:
- ✅ Hidden from feed (GET /api/contents)
- ✅ Still accessible via direct link (GET /api/contents/:id)
- ✅ Can recover if score improves (score ≥ 0)

### Error Responses

```json
{ "error": "Error message" }
```

Common Status Codes:
- 400 - Bad Request (validation error)
- 401 - Unauthorized (no token or invalid token)
- 403 - Forbidden (not owner)
- 404 - Not Found
- 500 - Internal Server Error

### Testing

Test endpoint (development only):

`POST /api/contents/:id/set-score`

Content-Type: `application/json`

```json
{ "score": -15 }
```

Sets content score directly for testing shadow archiving.

## Database Models

**User**
- id (UUID, PK)
- username (unique)
- email (unique)
- passwordHash
- superUpvoteUsedToday (boolean)
- lastSuperUpvoteDate (datetime)
- createdAt

**Content**
- id (UUID, PK)
- userId (FK → User)
- contentType (text/image/video)
- title
- description
- mainHashtag
- mediaUrl (nullable)
- score (float)
- viewCount (int)
- isArchived (boolean)
- createdAt

**Vote**
- id (UUID, PK)
- userId (FK → User)
- contentId (FK → Content)
- voteType (upvote/downvote/super_upvote)
- createdAt
- Unique constraint: (userId, contentId)

## Security

- JWT tokens expire in 7 days
- Passwords hashed with bcrypt (10 rounds)
- Protected routes require Authorization: Bearer {token} header
- Content update/delete restricted to owner

## License
MIT
