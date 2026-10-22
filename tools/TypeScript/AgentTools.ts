import { tool, McpClient, McpTransport, AgentResult, Agent, Swarm, Graph, ContentBlock } from "@strands-agents/sdk";
import { z } from "zod";

const textoDe = (content: ContentBlock[]) =>
  content.map((block) => ("text" in block ? block.text : "")).join("");

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
});

const restar = tool({
  name: "restar_tool",
  description: "Resta n cantidad de números, ej: '10 - 2 - 3'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para restar o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      let acumulador: number = numeros[0] - numeros[1];
      for (let i = 2; i < numeros.length; i++) {
        acumulador -= numeros[i]
      }
      return `El resultado de la resta es ${acumulador}`;
    } catch (error) {
      return `Error al restar los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const multiplicar = tool({
  name: "multiplicar_tool",
  description: "Multiplica n cantidad de números, ej: '2 * 3 * 4'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para multiplicar o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      // const resultado = numeros.reduce((acc, curr) => acc * curr, 1);
      let resultado: number = numeros[0] * numeros[1];
      for (let i = 2; i < numeros.length; i++) {
        resultado *= numeros[i]
      }
      return `El resultado de la multiplicación es ${resultado}`;
    } catch (error) {
      return `Error al multiplicar los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const dividir = tool({
  name: "dividir_tool",
  description: "Divide n cantidad de números, ej: '20 / 2 / 2'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para dividir o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      let resultado: number = numeros[0] / numeros[1];
      for (let i = 2; i < numeros.length; i++) {
        if (numeros[i] === 0) {
          return "Error: división por cero no permitida.";
        }
        resultado /= numeros[i]
      }
      return `El resultado de la división es ${resultado}`;
    } catch (error) {
      return `Error al dividir los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const CurrencyConverter = tool({
  name: "currency_converter",
  description: "Convierte una cantidad entre MXN y USD (tasa simulada: 1 USD = 18 MXN). Recibe amount, fromCurrency y toCurrency (usa 'MXN' o 'USD').",
  inputSchema: z.object({
    amount: z.number(),
    fromCurrency: z.enum(["MXN", "USD"]),
    toCurrency: z.enum(["MXN", "USD"]),
  }),
  callback: async ({ amount, fromCurrency, toCurrency }) => {
    try {
      if (fromCurrency === toCurrency) {
        return `${amount} ${fromCurrency} equivalen a ${amount} ${toCurrency}`;
      }
      if (amount < 0) {
        return "Error: el monto debe ser un número positivo.";
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

const createMcpClient = (makeTransport: () => McpTransport): McpClient => {
  return new McpClient({ transport: makeTransport() });
}

const conTimeout = async <T>(p: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer); // el timer no deja el proceso colgado
  }
};

const disconnectAll = async (clients: McpClient[], ms = 5000) => {
  const results = await Promise.allSettled(clients.map((mcpClient) => conTimeout(mcpClient.disconnect(), ms)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`MCP client #${i} no cerró bien:`, r.reason);
  });
}

const printAgentMetrics = (agentResponse: AgentResult) => {
  try {
    console.log("Métricas del agente:");
    console.log("Ciclos totales:", agentResponse.metrics?.cycleCount);
    console.log("Tokens usados:", agentResponse.metrics?.accumulatedUsage);
    console.log("Tiempo de respuesta (ms):", agentResponse.metrics?.totalDuration);
    console.log("Tool metrics:")
    if (agentResponse.metrics?.toolMetrics) {
      for (const [toolName, toolMetric] of Object.entries(agentResponse.metrics.toolMetrics)) {
        console.log(`${toolName}:`);
        console.log(`Calls: ${toolMetric.callCount}`);
        console.log(`Duration (ms): ${toolMetric.totalTime}`);
      }
    } else {
      console.log("  No se encontraron métricas de herramientas.");
    }
    console.log("Invocacion del agente:", agentResponse.metrics?.agentInvocations[0].cycles);
    console.log("JSON metrics:")
    console.log(JSON.stringify(agentResponse?.metrics?.toJSON()));
  } catch (error) {
    console.error("Error al imprimir métricas del agente:", error);
  }
}

const invokeAgent = async (agent: Agent, prompt: string, mcpClients?: McpClient[]) => {
  try {
    console.log("Invocando al agente con el prompt:", prompt);
    const respuesta = await agent.invoke(prompt);
    console.log("Respuesta del agente:", respuesta);
    printAgentMetrics(respuesta);
  } catch (error) {
    console.error("Error al invocar el agente:", error);
  } finally {
    if (mcpClients) {
      await disconnectAll(mcpClients, 5000);
    }
  }
}

const invokeSwarm = async (swarm: Swarm, prompt: string, mcpClients?: McpClient[]) => {
  try {
    console.log("Invocando al swarm con el prompt:", prompt);
    const resultado = await swarm.invoke(prompt);
    console.log("Status: ", resultado.status)
    console.log("Resultado:", resultado.results);
    console.log("Node results: ", resultado.results.map((r) => r.nodeId).join(' -> '))
  } catch (error) {
    console.error("Error al invocar el swarm:", error);
  } finally {
    if (mcpClients) {
      await disconnectAll(mcpClients, 5000);
    }
  }
}

const invokeSwarmWithStream = async (swarm: Swarm, prompt: string, mcpClients?: McpClient[]) => {
  try {
    console.log("Invocando al swarm con stream y el prompt:", prompt);
    const relevantEvents = new Set<string>(["modelMessageEvent", "agentResultEvent"]);
    // console.log("eventos relevantes: ", relevantEvents);
    // return new Error("Error: invokeSwarmWithStream no implementado correctamente. Se requiere lógica para manejar los eventos del stream.");
    for await (const event of swarm.stream(prompt)) {
      // console.log("Evento del stream:", event);
      switch (event.type) {
        // Track handoffs between agents
        case 'multiAgentHandoffEvent':
          console.log(`\nHandoff: ${event.source} -> ${event.targets.join(', ')}`)
          break

        // Monitor individual node results
        case 'nodeResultEvent':
          console.log(`\nNode ${event.result.nodeId}: ${event.result.status}`)
          break

        case "nodeStreamUpdateEvent":
          // console.log(`block delta event: ${JSON.stringify(event.inner.event)}`)
          if (Object.hasOwn(event.inner.event, "type")) {
            // console.log("Event si tiene type: ", event.inner.event.type, relevantEvents.has(event.inner.event.type))
            if (relevantEvents.has(event.inner.event.type)) {
              switch (event.inner.event.type) {
                case "modelMessageEvent":
                  console.log("Process update: ", textoDe(event.inner.event.message.content))
                  break;
                case "agentResultEvent":
                  console.log("Agent result: ", textoDe(event.inner.event.result.lastMessage.content))
                  break;
              
                default:
                  break;
              }
            }
          }
          break

        // Get final result
        case 'multiAgentResultEvent':
          console.log(`\nSwarm completed: ${event.result.status}`)
          break
      }
    }
  } catch (error) {
    console.error("Error al invocar el swarm con stream:", error);
  } finally {
    if (mcpClients) {
      await disconnectAll(mcpClients, 5000);
    }
  }
}

const invokeGraphWithStream = async (graph: Graph, prompt: string, mcpClients?: McpClient[]) => {
  try {
    const relevantEvents = new Set<string>(["modelMessageEvent", "agentResultEvent"]);
    for await (const event of graph.stream(prompt)) {
      switch (event.type) {
        // Track node execution
        case 'beforeNodeCallEvent':
          console.log(`\nNode ${event.nodeId} starting`)
          break

        // Monitor node completion
        case 'nodeResultEvent':
          console.log(`\nNode ${event.nodeId} completed in ${event.result.duration}ms`)
          break

        // Track handoffs between nodes
        case 'multiAgentHandoffEvent':
          console.log(`\nHandoff: ${event.source} -> ${event.targets.join(', ')}`)
          break

        case "nodeStreamUpdateEvent":
          // console.log(`block delta event: ${JSON.stringify(event.inner.event)}`)
          if (Object.hasOwn(event.inner.event, "type")) {
            // console.log("Event si tiene type: ", event.inner.event.type, relevantEvents.has(event.inner.event.type))
            if (relevantEvents.has(event.inner.event.type)) {
              switch (event.inner.event.type) {
                case "modelMessageEvent":
                  console.log("Process update: ", textoDe(event.inner.event.message.content))
                  break;
                case "agentResultEvent":
                  console.log("Agent result: ", textoDe(event.inner.event.result.lastMessage.content))
                  break;
              
                default:
                  break;
              }
            }
          }
          break

        // Get final result
        case 'multiAgentResultEvent':
          console.log(`\nGraph completed: ${event.result.status}`)
          break
      }
    }
  } catch (error) {
    console.error("Error al invocar el graph con stream:", error);
  } finally {
    if (mcpClients) {
      await disconnectAll(mcpClients, 5000);
    }
  }
}

export { 
  calculadora, 
  sumar, 
  restar, 
  multiplicar, 
  dividir, 
  CurrencyConverter, 
  createMcpClient, 
  disconnectAll, 
  printAgentMetrics, 
  invokeAgent, 
  invokeSwarm, 
  invokeSwarmWithStream,
  invokeGraphWithStream
};