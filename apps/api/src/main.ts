import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { ConfigService } from "@nestjs/config";
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import path from "path";
import compression from "compression";
import { setupSwagger } from "./configs/swagger.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow("app.nodeEnv", { infer: true });
  const port = configService.get<number>("app.port", { infer: true }) ?? 3000;

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization",
    credentials: true,
  });

  app.use(cookieParser(), compression());
  app.useStaticAssets(
    configService.get<string>("UPLOAD_PATH") ||
      path.join(process.cwd(), "uploads"),
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
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  if (nodeEnv !== "production") {
    setupSwagger(app);
  }

  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
