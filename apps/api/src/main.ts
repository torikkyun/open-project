import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
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

  app.enableCors({
    origin: ["*"],
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
  app.useGlobalInterceptors(new TransformInterceptor());

  if (nodeEnv !== "production") {
    setupSwagger(app);
  }

  await app.listen(port);
}
bootstrap();
