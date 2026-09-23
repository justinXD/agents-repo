import { sumar, CurrencyConverter } from "../tools/TypeScript/AgentTools";
import { Agent, StructuredOutputError } from "@strands-agents/sdk";
import { z } from "zod";

const gastoSchema = z.object({
  descripcion: z.string(),
  montoOriginal: z.number(),
  monedaOriginal: z.string(),
  montoEnMxn: z.number().describe("Monto convertido a MXN").refine((v) => v > 0, { message: "montoEnMxn debe ser mayor a cero" }),
});

const resumenGastosSchema = z.object({
  gastos: z.array(gastoSchema),
  totalMxn: z.number().describe("Suma de todos los gastos convertidos a MXN"),
});

const agent = new Agent({
  model: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
  systemPrompt: "Eres un asistente de finanzas personales. Usa currency_converter para normalizar cada gasto a MXN y Sumar_tool para hacer sumas",
  tools: [CurrencyConverter, sumar],
  structuredOutputSchema: resumenGastosSchema,
});

async function invokeAgent() {
    try {
        const resultado = await agent.invoke("Inicié el dia con -500 MXN en el banco, estos -500 MXN gasté en comida, despues gaste -30 USD en transporte y por ultimo otros -15.50 USD en café");
        const resumen = resultado.structuredOutput as z.infer<typeof resumenGastosSchema>;
        resumen.gastos.forEach(g => console.log(`${g.descripcion}: ${g.montoOriginal} ${g.monedaOriginal} = ${g.montoEnMxn.toFixed(2)} MXN`));
        console.log(`Total: ${resumen.totalMxn.toFixed(2)} MXN`);
        console.log("Respuesta completa del agente:", resultado);
        resultado.traces?.forEach((agentTrace, index) => {
            console.log(`children on trace ${index+1}: ${agentTrace.children?.map(child => child.name).join(", ")}`);
            console.log(`metadata on trace ${index+1}: ${agentTrace.metadata ? JSON.stringify(agentTrace.metadata) : "No metadata"}`);
        });
    } catch (error) {
        if (error instanceof StructuredOutputError) {
            console.error("Error de salida estructurada:", error.message);
        } else {
            console.error("Error al invocar el agente:", error);
        }
    }
}

await invokeAgent();