from pydantic import BaseModel, Field
from strands import Agent, tool

@tool
def sumar(numeros: list[float]) -> str:
    """Suma n cantidad de números, ej: '1 + 2 + 3'"""
    if not isinstance(numeros, list):
        return "Error: se espera una lista de números."
    if not numeros:
        return "Error: no se proporcionaron números para sumar."
    if not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in numeros):
        return "Error: todos los elementos deben ser números válidos."
    resultado = sum(numeros)
    return f"El resultado de la suma es {resultado}"

@tool
def currency_converter(amount: float, fromCurrency: str, toCurrency: str) -> str:
    """Convierte MXN a USD y viceversa, ej: '100 USD a MXN'"""
    # Aquí podrías implementar la lógica de conversión de divisas usando una API externa
    # Por simplicidad, vamos a devolver un mensaje simulado
    try:
        if fromCurrency == toCurrency:
            return f"{amount} {fromCurrency} equivalen a {amount} {toCurrency}"

        tazas_en_mx = {"USD": 18, "MXN": 1}
        amount_in_mxn = amount * tazas_en_mx[fromCurrency]
        resultado = amount_in_mxn / tazas_en_mx[toCurrency]
        return f"Convertido {amount} {fromCurrency} a {toCurrency}: {resultado:.2f} {toCurrency}"
    except Exception as e:
        return f"Error al convertir la moneda: {e}"

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

resultado = agent("Gasté 500 MXN en comida, 30 USD en transporte y 15.50 USD en café")
resumen = resultado.structured_output

if not isinstance(resumen, ResumenGastos):
    raise TypeError("La respuesta del agente no devolvió un ResumenGastos válido.")

for g in resumen.gastos:
    print(f"{g.descripcion}: {g.monto_original} {g.moneda_original} = {g.monto_en_mxn:.2f} MXN")
print(f"Total: {resumen.total_mxn:.2f} MXN")