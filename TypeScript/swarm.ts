import { Agent, Swarm, tool } from "@strands-agents/sdk";
import { sumar, multiplicar, CurrencyConverter, invokeSwarmWithStream } from "../tools/TypeScript/AgentTools";
import { MODEL, PROMPT_COSTO_ARQUITECTURA } from "../tools/TypeScript/constantes";
import { z } from "zod";

const TARIFAS_USD = {
    api_gateway_millon_peticiones: 1.0,
    lambda_millon_invocaciones: 0.2,
    dynamodb_millon_lecturas: 0.25,
    s3_gb_mes: 0.023,
} as const;

const tarifaSimulada = tool({
    name: "tarifa_simulada",
    description: "Devuelve la tarifa simulada en USD de un servicio (no son precios reales).",
    inputSchema: z.object({ servicio: z.enum(Object.keys(TARIFAS_USD) as [keyof typeof TARIFAS_USD, ...(keyof typeof TARIFAS_USD)[]]) }),
    callback: ({ servicio }) => `${servicio}: ${TARIFAS_USD[servicio]} USD`,
});

const arquitecto = new Agent({
    id: "arquitecto", model: MODEL, printer: false,
    description: "Identifica los servicios AWS y los volúmenes mensuales de una solicitud.",
    systemPrompt: "Extrae de la solicitud cada servicio con su volumen mensual. Luego pasa el trabajo a analista_costos con la lista completa y el pedido original (moneda final incluida).",
});
const analista = new Agent({
    id: "analista_costos", model: MODEL, printer: false,
    description: "Calcula costos por servicio con tarifas y convierte monedas.",
    tools: [tarifaSimulada, CurrencyConverter, sumar, multiplicar],
    systemPrompt: "Para cada servicio consulta su tarifa, calcula el costo mensual, suma el total en USD y conviértelo a la moneda pedida. Nunca inventes tarifas. Al terminar, pasa el desglose completo a revisor.",
});
const revisor = new Agent({
    id: "revisor", model: MODEL, printer: false,
    description: "Valida cálculos y entrega el reporte final.",
    systemPrompt: "Verifica que todos los servicios pedidos estén cubiertos y que las cuentas cuadren. Si hay un error concreto, pasa el trabajo a analista_costos explicando el error. Si todo es correcto, responde tú con el reporte final y no hagas handoff.",
});

const swarm = new Swarm({ nodes: [arquitecto, analista, revisor], start: "arquitecto", maxSteps: 8 });

// try {
//     const resultado = await swarm.invoke(PROMPT_COSTO_ARQUITECTURA);
//     console.log("Status: ", resultado.status)
//     console.log("Resultado:", resultado.results);
//     console.log("Node results: ", resultado.results.map((r) => r.nodeId).join(' -> '))

// } catch (error) {
//     console.error("Error en la ejecución del swarm:", error instanceof Error ? error.message : String(error));
// }

await invokeSwarmWithStream(swarm, PROMPT_COSTO_ARQUITECTURA);