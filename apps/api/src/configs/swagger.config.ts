import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Open Project API")
    .setDescription("Made with ❤️ by @torikkyun")
    .setVersion("0.0.1")
    .addBearerAuth({
      name: "Authorization",
      bearerFormat: "Bearer",
      scheme: "bearer",
      type: "http",
      in: "Header",
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/swagger", app, document, {
    customSiteTitle: "Open Project API",
    swaggerOptions: {
      persistAuthorization: true,
    },
    //   plugins: [
    //     (...args: any[]) => (window as any).HierarchicalTagsPlugin(...args),
    //     // This is added by nestjs by default and would be overridden if not included
    //     (...args: any[]) => (window as any).SwaggerUIBundle.plugins.DownloadUrl(...args),
    //   ],
    //   hierarchicalTagSeparator: "/", // This must be a string, as RegExp will not survive being json encoded
    // },
    // customJs: ["https://unpkg.com/swagger-ui-plugin-hierarchical-tags"],
  });
}
