import { Agent, tool } from "@strands-agents/sdk";
import { z } from "zod";

const calculadora = tool({
  name: "calculadora",
  description: "Evalúa una expresión matemática simple, ej: '23 * 4 + 1'",
  inputSchema: z.object({
    expresion: z.string(),
  }),
  callback: async ({ expresion }) => {
    try {
      const resultado = Function(`"use strict"; return (${expresion})`)();
      return `El resultado es ${resultado}`;
    } catch (e) {
      return `Error al evaluar: ${e}`;
    }
  },
});

const agent = new Agent({
  model: "us.anthropic.claude-haiku-4-5-20251001-v1:0", // ajusta al model_id que tengas habilitado
  systemPrompt: "Eres un asistente que ayuda con cálculos matemáticos. Usa la herramienta calculadora cuando sea necesario.",
  tools: [calculadora],
});

const respuesta = await agent.invoke("¿Cuánto es 45 * 12 + 7?");
console.log(respuesta);