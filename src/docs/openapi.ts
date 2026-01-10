import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Tudruj Home Assistant API",
            version: "1.0.0",
            description: `
Eksperymentalny backend do zarządzania domem 🐶.
      `,
        },
        servers: [
            {
                url: "http://192.168.1.46:3000",
                description: "Home server (LAN)",
            },
            {
                url: "http://localhost:3000",
                description: "Local dev",
            },
        ],
    },
    apis: [
        "src/modules/**/*.ts",
    ],
});
