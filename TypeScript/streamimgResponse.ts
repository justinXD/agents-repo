import { sumar, CurrencyConverter } from "../tools/TypeScript/AgentTools";
import { Agent, StructuredOutputError, AgentStreamEvent } from "@strands-agents/sdk";
import { z } from "zod";
// import { process } from "zod/v4/core";

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
  printer: false
});

// funcion para ver todo el event loop del agente
function processEvent(event: AgentStreamEvent): void {
  // Track agent loop lifecycle
  switch (event.type) {
    case 'beforeInvocationEvent':
      console.log('Agent loop initialized')
      break
    case 'beforeModelCallEvent':
      console.log('Agent loop cycle starting')
      break
    case 'afterModelCallEvent':
      console.log(`New message created: ${event.stopData?.message.role}`)
      break
    case 'beforeToolsEvent':
      console.log('About to execute tool!')
      break
    case 'afterToolsEvent':
      console.log('Finished executing tool!')
      break
    case 'afterInvocationEvent':
      console.log('Agent loop completed')
      break
  }

  // Track tool usage
  if (
    event.type === 'modelStreamUpdateEvent' &&
    event.event.type === 'modelContentBlockStartEvent' &&
    event.event.start?.type === 'toolUseStart'
  ) {
    console.log(`\nUsing tool: ${event.event.start.name}`)
  }

  // Show text snippets
  if (
    event.type === 'modelStreamUpdateEvent' &&
    event.event.type === 'modelContentBlockDeltaEvent' &&
    event.event.delta.type === 'textDelta'
  ) {
    process.stdout.write(event.event.delta.text)
  }
}

async function agentStreamingResponse(prompt: string) {
    try {
        const response = agent.stream(prompt);
        for await (const event of response) {
            processEvent(event)
        }
        // for await (const event of agent.stream(prompt)) {
        //   if (event.type === "textDeltaEvent") {
        //     process.stdout.write(event.data);
        //   } else if (event.type === "toolUseEvent") {
        //     console.log(`\n[usando tool: ${event.toolName}]`);
        //   } else if (event.type === "agentResultEvent") {
        //     const resumen = event.result.structuredOutput as z.infer<typeof resumenGastosSchema>;
        //     console.log("\n\n--- Resultado estructurado ---");
        //     resumen.gastos.forEach(g => console.log(`${g.descripcion}: ${g.montoEnMxn.toFixed(2)} MXN`));
        //     console.log(`Total: ${resumen.totalMxn.toFixed(2)} MXN`);
        //   }
        // }
    } catch (error) {
        if (error instanceof StructuredOutputError) {
            console.error("Error de salida estructurada:", error.message);
        } else {
            console.error("Error al invocar el agente:", error);
        }
    }
}

await agentStreamingResponse("Gasté 500 MXN en comida, 30 USD en transporte y 15.50 USD en café");