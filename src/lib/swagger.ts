import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Learning Journal API",
        version: "1.0.0",
        description: "Learning JournalのAPI仕様書",
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          description: "APIサーバー",
        },
      ],
    },
  });
  return spec;
};
