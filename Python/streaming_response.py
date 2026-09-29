from tools.agent_tools import sumar, currency_converter
from strands.types.exceptions import StructuredOutputException
from pydantic import BaseModel, Field
from strands import Agent
from pydantic import field_validator
import asyncio


class Gasto(BaseModel):
    descripcion: str = Field(description="Qué fue el gasto")
    monto_original: float
    moneda_original: str
    monto_en_mxn: float = Field(description="Monto convertido a MXN")

    @field_validator("monto_en_mxn")
    @classmethod
    def monto_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("monto_en_mxn debe ser mayor a cero")
        return v

class ResumenGastos(BaseModel):
    gastos: list[Gasto]
    total_mxn: float = Field(description="Suma de todos los gastos convertidos a MXN")

agent = Agent(
    model="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    system_prompt="Eres un asistente de finanzas personales. Usa currency_converter para normalizar cada gasto a MXN y sumar para hacer sumas",
    tools=[currency_converter, sumar],
    structured_output_model=ResumenGastos,
    callback_handler=None,
)

async def invoke_streaming_response(prompt: str):
    try:
        tools_vistos = set()
        async for event in agent.stream_async(prompt):
            if "data" in event:
                print(event["data"], end="", flush=True)  # texto llegando token por token
            elif "current_tool_use" in event:
                tool_use = event["current_tool_use"]
                tool_id = tool_use.get("toolUseId")
                if tool_id and tool_id not in tools_vistos:
                    tools_vistos.add(tool_id)
                    print(f"\n[usando tool: {tool_use.get('name')}]")
            elif "result" in event:
                print("\n\n--- Resultado estructurado ---")
                for g in event["result"].structured_output.gastos:
                    print(f"{g.descripcion}: {g.monto_en_mxn:.2f} MXN")
                print(f"Total: {event['result'].structured_output.total_mxn:.2f} MXN")


        # async for event in agent.stream_async(prompt):
        #     # Track event loop lifecycle
        #     if event.get("init_event_loop", False):
        #         print("Event loop initialized")
        #     elif event.get("start_event_loop", False):
        #         print("Event loop cycle starting")
        #     elif "message" in event:
        #         print(f"New message created: {event['message']['role']}")
        #     elif "result" in event:
        #         print("Agent completed with result")
        #     elif event.get("force_stop", False):
        #         print(f"Event loop force-stopped: {event.get('force_stop_reason', 'unknown reason')}")

        #     # Track tool usage
        #     if "current_tool_use" in event and event["current_tool_use"].get("name"):
        #         tool_name = event["current_tool_use"]["name"]
        #         print(f"Using tool: {tool_name}")

        #     # Show the first 20 characters of each text chunk to keep output readable
        #     if "data" in event:
        #         data_snippet = event["data"][:20] + ("..." if len(event["data"]) > 20 else "")
        #         print(f"Text: {data_snippet}")
    except Exception as e:
        # implementando manejo de errores para salida estructurada
        if isinstance(e, StructuredOutputException):
            print(f"Error de salida estructurada: {e}")
        else:
            print(f"Error al invocar el agente: {e}")

asyncio.run(invoke_streaming_response("Gasté 500 MXN en comida, 30 USD en transporte y 15.50 USD en café"))