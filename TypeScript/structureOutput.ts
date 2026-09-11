import { Agent, tool, StructuredOutputError } from "@strands-agents/sdk";
import { z } from "zod";

// ...reusa calculadora y CurrencyConverter del Ejercicio 1
const calculadora = tool({
  name: "calculadora",
  description: "Evalúa una expresión matemática simple, ej: '23 * 4 + 1'",
  inputSchema: z.object({
    expresion: z.string(),
  }),
  callback: async ({ expresion }) => {
    try {
      if (!/^[\d\s+\-*/().]+$/.test(expresion)) {
        return `Error: la expresión contiene caracteres no permitidos.`;
      }
      const resultado = Function(`"use strict"; return (${expresion})`)();
      if (typeof resultado !== "number" || isNaN(resultado) || !isFinite(resultado)) {
        return `Error: la expresión no es válida, posible valor nulo o infinito.`;
      }
      return `El resultado es ${resultado}`;
    } catch (e) {
      return `Error al evaluar la expresión: ${e instanceof Error ? e.message : String(e)}`;
    }
  },
});

const sumar = tool({
  name: "Sumar_tool",
  description: "Suma n cantidad de números, ej: '1, 2, 3'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para sumar o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      const resultado = numeros.reduce((acc, curr) => acc + curr, 0);
      return `El resultado de la suma es ${resultado}`;
    } catch (error) {
      return `Error al sumar los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
})

const CurrencyConverter = tool({
  name: "currency_converter",
  description: "Convierte una cantidad entre MXN y USD (tasa simulada: 1 USD = 18 MXN). Recibe amount, fromCurrency y toCurrency (usa 'MXN' o 'USD').",
  inputSchema: z.object({
    amount: z.number(),
    fromCurrency: z.enum(["MXN", "USD"]),
    toCurrency: z.enum(["MXN", "USD"]),
  }),
  callback: ({ amount, fromCurrency, toCurrency }) => {
    try {
      if (fromCurrency === toCurrency) {
      return `${amount} ${fromCurrency} equivalen a ${amount} ${toCurrency}`;
    }
    // Tasas relativas a MXN (moneda base)
    const tasasEnMxn: Record<string, number> = { MXN: 1, USD: 18 };
    const amountEnMxn = amount * tasasEnMxn[fromCurrency];
    const resultado = amountEnMxn / tasasEnMxn[toCurrency];
    return `${amount} ${fromCurrency} equivalen a ${resultado.toFixed(2)} ${toCurrency}`;
    } catch (error) {
      return `Error al convertir la moneda: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const resultadoSchema = z.object({
  montoOriginal: z.number(),
  monedaOriginal: z.string(),
  montoFinal: z.number(),
  monedaFinal: z.string(),
  tazaUsada: z.number(),
  pasos: z.array(z.string()).describe("Explicación de cada paso del cálculo"),
});

const agent = new Agent({
  model: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
  systemPrompt: "Eres un asistente financiero. Usa las herramientas disponibles para calcular y convertir montos.",
  tools: [calculadora, sumar, CurrencyConverter],
});
try {
    const respuesta = await agent.invoke(
    "Convierte 100 MXN a USD, súmale 50.44 USD y conviértelo de vuelta a MXN",
    { structuredOutputSchema: resultadoSchema } // ajusta el nombre exacto de la opción si difiere en tu versión del SDK
    );

    console.log("Respuesta: ", respuesta);
    console.log("Estructurada: ", respuesta.structuredOutput);
    // { montoOriginal: 100, monedaOriginal: "MXN", montoFinal: 1008, monedaFinal: "MXN", pasos: [...] }
} catch (error) {
    // podemos capturar errores específicos de salida estructurada
    if (error instanceof StructuredOutputError) {
        console.error("Error al obtener la salida estructurada:", error.message);
    } else {
        console.error("Error inesperado:", error);
    }
}

