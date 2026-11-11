"""Verifica el entorno de la Fase 0.

Uso (con el entorno virtual activado):
    python scripts/verificar_entorno.py
"""
import os
import shutil
import subprocess
import sys

problemas = 0


def check(nombre, funcion):
    """Ejecuta una verificación e imprime ✅ o ❌ sin detener el resto."""
    global problemas
    try:
        detalle = funcion()
        print(f"✅ {nombre}: {detalle}")
    except Exception as e:  # noqa: BLE001 - queremos reportar cualquier fallo
        problemas += 1
        print(f"❌ {nombre}: {e}")


def version_de(comando, minimo=None):
    ruta = shutil.which(comando)
    if not ruta:
        raise RuntimeError(f"no se encontró '{comando}' en el PATH")
    salida = subprocess.run([ruta, "--version"], capture_output=True, text=True, timeout=30)
    texto = (salida.stdout or salida.stderr).strip()
    if minimo is not None:
        digitos = "".join(c for c in texto.split(".")[0] if c.isdigit())
        if not digitos or int(digitos) < minimo:
            raise RuntimeError(f"{texto} (se requiere versión {minimo} o superior)")
    return texto


def python_ok():
    if sys.version_info < (3, 10):
        raise RuntimeError(f"{sys.version.split()[0]} (se requiere 3.10 o superior)")
    return sys.version.split()[0]


def uvx_ok():
    ruta = shutil.which("uvx")
    if not ruta:
        raise RuntimeError("no se encontró 'uvx' en el PATH (reabre la terminal tras instalar uv)")
    return ruta


def strands_ok():
    import strands  # noqa: F401

    return getattr(strands, "__version__", "instalado")


def credenciales_ok():
    import boto3

    sesion = boto3.session.Session()
    if not sesion.region_name:
        raise RuntimeError("no hay región configurada (define AWS_REGION o corre 'aws configure')")
    identidad = sesion.client("sts").get_caller_identity()
    return f"autenticado en la región {sesion.region_name} (cuenta terminada en {identidad['Account'][-4:]})"


def bedrock_ok():
    from strands import Agent

    model_id = os.environ.get("MODEL_ID") # Define el modelo segun la disponibilidad que tengas aqui
    if not model_id:
        raise RuntimeError("define la variable de entorno MODEL_ID")
    agente = Agent(model=model_id, callback_handler=None)
    respuesta = str(agente("Responde únicamente con la palabra: ok"))
    return f"el modelo respondió: {respuesta.strip()[:40]}"


print("Verificando el entorno de la Fase 0...\n")
check("Python", python_ok)
check("Node.js", lambda: version_de("node", minimo=20))
check("npm", lambda: version_de("npm"))
check("Git", lambda: version_de("git"))
check("AWS CLI", lambda: version_de("aws", minimo=2))
check("uv", lambda: version_de("uv"))
check("uvx", uvx_ok)
check("SDK de Strands (Python)", strands_ok)
check("Credenciales de AWS", credenciales_ok)
check("Amazon Bedrock (llamada real al modelo)", bedrock_ok)

print()
if problemas:
    print(f"Hay {problemas} problema(s). Revisa la sección 'Problemas frecuentes en la Fase 0' del README.")
    sys.exit(1)
print("Todo listo. Puedes empezar con los ejercicios.")