import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Tudruj Home Assistant API",
            version: "1.0.0",
            description: `
Eksperymentalny backend do zarządzania feature’ami, komentarzami
i narratorami (Henryk, Bluzgator i spółka 🐶).
      `,
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: [
        "src/modules/**/*.ts",
    ],
});
