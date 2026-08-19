## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

organization-service/
│
├── src/
│   │
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── franchise/
│   │   ├── franchise.controller.ts
│   │   ├── franchise.service.ts
│   │   └── dto/
│   │
│   ├── region/
│   │   ├── region.controller.ts
│   │   ├── region.service.ts
│   │   └── dto/
│   │
│   ├── restaurant/
│   │   ├── restaurant.controller.ts
│   │   ├── restaurant.service.ts
│   │   └── dto/
│   │
│   ├── system-user/
│   │   ├── system-user.controller.ts
│   │   ├── system-user.service.ts
│   │   └── dto/
│   │
│   ├── terminal/
│   │   ├── terminal.controller.ts
│   │   ├── terminal.service.ts
│   │   └── dto/
│   │
│   ├── auth/
│   │
│   ├── authorization/
│   │
│   └── common/
│       ├── guards/
│       ├── decorators/
│       ├── filters/
│       └── interceptors/
│
├── prisma/
│   └── schema.prisma
│
├── .env
└── package.json
