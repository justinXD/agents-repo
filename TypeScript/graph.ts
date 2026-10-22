import { Agent, Graph, tool } from "@strands-agents/sdk"; // si EdgeHandler no se exporta ahí, dime el error
import { type EdgeHandler, AgentNode } from "@strands-agents/sdk/multiagent";
import { sumar, multiplicar, CurrencyConverter, invokeSwarmWithStream, invokeGraphWithStream } from "../tools/TypeScript/AgentTools";
import { MODEL, PROMPT_COSTO_ARQUITECTURA, PROMPT_COSTO_ARQUITECTURA_CON_CLOUDWATCH } from "../tools/TypeScript/constantes";
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

const analista = new Agent({
    id: "analisis", model: MODEL, printer: false,
    tools: [tarifaSimulada, CurrencyConverter, sumar, multiplicar],
    systemPrompt: `Extrae los servicios y volúmenes de la solicitud, consulta cada tarifa con tarifa_simulada,
calcula el costo mensual por servicio, suma el total en USD y conviértelo a la moneda pedida.
Reglas: nunca estimes una tarifa. Si tarifa_simulada devuelve error para un servicio, escribe 'SIN TARIFA: <servicio>' y no lo incluyas en el total.
Si recibes comentarios del revisor, corrige exactamente lo que señala y entrega el desglose completo otra vez.`,
});
const revisor = new Agent({
    id: "revision", model: MODEL, printer: false,
    systemPrompt: `Revisa el desglose: (1) cada servicio pedido está cubierto o marcado 'SIN TARIFA', (2) las cuentas cuadran, (3) ninguna tarifa fue estimada.
Termina SIEMPRE con una sola etiqueta exacta: [[APROBADO]] o [[RECHAZADO]]. Si rechazas, explica antes el error concreto.`,
});
const redactor = new Agent({
    id: "reporte", model: MODEL, printer: false,
    systemPrompt: "Convierte el desglose aprobado en un reporte breve para un cliente: servicios, total y notas (menciona cualquier servicio sin tarifa).",
});

const textoDe = (state: Parameters<EdgeHandler>[0], nodeId: string): string =>
    (state.node(nodeId)?.content ?? []).map((b) => ("text" in b ? b.text : "")).join("");

const aprobado: EdgeHandler = (state) => textoDe(state, "revision").includes("[[APROBADO]]");
const rechazado: EdgeHandler = (state) => textoDe(state, "revision").includes("[[RECHAZADO]]");

const graph = new Graph({
    nodes: [new AgentNode({ agent: analista, preserveContext: true }), new AgentNode({ agent: revisor, preserveContext: true }), new AgentNode({ agent: redactor, preserveContext: true })  ],
    edges: [
        ["analisis", "revision"],
        { source: "revision", target: "analisis", handler: rechazado },
        { source: "revision", target: "reporte", handler: aprobado },
    ],
    sources: ["analisis"],
    maxSteps: 8,
});

// try {
//     const result = await graph.invoke("API de pedidos: 2 millones de peticiones al mes en API Gateway, 3 millones de invocaciones Lambda, 5 millones de lecturas DynamoDB y 50 GB en S3. ¿Cuánto cuesta al mes en MXN?");
//     console.log("Status:", result.status);
//     console.log("Orden:", result.results.map((r) => r.nodeId).join(" -> "));
//     console.log("Salida:", result.content.find((b) => b.type === "textBlock")?.text);
// } catch (error) {
//     console.error("El graph falló (¿excedió maxSteps?):", error);
// }

await invokeGraphWithStream(graph, PROMPT_COSTO_ARQUITECTURA);