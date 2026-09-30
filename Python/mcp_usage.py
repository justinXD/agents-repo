from mcp import stdio_client, StdioServerParameters
from strands import Agent
from strands.tools.mcp import MCPClient

# mcp_client = MCPClient(lambda: stdio_client(
#     StdioServerParameters(
#         command="uvx",
#         args=["awslabs.aws-documentation-mcp-server@latest"],
#     )
# ))

def create_mcp_client():
    try:
        return MCPClient(lambda: stdio_client(
            StdioServerParameters(
                command="uvx",
                args=["awslabs.aws-documentation-mcp-server@latest"],
            )
        ))
    except Exception as e:
        print(f"Error al crear el cliente MCP: {e}")
        return None

# Forma administrada: Strands abre y cierra la conexión por ti
agent = Agent(
    model="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    system_prompt="Eres un asistente experto en AWS. Consulta la documentación oficial con tus herramientas antes de responder.",
    tools=[create_mcp_client()],
)


def invoke_agent(agent, prompt):
    try:
        respuesta = agent(prompt)
        print(respuesta)
    except Exception as e:
        print(f"Error al invocar al agente: {e}")
        return None


def list_mcp_tools(mcp_client, prompt):
    try:
        with mcp_client:
            tools = mcp_client.list_tools_sync()
            print([t.tool_name for t in tools])  # ver qué ofrece el servidor
            # agent = Agent(tools=tools)
            # print(agent(prompt))
    except Exception as e:
        print(f"Error al listar herramientas: {e}")

# invoke_agent(agent, "¿Cuál es el tiempo máximo de ejecución de una función Lambda?")
list_mcp_tools(create_mcp_client(), "¿Qué es AWS Lambda?")