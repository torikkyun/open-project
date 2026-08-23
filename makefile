docker-dev:
	docker-compose -f ./docker/compose.dev.yml up -d --build

prisma-studio:
	pnpm -F=api exec pnpm dlx prisma studio

prisma-dev:
	pnpm -F=api exec pnpm dlx prisma migrate dev && pnpm -F=api exec pnpm dlx prisma generate

seed-dev:
	pnpm -F=api exec pnpm dlx prisma db seed -- --environment development

be-dev:
	pnpm -F=api exec pnpm dev

fe-dev:
	pnpm -F=web exec pnpm dev
