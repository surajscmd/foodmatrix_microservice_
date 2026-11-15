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

## Password reset email

Set `PASSWORD_RESET_WEBHOOK_URL` and `PASSWORD_RESET_WEBHOOK_TOKEN` in the Organization Service environment. The service makes an HTTPS POST with a bearer token and a JSON body containing `email` and `resetUrl`. The receiver must send the email and return a 2xx status when accepted. Treat reset links as secrets and exclude them from webhook logs.

Set `BETTER_AUTH_URL` to the public auth host that serves `/api/auth`, and include the frontend origin in `BETTER_AUTH_TRUSTED_ORIGINS`. The login screen requests the email and provides the page to set a new password. Requests are disabled until both webhook settings are present.

Run the Organization Service tests with `npm test`.

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
