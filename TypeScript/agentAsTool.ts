import { Agent } from "@strands-agents/sdk";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createMcpClient, CurrencyConverter, sumar, multiplicar } from "../tools/TypeScript/AgentTools";
import { MODEL, PROMPT_COSTO_MILLON_LLAMADAS_LAMBDA } from "../tools/TypeScript/constantes";

const currencyAgent = new Agent({
    model: MODEL,
    systemPrompt: "Eres especialista en conversión entre MXN y USD. Usa currency_converter y responde con el resultado y la tasa usada.",
    tools: [CurrencyConverter],
    printer: false,
});

const mcpDocsClient = createMcpClient(() => new StdioClientTransport(
        {
            command: "uvx",
            args: ["awslabs.aws-documentation-mcp-server@latest"]
        })
    )

const awsDocsAgent = new Agent({
    model: MODEL,
    systemPrompt: "Eres especialista en AWS. Consulta la documentación oficial antes de responder y menciona qué página consultaste.",
    tools: [mcpDocsClient],
    printer: false,
});

const mcpCostClient = createMcpClient(() => new StdioClientTransport(
        {
            command: "uvx",
            args: ["awslabs.aws-pricing-mcp-server@latest"],
            env: { "FASTMCP_LOG_LEVEL": "ERROR", "AWS_PROFILE": "default", "AWS_REGION": "us-east-1" }
        })
    )
const awsCostAgent = new Agent({
    model: MODEL,
    systemPrompt: "Eres especialista en AWS. Consulta los precios desde las fuentes oficiales y menciona qué página consultaste.",
    tools: [mcpCostClient],
    printer: false,
});

const orchestrator = new Agent({
    model: MODEL,
    systemPrompt: `Eres un asistente que delega en especialistas:
- Conversión de moneda MXN/USD → usa currency_specialist
- Preguntas técnicas sobre AWS → usa aws_docs_specialist
- Preguntas sobre costos de AWS → usa aws_cost_specialist
- Si la pregunta combina ambas cosas, usa los dos y junta las respuestas.
- Si no requiere especialista, responde directo.`,
    tools: [
        currencyAgent.asTool({
            name: "currency_specialist",
            description: "Convierte montos entre MXN y USD. Envía la solicitud completa con cantidades y monedas.",
        }),
        awsDocsAgent.asTool({
            name: "aws_docs_specialist",
            description: "Responde preguntas técnicas sobre servicios de AWS consultando su documentación oficial.",
        }),
        awsCostAgent.asTool({
            name: "aws_cost_specialist",
            description: "Responde preguntas sobre costos de servicios de AWS consultando sus precios oficiales.",
        }),
        sumar,
        multiplicar,
    ],
});

const invokeAgent = async (agent: Agent, prompt: string) => {
    try {
        console.log("Invocando al agente con el prompt:", prompt);
        const respuesta = await agent.invoke(prompt);
        console.log("Respuesta del agente:", respuesta);
    } catch (error) {
        console.error("Error al invocar el agente:", error);
    } finally {
        await Promise.all([mcpCostClient.disconnect(), mcpDocsClient.disconnect()]);
    }
}

await invokeAgent(orchestrator, PROMPT_COSTO_MILLON_LLAMADAS_LAMBDA);