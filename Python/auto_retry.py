from tools.agent_tools import sumar, currency_converter
from strands.types.exceptions import StructuredOutputException
from pydantic import BaseModel, Field
from strands import Agent


class Gasto(BaseModel):
    descripcion: str = Field(description="Qué fue el gasto")
    monto_original: float
    moneda_original: str
    monto_en_mxn: float = Field(description="Monto convertido a MXN")

class ResumenGastos(BaseModel):
    gastos: list[Gasto]
    total_mxn: float = Field(description="Suma de todos los gastos convertidos a MXN")

agent = Agent(
    model="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    system_prompt="Eres un asistente de finanzas personales. Usa currency_converter para normalizar cada gasto a MXN y sumar para hacer sumas",
    tools=[currency_converter, sumar],
    structured_output_model=ResumenGastos,
)

def invoke_agent():
    try:
        resultado = agent("Gasté 500 MXN en comida, 30 USD en transporte y 15.50 USD en café")
        resumen = resultado.structured_output

        if not isinstance(resumen, ResumenGastos):
            raise TypeError("La respuesta del agente no devolvió un ResumenGastos válido.")

        for g in resumen.gastos:
            print(f"{g.descripcion}: {g.monto_original} {g.moneda_original} = {g.monto_en_mxn:.2f} MXN")
        print(f"Total: {resumen.total_mxn:.2f} MXN")
    except Exception as e:
        # implementando manejo de errores para salida estructurada
        if isinstance(e, StructuredOutputException):
            print(f"Error de salida estructurada: {e}")
        else:
            print(f"Error al invocar el agente: {e}")

invoke_agent()