import YAML from "yamljs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.resolve("swagger/swagger.yaml");
  const spec = YAML.load(filePath);

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        spec: ${JSON.stringify(spec)},
        dom_id: '#swagger'
      });
    </script>
  </body>
</html>
`;

  res.status(200).setHeader("Content-Type", "text/html").send(html);
}
