# from strands import Agent, tool
from strands import Agent, tool

@tool
def calculadora(expresion: str) -> str:
    """Evalúa una expresión matemática simple, ej: '23 * 4 + 1'"""
    try:
        resultado = eval(expresion, {"__builtins__": {}})
        return f"El resultado es {resultado}"
    except Exception as e:
        return f"Error al evaluar: {e}"

@tool
def sumar(numeros: list[float]) -> str:
    """Suma n cantidad de números, ej: '1, 2, 3'"""
    resultado = sum(numeros)
    return f"El resultado de la suma es {resultado}"

@tool
def CurrencyConverter(amount: float, fromCurrency: str, toCurrency: str) -> str:
    """Convierte MXN a USD y viceversa, ej: '100 USD a MXN'"""
    # Aquí podrías implementar la lógica de conversión de divisas usando una API externa
    # Por simplicidad, vamos a devolver un mensaje simulado
    if fromCurrency == toCurrency:
        return f"{amount} {fromCurrency} equivalen a {amount} {toCurrency}"

    tazas_en_mx = {"USD": 18, "MXN": 1}
    amount_in_mxn = amount * tazas_en_mx[fromCurrency]
    resultado = amount_in_mxn / tazas_en_mx[toCurrency]
    return f"Convertido {amount} {fromCurrency} a {toCurrency}: {resultado:.2f} {toCurrency}"

agent = Agent(
    model="us.anthropic.claude-haiku-4-5-20251001-v1:0",  # ajusta al model_id que tengas habilitado
    system_prompt="Eres un asistente que ayuda con cálculos matemáticos. Usa las herramientas cuando sea necesario.",
    tools=[calculadora, sumar, CurrencyConverter],
)

respuesta = agent("Convierte 100 MXN a USD, al resultado sumale 50.44 USD y luego conviertelo a MXN")
print(respuesta)