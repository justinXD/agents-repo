// Verifica la parte de TypeScript de la Fase 0.
// Uso (desde la carpeta con tu package.json): npx tsx scripts/verificar-entorno.ts
import { Agent } from "@strands-agents/sdk";

const modelId = process.env.MODEL_ID; // Define el modelo segun la disponibilidad que tengas aqui
if (!modelId) {
    console.error("❌ Define la variable de entorno MODEL_ID");
    process.exit(1);
}

try {
    const agent = new Agent({ model: modelId, printer: false });
    const result = await agent.invoke("Responde únicamente con la palabra: ok");
    const texto = result.lastMessage.content
        .map((b) => ("text" in b ? b.text : ""))
        .join("");
    console.log(
        `✅ TypeScript + Bedrock OK: el modelo respondió "${texto.trim().slice(0, 40)}"`,
    );
} catch (error) {
    console.error("❌ Falló la prueba de TypeScript:", error);
    process.exit(1);
}
