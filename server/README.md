Server Setup (MySQL)

1. Create a MySQL database, e.g.:
   CREATE DATABASE kidn eyrf;
   (use your favorite MySQL client)

2. Copy .env.example to .env and update:
   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

3. Install and run:
   npm install
   npm run dev

The server will auto-create `users` and `records` tables if missing.
