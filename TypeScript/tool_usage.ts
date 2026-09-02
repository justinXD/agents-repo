import { Agent, tool } from "@strands-agents/sdk";
import { z } from "zod";

interface CurrencyTypes {
  "USD": () => number;
  "MXN": () => number;
}

const calculadora = tool({
  name: "calculadora",
  description: "Evalúa una expresión matemática simple, ej: '23 * 4 + 1'",
  inputSchema: z.object({
    expresion: z.string(),
  }),
  callback: async ({ expresion }) => {
    try {
      const resultado = Function(`"use strict"; return (${expresion})`)();
      return `El resultado es ${resultado}`;
    } catch (e) {
      return `Error al evaluar: ${e}`;
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
    const resultado = numeros.reduce((acc, curr) => acc + curr, 0);
    return `El resultado de la suma es ${resultado}`;
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
    if (fromCurrency === toCurrency) {
      return `${amount} ${fromCurrency} equivalen a ${amount} ${toCurrency}`;
    }
    // Tasas relativas a MXN (moneda base)
    const tasasEnMxn: Record<string, number> = { MXN: 1, USD: 18 };
    const amountEnMxn = amount * tasasEnMxn[fromCurrency];
    const resultado = amountEnMxn / tasasEnMxn[toCurrency];
    return `${amount} ${fromCurrency} equivalen a ${resultado.toFixed(2)} ${toCurrency}`;
  },
});

const agent = new Agent({
  model: "us.anthropic.claude-haiku-4-5-20251001-v1:0", // ajusta al model_id que tengas habilitado
  systemPrompt: "Eres un asistente que ayuda con cálculos matemáticos. Usa las herramientas cuando sea necesario.",
  tools: [calculadora, sumar, CurrencyConverter],
});

// const respuesta = await agent.invoke("¿Cuánto es 45 * 12 + 7?");
// const respuestaSuma = await agent.invoke("¿Cuál es el resultado de sumar 1, 2, 3, 4, 5 y así sucesivamente hasta llegar al 100?");
// // console.log(respuesta);
// console.log(respuestaSuma);

const respuestaConversion = await agent.invoke("Convierte 100 MXN a USD, al resultado sumale 50.44 USD y luego conviertelo a MXN");
console.log(respuestaConversion);