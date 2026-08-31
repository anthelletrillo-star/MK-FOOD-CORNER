#!/opt/render/project/src/.render/bin/sh
# Install dependencies
npm install
# Generate Prisma Client
npx prisma generate
# Sync database schema with Prisma schema
npx prisma db push
