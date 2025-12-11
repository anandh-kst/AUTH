export const setupSwaggerVercel = (app) => {
  if (process.env.VERCEL) {
    console.log("Running on Vercel → Swagger disabled inside Express");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.log("Swagger disabled in production");
    return;
  }

  const swaggerPath = path.resolve("./swagger/swagger.yaml");
  const swaggerDocument = YAML.load(swaggerPath);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  console.log("📄 Swagger Docs available at /api-docs");
};
