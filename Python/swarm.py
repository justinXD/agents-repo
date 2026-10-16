import asyncio

from strands import Agent, tool
from strands.multiagent import Swarm
from tools.constantes import MODEL, PROMPT_COSTO_ARQUITECTURA, PROMPT_COSTO_ARQUITECTURA_CON_CLOUDWATCH
from tools.agent_tools import sumar, currency_converter, invoke_swarm_with_stream, create_mcp_client
from mcp import stdio_client, StdioServerParameters


TARIFAS_USD = {
    "api_gateway_millon_peticiones": 1.00,
    "lambda_millon_invocaciones": 0.20,
    "dynamodb_millon_lecturas": 0.25,
    "s3_gb_mes": 0.023,
}

mcp_price_client = create_mcp_client(lambda: stdio_client(
        StdioServerParameters(
            command="uvx",
            args=["awslabs.aws-pricing-mcp-server@latest"],
            env={"FASTMCP_LOG_LEVEL": "ERROR", "AWS_PROFILE": "default", "AWS_REGION": "us-east-1"},
        )
    ))

@tool
def tarifa_simulada(servicio: str) -> str:
    """Devuelve la tarifa simulada en USD de un servicio (no son precios reales).
    Servicios válidos: api_gateway_millon_peticiones, lambda_millon_invocaciones,
    dynamodb_millon_lecturas, s3_gb_mes."""
    if servicio not in TARIFAS_USD:
        return f"Error: no hay tarifa para '{servicio}'. Válidos: {', '.join(TARIFAS_USD)}"
    return f"{servicio}: {TARIFAS_USD[servicio]} USD"

arquitecto = Agent(
    name="arquitecto", model=MODEL, callback_handler=None,
    description="Identifica los servicios AWS y los volúmenes mensuales de una solicitud.",
    system_prompt="Extrae de la solicitud cada servicio con su volumen mensual. Luego pasa el trabajo a analista_costos con la lista completa y el pedido original (moneda final incluida).",
)
analista = Agent(
    name="analista_costos", model=MODEL, callback_handler=None,
    description="Calcula costos por servicio con tarifas y convierte monedas.",
    tools=[tarifa_simulada, sumar, currency_converter, mcp_price_client],
    system_prompt="Para cada servicio consulta su tarifa, calcula el costo mensual, suma el total en USD y conviértelo a la moneda pedida. Nunca inventes tarifas. Al terminar, pasa el desglose completo a revisor. Puedes usar el MCP de precios de AWS para obtener tarifas oficiales si no estan disponibles en TARIFAS_USD o no fueron provistas.",
)
revisor = Agent(
    name="revisor", model=MODEL, callback_handler=None,
    description="Valida cálculos y entrega el reporte final.",
    system_prompt="Verifica que todos los servicios pedidos estén cubiertos y que las cuentas cuadren. Si hay un error concreto, pasa el trabajo a analista_costos explicando el error. Si todo es correcto, responde tú con el reporte final y no hagas handoff.",
)

swarm = Swarm([arquitecto, analista, revisor], entry_point=arquitecto, max_handoffs=6, max_iterations=8)
# result = swarm("API de pedidos: 2 millones de peticiones al mes en API Gateway, 3 millones de invocaciones Lambda, 5 millones de lecturas DynamoDB y 50 GB en S3. ¿Cuánto cuesta al mes en MXN?")
# print(result)  # inspecciona qué campos trae: estado, historial de agentes, resultados

async def main():
    # invocacion primer ejemplo
    # await invoke_swarm_with_stream(swarm, PROMPT_COSTO_ARQUITECTURA)
    # invocacion segundo ejemplo
    await invoke_swarm_with_stream(swarm, PROMPT_COSTO_ARQUITECTURA_CON_CLOUDWATCH)

if __name__ == "__main__":
    asyncio.run(main())