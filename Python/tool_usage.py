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

agent = Agent(
    model="us.anthropic.claude-haiku-4-5-20251001-v1:0",  # ajusta al model_id que tengas habilitado
    system_prompt="Eres un asistente que ayuda con cálculos matemáticos. Usa la herramienta calculadora cuando sea necesario.",
    tools=[calculadora],
)

respuesta = agent("¿Cuánto es 45 * 12 + 7?")
print(respuesta)