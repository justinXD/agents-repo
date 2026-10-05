from tools.constantes import MODEL
from tools.agent_tools import currency_converter, create_mcp_client
from mcp import stdio_client, StdioServerParameters
from strands import Agent


mcp_price_client = create_mcp_client(lambda: stdio_client(
        StdioServerParameters(
            command="uvx",
            args=["awslabs.aws-pricing-mcp-server@latest"],
            env={"FASTMCP_LOG_LEVEL": "ERROR", "AWS_PROFILE": "default", "AWS_REGION": "us-east-1"},
        )
    ))

currency_agent = Agent(
    model=MODEL,
    system_prompt="Eres especialista en conversión entre MXN y USD. Usa currency_converter y responde con el resultado y la tasa usada.",
    tools=[currency_converter],
    callback_handler=None,  # el especialista no imprime en consola
)

aws_price_agent = Agent(
    model=MODEL,
    system_prompt="Eres especialista en AWS. Consulta los precios desde las fuentes oficiales y menciona qué página consultaste.",
    tools=[mcp_price_client],
    callback_handler=None,
)

orchestrator = Agent(
    model=MODEL,
    system_prompt="""Eres un asistente que delega en especialistas:
- Conversión de moneda MXN/USD → usa currency_specialist
- Preguntas técnicas sobre AWS → usa aws_docs_specialist
- Si la pregunta combina ambas cosas, usa los dos y junta las respuestas.
- Si no requiere especialista, responde directo.""",
    tools=[
        currency_agent.as_tool(
            name="currency_specialist",
            description="Convierte montos entre MXN y USD. Envía la solicitud completa con cantidades y monedas.",
        ),
        aws_price_agent.as_tool(
            name="aws_price_specialist",
            description="Responde preguntas sobre los precios de los servicios de AWS consultando las fuentes oficiales.",
        ),
    ],
)

print(orchestrator("¿Cuál es la memoria máxima configurable en una función Lambda? Además convierte 250 USD a MXN."))