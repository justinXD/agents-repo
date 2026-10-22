from strands import Agent, tool
from strands.multiagent import GraphBuilder
from tools.agent_tools import currency_converter, sumar, invoke_graph_with_stream, create_mcp_client
from tools.constantes import MODEL, PROMPT_COSTO_ARQUITECTURA, PROMPT_COSTO_ARQUITECTURA_CON_CLOUDWATCH
from mcp import stdio_client, StdioServerParameters
import asyncio

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

analista = Agent(
    name="analista", model=MODEL, callback_handler=None,
    tools=[tarifa_simulada, sumar, currency_converter],
    system_prompt="""Extrae los servicios y volúmenes de la solicitud, consulta cada tarifa con tarifa_simulada,
calcula el costo mensual por servicio, suma el total en USD y conviértelo a la moneda pedida.
Reglas: nunca estimes una tarifa. Si tarifa_simulada devuelve error para un servicio, escribe 'SIN TARIFA: <servicio>' y no lo incluyas en el total.
Si recibes comentarios del revisor, corrige exactamente lo que señala y entrega el desglose completo otra vez.""",
)
revisor = Agent(
    name="revisor", model=MODEL, callback_handler=None,
    system_prompt="""Revisa el desglose: (1) cada servicio pedido está cubierto o marcado 'SIN TARIFA', (2) las cuentas cuadran, (3) ninguna tarifa fue estimada.
Termina SIEMPRE con una sola etiqueta exacta: [[APROBADO]] o [[RECHAZADO]]. Si rechazas, explica antes el error concreto.""",
)
redactor = Agent(
    name="redactor", model=MODEL, callback_handler=None,
    system_prompt="Convierte el desglose aprobado en un reporte breve para un cliente: servicios, total y notas (menciona cualquier servicio sin tarifa).",
)

def texto_de(state, node_id):
    nodo = state.results.get(node_id)
    return str(nodo.result) if nodo else ""

def aprobado(state):  return "[[APROBADO]]" in texto_de(state, "revision")
def rechazado(state): return "[[RECHAZADO]]" in texto_de(state, "revision")

builder = GraphBuilder()
builder.add_node(analista, "analisis")
builder.add_node(revisor, "revision")
builder.add_node(redactor, "reporte")
builder.add_edge("analisis", "revision")
builder.add_edge("revision", "analisis", condition=rechazado)
builder.add_edge("revision", "reporte", condition=aprobado)
builder.set_entry_point("analisis")        # el bucle le da una arista entrante a analisis
builder.set_max_node_executions(8)
builder.set_execution_timeout(300)
builder.reset_on_revisit(False) # hace un reset del estado de cada nodo si se vuelve a visitar, para que no acumule resultados de iteraciones previas
graph = builder.build()

# result = graph(PROMPT_COSTO_ARQUITECTURA)
# print(result.status)
# print([n.node_id for n in result.execution_order])
# print(result.accumulated_usage)

async def main():
    # invocacion primer ejemplo
    # await invoke_swarm_with_stream(swarm, PROMPT_COSTO_ARQUITECTURA)
    # invocacion segundo ejemplo
    await invoke_graph_with_stream(graph, PROMPT_COSTO_ARQUITECTURA_CON_CLOUDWATCH)

if __name__ == "__main__":
    asyncio.run(main())