import { Agent, McpClient } from "@strands-agents/sdk";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fi } from "zod/locales";

const mcpClient = new McpClient({
    transport: new StdioClientTransport({
        command: "uvx",
        args: ["awslabs.aws-documentation-mcp-server@latest"],
    }),
});

const agent = new Agent({
    model: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    systemPrompt: "Eres un asistente experto en AWS. Consulta la documentación oficial con tus herramientas antes de responder.",
    tools: [mcpClient],
});

// const respuesta = await agent.invoke("¿Cuál es el tiempo máximo de ejecución de una función Lambda?");
// console.log(respuesta);
async function invokeAgent(agent: Agent, prompt: string) {
    try {
        console.log("Invocando al agente con el prompt:", prompt);
        const respuesta = await agent.invoke(prompt);
        console.log("Respuesta del agente:", respuesta);
    } catch (error) {
        console.error("Error al invocar el agente:", error);
    }
}
// listamos las herramientas disponibles del MCP
async function listTools(mcpClient: McpClient) {
    try {
        console.log("Listando herramientas disponibles en el MCP...");
        const tools = await mcpClient.listTools();
        console.log(`Se encontraron ${tools.length} herramientas:`);
        console.log("Herramientas disponibles en el MCP:");
        tools.forEach((tool) => {
            console.log(`- ${tool.name}`);
        });
    } catch (error) {
        console.error("Error al listar herramientas del MCP:", error);
    } finally {
        // Cerrar la conexión del MCPClient
        await mcpClient.disconnect()
    }
}

// await invokeAgent(agent, "¿Cuál es el tiempo máximo de ejecución de una función Lambda?");
await listTools(mcpClient);
