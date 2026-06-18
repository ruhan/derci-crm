release: bash -lc "if [ -n \"$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null)\" ]; then echo 'Aplicando migrations versionadas...'; npx prisma migrate deploy; else echo 'Sem migrations, usando db push...'; npx prisma db push --skip-generate --accept-data-loss; fi"
web: npm run start
