from pydantic import BaseModel, Field
from strands import Agent, tool
import re

class ResultadoConversion(BaseModel):
    monto_original: float
    moneda_original: str
    monto_final: float
    moneda_final: str
    taza_usada:float
    pasos: list[str] = Field(description="Explicación de cada paso del cálculo")


@tool
def calculadora(expresion: str) -> str:
    """Evalúa una expresión matemática simple, ej: '23 * 4 + 1'"""
    try:
        if not re.match(r"^[\d\s+\-*/().]+$", expresion): # filtro basico con regex para permitir solo números, operadores y paréntesis
            return "Error: la expresión contiene caracteres no permitidos."
        resultado = eval(expresion, {"__builtins__": {}})
        return f"El resultado es {resultado}"
    except ZeroDivisionError:
        return "Error: división entre cero."
    except Exception as e:
        return f"Error al evaluar la expresión: {e}"

@tool
def sumar(numeros: list[float]) -> str:
    """Suma n cantidad de números, ej: '1, 2, 3'"""
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

agent = Agent(
    model="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    system_prompt="Eres un asistente financiero. Usa las herramientas disponibles para calcular y convertir montos.",
    tools=[calculadora, sumar, currency_converter],
    structured_output_model=ResultadoConversion
)

respuesta = agent(
    "Convierte 100 MXN a USD, súmale 50.44 USD y conviértelo de vuelta a MXN",
)

print("Respuesta: ", respuesta)
print("Estructurada: ", respuesta.structured_output)
# Podemos manejar errores de salida estructurada si es necesario con StructuredOutputException
# El import es: from strands.types.exceptions import StructuredOutputException
# ResultadoConversion(monto_original=100, moneda_original='MXN', monto_final=1008.0, moneda_final='MXN', pasos=[...])