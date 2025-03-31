"use client";

import { useEffect } from "react";
import SwaggerUI from "swagger-ui-dist/swagger-ui-bundle";
import "swagger-ui-dist/swagger-ui.css";

export default function ApiDocs() {
  useEffect(() => {
    SwaggerUI({
      dom_id: "#swagger-ui",
      url: "/api/docs",
    });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      <div id="swagger-ui" />
    </div>
  );
}
