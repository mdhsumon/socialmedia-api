# Available APIs:
### Each request must have access token in request body after login.

**Create new user**
POST: /signup

**User login by email and password**
POST: /login

**Get all user**
GET: /users

**Get user by id/username**
GET: /user/{id/username}

**Read/Edit/Delete user**
GET: /user/{id}
PUT: /user/{id}
DELETE: /user/{id}

**Create new post**
POST: /post/create

**Read/Edit/Delete post**
GET: /post/{id}
PUT: /post/{id}
DELETE: /post/{id}

**Home page posts**
GET: /{username}/posts

**Read/Edit/ user profile**
GET: /{username}/profile
PUT: /{username}/profile

**Get user friend requests**
GET: /{username}/requests

**Friends activity**
