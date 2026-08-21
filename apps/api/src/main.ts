import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as cookieParser from "cookie-parser";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as path from "path";
import compression from "compression";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: ["*"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization",
    credentials: true,
  });

  app.use(cookieParser(), compression());
  const configService = app.get(ConfigService);
  app.useStaticAssets(
    configService.get<string>("UPLOAD_PATH") || path.join(process.cwd(), "uploads"),
    {
      prefix: "/uploads",
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle("Open Project API")
    .setDescription("Made with ❤️ by @torikkyun")
    .setVersion("0.1")
    .addBearerAuth({
      name: "Authorization",
      bearerFormat: "Bearer",
      scheme: "bearer",
      type: "http",
      in: "Header",
    })
    .build();

  SwaggerModule.setup("api/swagger", app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
