import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

export const setupSwagger = (app) => {
  if (process.env.NODE_ENV === "production") {
    console.log("Swagger disabled in production");
    return;
  }

  const swaggerPath = path.resolve("./swagger/swagger.yaml");
  const swaggerDocument = YAML.load(swaggerPath);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  console.log("📄 Swagger Docs available at /api-docs");
};
