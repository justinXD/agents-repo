from strands import tool
from functools import reduce
import re

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
def restar(numeros: list[float]) -> str:
    """Resta n cantidad de números, ej: '10 - 2 - 3'"""
    if not isinstance(numeros, list):
        return "Error: se espera una lista de números."
    if not numeros:
        return "Error: no se proporcionaron números para restar."
    if not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in numeros):
        return "Error: todos los elementos deben ser números válidos."
    resultado = reduce(lambda x, y: x - y, numeros)
    return f"El resultado de la resta es {resultado}"

@tool
def currency_converter(amount: float, fromCurrency: str, toCurrency: str) -> str:
    """Convierte MXN a USD y viceversa, ej: '100 USD a MXN'"""
    # Aquí podrías implementar la lógica de conversión de divisas usando una API externa
    # Por simplicidad, vamos a devolver un mensaje simulado
    try:
        if fromCurrency == toCurrency:
            return f"{amount} {fromCurrency} equivalen a {amount} {toCurrency}"

        if amount < 0:
            return "Error: el monto debe ser un número positivo."

        tazas_en_mx = {"USD": 18, "MXN": 1}
        amount_in_mxn = amount * tazas_en_mx[fromCurrency]
        resultado = amount_in_mxn / tazas_en_mx[toCurrency]
        return f"Convertido {amount} {fromCurrency} a {toCurrency}: {resultado:.2f} {toCurrency}"
    except Exception as e:
        return f"Error al convertir la moneda: {e}"