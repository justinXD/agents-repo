# Aprendiendo a construir agentes de IA con Strands Agents y AWS

> Un laboratorio práctico, ejercicio por ejercicio, para pasar de "nunca he construido un agente" a orquestar sistemas multi-agente. Todo en **Python y TypeScript**, sobre **Amazon Bedrock**, y aprendido con una IA como maestro y mentor.

---

## Contenido

1. [Por qué existe este repositorio](#1-por-qué-existe-este-repositorio)
2. [Cómo usé la IA como maestro y mentor](#2-cómo-usé-la-ia-como-maestro-y-mentor)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Fase 0: preparación del entorno](#4-fase-0-preparación-del-entorno)
5. [Ruta de aprendizaje](#5-ruta-de-aprendizaje)
6. [Ejercicios completados](#6-ejercicios-completados)
7. [Patrones multi-agente: comparativa](#7-patrones-multi-agente-comparativa)
8. [Hallazgos con datos](#8-hallazgos-con-datos)
9. [Problemas comunes y cómo los resolví](#9-problemas-comunes-y-cómo-los-resolví)
10. [Seguridad y buenas prácticas](#10-seguridad-y-buenas-prácticas)
11. [Ideas de aplicación](#11-ideas-de-aplicación)
12. [Próximos pasos](#12-próximos-pasos)
13. [Recursos](#13-recursos)

---

## 1. Por qué existe este repositorio

Las vacantes de ingeniería de IA se están centrando cada vez más en **agentes**: sistemas donde un modelo decide qué herramientas usar, en qué orden y cuándo terminar. Yo no tenía prácticamente experiencia construyéndolos, y leer documentación no es lo mismo que depurar un agente que se queda colgado, inventa un dato o gasta 400 mil tokens en una sola pregunta.

Decidí aprender **construyendo**, con una ruta de ejercicios de menor a mayor complejidad, y dejar evidencia pública del proceso.

**Objetivos del repo**

- **Construir criterio, no solo código.** Saber *cuándo* conviene un tool, un structured output, un servidor MCP o un patrón multi-agente, y cuándo no.
- **Dominar dos lenguajes.** Cada ejercicio se implementa en Python y en TypeScript con el SDK de Strands Agents, para entender qué es del concepto y qué es del SDK.
- **Medir en vez de suponer.** Cada experimento revisa ciclos del agente, tokens y latencia.
- **Documentar con honestidad.** Incluyo los errores, las correcciones y las cosas que aún no puedo afirmar.

---

## 2. Cómo usé la IA como maestro y mentor

Este repo se construyó con **Claude (Anthropic)** como mentor. No le pedí "hazme el proyecto": le pedí que me enseñara, y trabajé cada ejercicio con este ciclo:

1. **Objetivo y código.** El mentor propone un ejercicio y el código en Python y TypeScript.
2. **Explicación detallada.** Qué hace cada pieza y por qué.
3. **Reto de mejora.** Un cambio que debo resolver yo antes de avanzar.
4. **Mi ejecución.** Corro el código, resuelvo el reto y vuelvo con evidencia: salidas, métricas, tracebacks.
5. **Interpretación y corrección.** El mentor analiza mis resultados, corrige lo que esté mal y profundiza.
6. **Registro.** Lo que funciona y lo que aprendí queda en este repositorio.

### Reglas que me funcionaron

- **Pedir el porqué, no solo el código.** Pregunté qué hace `process.stdout.write`, qué es un *type guard* en `event.type === "textDeltaEvent"`, o por qué `new transportClass(...)` fallaba con un tipo de instancia y funcionaba con un tipo constructor.
- **Traer evidencia propia.** Pegar métricas, errores y salidas reales y pedir una interpretación, en lugar de preguntar en abstracto.
- **Contrastar con la documentación oficial.** Compartí enlaces de la doc y pedí que el mentor verificara la sintaxis actual antes de escribir código.
- **Cuestionar las buenas prácticas.** Preguntar si era buena práctica usar `try/catch` en los tools o `disconnect()` en el cliente MCP, y por qué.
- **Experimentar antes de aceptar una conclusión.** El experimento de `preserveContext` y el conteo de ejecuciones reales de tools me enseñaron más que cualquier explicación.
- **Corregir al mentor cuando se equivoca.** Se equivocó varias veces (ver tabla). Detectarlo me obligó a leer la documentación de verdad.

### Dónde se equivocó el mentor (y cómo se detectó)

| Tema | Lo que se sugirió | Realidad | Cómo se detectó |
|---|---|---|---|
| Tools en TypeScript | Campo `execute` en `tool({...})` | El campo correcto es `callback` | Mi código y los tipos del SDK |
| Structured output en Python | `agent.structured_output(Model, prompt)` | Está deprecado; se usa `structured_output_model` | Lo encontré en la documentación y se lo señalé |
| Streaming en Python | Imprimir cada evento `current_tool_use` | Ese evento llega muchas veces por una sola llamada; parecía que los tools se ejecutaban de más | Compararlo con las llamadas reales |
| `setTimeout(...).unref()` | Usar `unref()` para no dejar el proceso colgado | En navegador `setTimeout` devuelve un número; en Node, un objeto `Timeout`. Los tipos dependen del entorno | Revisé MDN y mi configuración de TypeScript |
| Filtrado de tools MCP en TypeScript | Se afirmó soporte según una versión de la doc | Las versiones de la doc se contradicen; depende de la versión del SDK | Lectura cuidadosa de la doc |

**Conclusión:** una IA es un excelente acelerador de aprendizaje, pero no es una fuente de verdad. Lo que se aprende de verdad es el hábito de verificar.

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| SDK de agentes | [Strands Agents](https://strandsagents.com/) (Python y TypeScript) |
| Modelos | Amazon Bedrock (Claude) |
| Herramientas externas | Model Context Protocol (MCP): servidores de documentación y precios de AWS |
| Validación de esquemas | Pydantic (Python) y Zod (TypeScript) |
| Ejecución | Python con `venv`; TypeScript con `tsx` |
| Control de versiones | Git y GitHub |

---

## 4. Fase 0: preparación del entorno

Esta fase está pensada para quien clona el repo y **solo tiene Python y Node.js instalados**. Al terminar tendrás todas las herramientas, credenciales de AWS y un script que verifica que todo funciona antes de empezar con los ejercicios. Las instrucciones cubren **macOS, Linux y Windows**.

### 4.1 Qué vamos a preparar

| Herramienta | Para qué se usa | Versión mínima |
|---|---|---|
| Git | Clonar y versionar el repo | Cualquiera reciente |
| Python | Ejercicios en Python | 3.10 o superior |
| Node.js y npm | Ejercicios en TypeScript y CLI de AgentCore | 20 o superior |
| AWS CLI v2 | Autenticarte en AWS | v2 |
| `uv` / `uvx` | Lanzar los servidores MCP de los ejercicios | Reciente |
| Cuenta de AWS con acceso a Amazon Bedrock | Los modelos que usan los agentes | n/a |

**Terminal recomendada**

- **macOS:** Terminal o iTerm. Se recomienda [Homebrew](https://brew.sh) para instalar herramientas.
- **Linux:** cualquier terminal. Los comandos de ejemplo usan `apt` (Debian/Ubuntu); en otras distribuciones cambia el gestor de paquetes.
- **Windows:** **PowerShell** (no CMD). Necesitas `winget`, que viene con Windows 10/11 actualizados. Si prefieres, instala WSL2 y sigue las instrucciones de Linux dentro de él.

### 4.2 Verifica lo que ya tienes

**macOS / Linux**

```bash
python3 --version   # 3.10 o superior
node --version      # v20 o superior
npm --version
git --version
```

**Windows (PowerShell)**

```powershell
py --version        # 3.10 o superior (en Windows usa `py`, no `python`)
node --version      # v20 o superior
npm --version
git --version
```

Si alguno falta o su versión es menor, instálalo o actualízalo desde [python.org](https://www.python.org/downloads/) o [nodejs.org](https://nodejs.org/) antes de seguir.

### 4.3 Instala las herramientas que faltan

<details>
<summary><strong>macOS</strong></summary>

```bash
# 1. Homebrew (omite este paso si ya lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Git, AWS CLI v2 y uv
brew install git awscli uv

# 3. Verifica
aws --version
uv --version
```

Alternativa para AWS CLI: el instalador `.pkg` oficial de https://awscli.amazonaws.com/AWSCLIV2.pkg. Si falta Git, `xcode-select --install` también lo instala.

</details>

<details>
<summary><strong>Linux (Debian / Ubuntu)</strong></summary>

```bash
# 1. Utilidades base (python3-venv es necesario para crear entornos virtuales)
sudo apt update && sudo apt install -y git curl unzip python3-venv

# 2. AWS CLI v2 (en equipos ARM cambia x86_64 por aarch64)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# 3. uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 4. Cierra y abre la terminal, y verifica
aws --version
uv --version
```

En Fedora/RHEL usa `sudo dnf install -y git curl unzip` en lugar del paso 1. No instales AWS CLI con `apt install awscli`: suele traer una versión antigua. Si prefieres un gestor de paquetes, existe `sudo snap install aws-cli --classic`.

</details>

<details>
<summary><strong>Windows (PowerShell)</strong></summary>

```powershell
# 1. Git, AWS CLI v2 y uv
winget install -e --id Git.Git
winget install -e --id Amazon.AWSCLI
winget install -e --id astral-sh.uv

# 2. Cierra y vuelve a abrir PowerShell, y verifica
aws --version
uv --version
```

Alternativas: el instalador MSI de AWS CLI en https://awscli.amazonaws.com/AWSCLIV2.msi, y para uv `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`.

</details>

### 4.4 Clona el repo y crea los entornos

```bash
git clone https://github.com/justinXD/agents-repo
cd <carpeta-del-repositorio>
```

**Python: entorno virtual y dependencias**

macOS / Linux:

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install strands-agents mcp pydantic
```

Windows (PowerShell):

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install strands-agents mcp pydantic
```

> Si PowerShell dice que la ejecución de scripts está deshabilitada, corre una vez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` y vuelve a activar el entorno. En CMD el comando es `venv\Scripts\activate.bat`.

Sabrás que el entorno está activo porque el prompt empieza con `(venv)`. Tendrás que activarlo en cada terminal nueva.

**TypeScript: dependencias** (igual en los tres sistemas)

Si el repo incluye un `package.json` en la carpeta de TypeScript, basta con:

```bash
npm install
```

Si empiezas una carpeta desde cero:

```bash
npm init -y
npm pkg set type=module          # necesario para usar import y await a nivel superior
npm install @strands-agents/sdk zod @modelcontextprotocol/sdk
npm install -D tsx typescript
```

### 4.5 Configura AWS

**1. Credenciales**

Crea un usuario o rol con permisos para Bedrock (ver abajo) y configura tu terminal:

```bash
aws configure
```

Te pedirá: *Access Key ID*, *Secret Access Key*, *región por defecto* (elige donde tengas acceso a Bedrock, por ejemplo `us-east-1`) y *formato de salida* (`json`). Funciona igual en los tres sistemas; las credenciales se guardan en `~/.aws/credentials` (en Windows, `%UserProfile%\.aws\credentials`). Si tu organización usa IAM Identity Center, usa `aws configure sso`, que es preferible a claves de larga duración.

```bash
aws sts get-caller-identity   # debe devolver tu cuenta y tu usuario o rol
```

**2. Permisos mínimos de Bedrock** (suficientes para los primeros ejercicios)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    "Resource": "*"
  }]
}
```

Para un uso real, acota `Resource` a los modelos que necesites. Algunos ejercicios (por ejemplo, precios de AWS vía MCP o AgentCore) requieren permisos adicionales; se indican en cada ejercicio.

**3. Acceso al modelo**

Verifica en la consola de Amazon Bedrock que tu cuenta tiene acceso al modelo que vas a usar. Según la cuenta y la región, algunos proveedores (como Anthropic) pueden pedir habilitarlo o llenar un formulario de uso la primera vez. Después lista los identificadores disponibles:

```bash
aws bedrock list-foundation-models --by-provider anthropic --query "modelSummaries[].modelId" --region us-east-1
aws bedrock list-inference-profiles --region us-east-1
```

Algunos modelos solo se pueden invocar con el ID de un **perfil de inferencia** (suelen empezar con `us.` o `global.`). Si usas uno, tu política IAM debe permitirlo.

**4. Protege tu repositorio**

Antes de tu primer commit, asegúrate de que `.gitignore` incluya:

```
venv/
node_modules/
.env
__pycache__/
```

> Nunca subas credenciales al repositorio. Las claves viven en `~/.aws/`, no en el código.

### 4.6 Verifica tu entorno

El repo incluye dos scripts que comprueban todo lo anterior y hacen una llamada real al modelo.

```bash
# Python (con el entorno virtual activado)
python scripts/verificar_entorno.py

# TypeScript (desde la carpeta con tu package.json)
npx tsx scripts/verificarEntorno.ts
```

El script de Python revisa versiones de Python, Node.js, AWS CLI y `uv`, que `uvx` esté en el PATH, que el SDK de Strands esté instalado, que tus credenciales funcionen (solo muestra los últimos 4 dígitos de tu cuenta), y que el modelo responda. Si ves `❌`, la sección 4.8 explica los errores más comunes.

### 4.7 Prueba tu primer agente

**Python**

```python
import os
from strands import Agent, tool

MODEL_ID = os.environ["MODEL_ID"]

@tool
def conversor_moneda(cantidad: float, de: str, a: str) -> str:
    """Convierte entre MXN y USD con una tasa simulada (1 USD = 18 MXN)."""
    tasas_en_mxn = {"MXN": 1, "USD": 18}
    if de not in tasas_en_mxn or a not in tasas_en_mxn:
        return "Error: solo se admiten MXN y USD."
    return f"{cantidad} {de} = {cantidad * tasas_en_mxn[de] / tasas_en_mxn[a]:.2f} {a}"

agent = Agent(model=MODEL_ID, tools=[conversor_moneda])
print(agent("¿Cuánto son 250 USD en MXN?"))
```

**TypeScript**

```typescript
import { Agent, tool } from "@strands-agents/sdk";
import { z } from "zod";

const MODEL_ID = process.env.MODEL_ID!;
const tasasEnMxn = { MXN: 1, USD: 18 } as const;

const conversorMoneda = tool({
  name: "conversor_moneda",
  description: "Convierte entre MXN y USD con una tasa simulada (1 USD = 18 MXN).",
  inputSchema: z.object({
    cantidad: z.number(),
    de: z.enum(["MXN", "USD"]),
    a: z.enum(["MXN", "USD"]),
  }),
  callback: ({ cantidad, de, a }) =>
    `${cantidad} ${de} = ${((cantidad * tasasEnMxn[de]) / tasasEnMxn[a]).toFixed(2)} ${a}`,
});

const agent = new Agent({ model: MODEL_ID, tools: [conversorMoneda] });
const result = await agent.invoke("¿Cuánto son 250 USD en MXN?");
console.log(result.lastMessage.content.map((b) => ("text" in b ? b.text : "")).join(""));
```

### 4.8 Problemas frecuentes en la Fase 0

| Síntoma | Sistema | Solución |
|---|---|---|
| `python` no se reconoce, o abre la Microsoft Store | Windows | Usa `py`. Si falta Python, reinstálalo marcando "Add python.exe to PATH" |
| "la ejecución de scripts está deshabilitada" al activar el venv | Windows | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `No module named venv` o `ensurepip is not available` | Debian / Ubuntu | `sudo apt install python3-venv` |
| `externally-managed-environment` al usar `pip` | macOS / Linux | No instales en el Python del sistema; crea y activa el `venv` primero |
| `aws` o `uvx` "command not found" justo después de instalar | Todos | Cierra y abre la terminal. En Linux/macOS, `uv` se instala en `~/.local/bin`: verifica que esté en tu PATH |
| `NoCredentialsError` | Todos | Corre `aws configure` y confirma con `aws sts get-caller-identity`. Revisa que `AWS_PROFILE` apunte al perfil correcto |
| `AccessDeniedException` al invocar el modelo | Todos | Revisa permisos IAM, acceso al modelo en Bedrock y que la región sea la correcta |
| "on-demand throughput isn't supported" | Todos | Usa el ID de un perfil de inferencia (por ejemplo, con prefijo `us.`) en lugar del ID base del modelo |
| `Top-level await is currently not supported with the "cjs" output format` | Todos | Ejecuta `npm pkg set type=module` en la carpeta de TypeScript |

**Fase 0 completa cuando:** `scripts/verificar_entorno.py` muestra solo `✅` y `scripts/verificar-entorno.ts` responde `ok`.

---

## 5. Ruta de aprendizaje

La ruta va de lo simple a lo complejo. Cada fase termina con algo que puedo ejecutar y medir.

### Fase 0: preparación del entorno
- ✅ Herramientas base (Git, Python, Node.js, AWS CLI v2 y `uv`) en macOS, Linux o Windows
- ✅ Credenciales de AWS y acceso a un modelo de Amazon Bedrock
- ✅ Scripts de verificación del entorno (`scripts/`)

### Fundamentos de un solo agente
- ✅ Agente con tools propios y encadenamiento de varias llamadas
- ✅ Manejo de errores en tools (validación, listas permitidas, resultados inválidos)
- ✅ Structured output con esquemas anidados y validadores
- ✅ Streaming de respuestas y eventos de tools
- ✅ MCP: conectar servidores externos y gestionar su ciclo de vida

### Fase A: sistemas multi-agente
- ✅ **Agents-as-tools:** un orquestador que delega en agentes especialistas
- ✅ **Swarm:** agentes autónomos que se pasan el control entre sí
- ✅ **Graph:** flujos deterministas con aristas condicionales y bucles
- ⬜ **A2A (Agent2Agent):** agentes que se comunican entre servicios distintos

### Fase B: hacerlos robustos
- ⬜ Gestión de la conversación y del contexto (ventana deslizante, resumen)
- ⬜ Memoria y sesiones persistentes
- ⬜ **Hooks:** interceptar el ciclo de vida del agente para validar, registrar o bloquear
- ⬜ Human-in-the-loop con interrupts: pausar para pedir aprobación

### Fase C: calidad y seguridad
- ⬜ Guardrails de Bedrock (filtros de contenido, PII)
- ⬜ Observabilidad: métricas y trazas con OpenTelemetry
- ⬜ Evaluación: saber si un cambio de prompt mejora o empeora al agente

### Fase D: producción en AWS
- ⬜ RAG con Bedrock Knowledge Bases
- ⬜ Despliegue (Lambda y/o Bedrock AgentCore) con sesiones y memoria administradas

### Fase E: proyecto integrador
- ⬜ Un sistema completo que combine lo anterior, listo para demostrar

> Si encuentro un tema nuevo que valga la pena, lo evalúo y decido en qué punto de la ruta entra.

---

## 6. Ejercicios completados

| # | Tema | Qué construí | Ideas clave |
|---|---|---|---|
| 1 | Primer agente con tools | Calculadora y conversor MXN/USD; una consulta que encadena 3 tool calls (100 MXN → USD, + 50.44 USD → MXN) | El loop agente → tool → respuesta; la `description` del tool es lo que el modelo lee; cómo interpretar `AgentResult` (ciclos, tokens, métricas por tool) |
| 1b | Manejo de errores | Tools blindados: whitelist con regex antes del `eval`, validación de resultados (`Infinity`), montos negativos, `z.enum` | El catch debe devolver texto útil al modelo; validar antes que capturar |
| 2–3 | Structured output | Resultado tipado de una conversión y un registro de gastos multi-moneda con arreglo anidado y validadores | `structured_output_model` (Python) y `structuredOutputSchema` (TS); un schema no garantiza que el modelo no se equivoque al sumar |
| 4 | Streaming | Mismo agente emitiendo texto y eventos de tools en tiempo real | `stream_async` / `stream`; apagar el printer por defecto; deduplicar eventos por `toolUseId` |
| 5 | MCP | Agente conectado al servidor MCP de documentación de AWS; función fábrica de clientes | Modo administrado vs `with` en Python; `disconnect()` en TypeScript; las descripciones de los tools viajan en cada ciclo |
| 6 | Agents-as-tools | Orquestador con tres especialistas (monedas, documentación AWS, precios AWS vía MCP) | `as_tool` / `asTool`; aislamiento de contexto; métricas por instancia; `preserveContext` |
| 7 | Swarm | Equipo arquitecto → analista de costos ⇄ revisor que estima el costo de una arquitectura serverless | Handoffs; límites para evitar bucles; streaming de eventos del swarm; el agente ignoró una regla de "no inventar tarifas" |
| 8 | Graph | El mismo equipo como flujo con revisión condicional y bucle de corrección | Aristas condicionales; etiquetas únicas para las condiciones; límites de ejecución; diferencias entre SDKs |

---

## 7. Patrones multi-agente: comparativa

| | Agents-as-tools | Swarm | Graph |
|---|---|---|---|
| **Quién decide el siguiente paso** | El orquestador (LLM) | Cada agente, por handoff (LLM) | Tú, con aristas y condiciones (código) |
| **Previsibilidad** | Media | Baja | Alta |
| **Flexibilidad** | Alta | Muy alta | Media |
| **Memoria entre agentes** | Cada especialista tiene su historial; el orquestador solo le manda un texto | Contexto compartido (Python) o mensaje de handoff (TS) | Cada nodo recibe la tarea original más las salidas de sus dependencias |
| **Riesgo principal** | El orquestador reformula mal el mensaje | Bucles y recorridos inesperados | Condiciones frágiles que leen texto de un LLM |
| **Cuándo usarlo** | Delegar tareas bien separadas | Colaboración donde el camino depende de lo que se vaya encontrando | Procesos donde el orden y las reglas importan |

**Diferencias entre SDKs que me tocó descubrir**

- Python usa semántica **OR** al unir ramas; TypeScript usa **AND** (espera a todas).
- Al exceder límites de ejecución, Python devuelve un resultado fallido y TypeScript lanza una excepción. Con fallos de un nodo ocurre lo contrario.
- El estado de un nodo que se revisita se acumula en Python salvo que se active `reset_on_revisit`; en TypeScript se reinicia por defecto.
- Los handoffs de un Swarm usan un tool inyectado en Python y salida estructurada en TypeScript.

---

## 8. Hallazgos con datos

Estas son observaciones de mis propias corridas. Son muestras pequeñas, útiles para entender, no para generalizar.

- **El cuello de botella no eran las tools.** En un agente único con el MCP de precios, las tools sumaron unos 4 s de 26.7 s. El resto fueron 9 ciclos de razonamiento.
- **Los resultados grandes de tools se pagan en cada ciclo.** Tras una respuesta voluminosa, el input del modelo saltó de ~13k a ~56k tokens y se reenvió en todos los ciclos siguientes: ~390k tokens de entrada en total.
- **Un orquestador con especialistas mantuvo su propio contexto liviano** (2 ciclos, ~3.8k tokens reportados), porque nunca vio el JSON de precios. Ojo: esa cifra es la del orquestador; para el costo total hay que medir también a los especialistas.
- **Las instrucciones del prompt son restricciones blandas.** Un agente inventó una tarifa pese a la regla de no hacerlo, aunque el valor coincidía con la realidad. Que el dato sea correcto empeora el problema: no se puede verificar su origen. Además observé que un agente tendía a usar las tools que ya conocía en lugar de seguir la instrucción de recurrir a otra fuente.
- **Los servidores MCP pueden tener efectos secundarios.** El servidor de precios generó un archivo `.md` sin que nadie lo pidiera, porque el agente tenía a su alcance la tool que lo escribe. Solución: dar a cada agente solo las tools que necesita.
- **`preserveContext` no mostró diferencia** en mis pruebas simples, porque el orquestador ya recordaba la conversación y reformulaba los mensajes completos.
- **Swarm vs Graph:** consumo de tokens parecido; en mis corridas el Graph respondió más rápido.

---

## 9. Problemas comunes y cómo los resolví

| Problema | Causa | Solución |
|---|---|---|
| `NoCredentialsError` | boto3 no encuentra credenciales | `aws configure` y verificar con `aws sts get-caller-identity` |
| `the client session is currently running` | Usar `with mcp_client:` sobre un cliente que ya administra un agente | No mezclar los dos modos con la misma instancia |
| El script termina pero la terminal queda colgada | El subproceso del servidor MCP mantiene vivo el proceso | `disconnect()` en un `finally`, con un tiempo máximo de espera |
| Traceback largo de Python al hacer Ctrl+C | La señal llega también al servidor MCP hijo | Es ruido de apagado, no un error del código |
| `This expression is not constructable` | Anotar una clase con su nombre describe una **instancia**, no el constructor | `typeof Clase`, un tipo constructor o, mejor, una función fábrica |
| Los tools parecen ejecutarse "de más" | Un evento de streaming llega muchas veces por llamada | Deduplicar por `toolUseId` y verificar con un contador dentro del tool |
| Una arista condicional dispara las dos ramas | Texto que contiene a otro ("aprobado" ⊂ "no aprobado") | Etiquetas únicas como `[[APROBADO]]` y `[[RECHAZADO]]` |

---

## 10. Seguridad y buenas prácticas

- **Credenciales:** nunca en el código ni en el repositorio. Añade a `.gitignore`: `.env`, `venv/`, `node_modules/` y cualquier archivo generado por agentes.
- **Tarifas y precios de los ejemplos:** son simulados. No usarlos para decisiones reales.
- **`eval` / `Function`:** solo se usaron con una lista blanca de caracteres para fines didácticos. No son aptos para producción sin un sandbox.
- **Servidores MCP:** ejecutan código en tu máquina con tus permisos y sus descripciones entran al prompt. Usa fuentes confiables y limita las tools que expones a cada agente.
- **Datos personales:** en casos como reclutamiento o soporte, requieren cuidado de privacidad y aprobación humana en decisiones que afecten a personas.
- **Límites en todo bucle:** número máximo de ejecuciones y tiempo máximo, siempre.

---

## 11. Ideas de aplicación

Lo aprendido apunta a casos concretos que quiero explorar:

- **Asistentes por WhatsApp Business** para reclutamiento (clasificar candidatos, agendar entrevistas) y servicio al cliente (clasificar la consulta y rutearla a un especialista). El patrón Graph encaja bien porque el enrutamiento es explícito y auditable.
- **Procesamiento de documentos con revisión:** un flujo de extracción → validación → reporte con bucle de corrección.
- **Estimadores y analistas internos** que combinan tools propios con servidores MCP de documentación o precios.

---

## 12. Próximos pasos

1. **Hooks:** controles deterministas dentro del ciclo del agente (por ejemplo, bloquear una respuesta con una tarifa no proveniente de un tool).
2. Gestión de contexto y memoria para controlar el crecimiento de tokens.
3. Human-in-the-loop con interrupts.
4. Observabilidad y evaluación, para medir mejoras con datos.
5. RAG y despliegue en AWS.
6. Proyecto integrador.

---

## 13. Recursos

- [Strands Agents: sitio y documentación](https://strandsagents.com/)
- [Instalación de AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [uv: documentación](https://docs.astral.sh/uv/)
- [Structured output](https://strandsagents.com/docs/user-guide/concepts/agents/structured-output/)
- [Herramientas MCP](https://strandsagents.com/docs/user-guide/concepts/tools/mcp-tools/)
- [Agents as tools](https://strandsagents.com/docs/user-guide/concepts/multi-agent/agents-as-tools/)
- [Swarm](https://strandsagents.com/docs/user-guide/concepts/multi-agent/swarm/)
- [Graph](https://strandsagents.com/docs/user-guide/concepts/multi-agent/graph/)
- [Referencia de la API de TypeScript](https://strandsagents.com/docs/api/typescript/)
- [Repositorio del SDK de TypeScript](https://github.com/strands-agents/sdk-typescript)

---

*Este repositorio es un diario de aprendizaje: algunas decisiones se corrigieron en el camino, y eso es parte del valor.*
