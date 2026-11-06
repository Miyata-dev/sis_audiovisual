# Sistema Audiovisual para CORES

Plataforma web para el Gobierno Regional del Biobío que permite transmitir sesiones en vivo, gestionar votaciones del consejo y consultar un historial de sesiones con video, acta y transcripción. Incluye un chat con inteligencia artificial para resolver dudas sobre el contenido de cada sesión.

Proyecto de la Unidad 2 del curso Administración de Redes y Sistemas Computacionales, Universidad de Talca.

**Integrantes:** Carlos Hormazabal, Vicente Farías

---

## Arquitectura

El sistema se despliega en Google Cloud con una arquitectura Serverless basada en contenedores:

| Componente | Tecnología | Función |
|---|---|---|
| Balanceador de carga | Cloud Load Balancing | Único punto de entrada desde Internet (IP estática). Enruta `/api/*` al backend y el resto al frontend |
| `frontend` | React + Nginx (Cloud Run) | Interfaz web |
| `backend` | NestJS (Cloud Run) | Lógica de negocio, coordina el resto de los servicios |
| `ia-service` | FastAPI + faster-whisper (Cloud Run) | Transcripción de videos y chat sobre las transcripciones |
| `ollama` | Ollama, modelo llama3.2:3b (Cloud Run) | Modelo de lenguaje que responde las consultas |
| `grafana` | Grafana 11.6.0 (Cloud Run) | Monitoreo y visualización de logs |
| Base de datos | Cloud SQL PostgreSQL | Persistencia, solo con IP privada |
| Archivos multimedia | Cloud Storage | Videos, actas, transcripciones y respaldos |
| VM de monitoreo | Compute Engine | Bastión SSH hacia la base de datos y ejecución de respaldos |
| CI/CD | GitHub, Cloud Build, Artifact Registry | Construcción y despliegue automático de las imágenes |
| Secretos | Secret Manager | Credenciales y claves, fuera del repositorio |

## Estructura del repositorio

```
/
├── docs/              Documentación y diagramas
├── services/
│   ├── frontend/      React + Nginx
│   ├── backend/       NestJS
│   ├── ai-service/    FastAPI + faster-whisper
│   └── ollama/        Modelo llama3.2:3b
├── infrastructure/
│   └── monitoring/    Grafana (datasources y dashboards)
```

Cada servicio tiene su propio `Dockerfile` y se construye y despliega de forma independiente.

## Redes y seguridad

- **Punto de entrada único:** frontend y backend tienen ingress "Interno + Load Balancing", por lo que solo reciben tráfico a través del balanceador.
- **Comunicación entre servicios:** `ia-service` y `ollama` exigen autenticación IAM. El servicio llamador envía un token de identidad OIDC de Google, y solo la cuenta de servicio con el rol Cloud Run Invoker puede invocarlos (backend → ia-service → ollama).
- **Base de datos:** Cloud SQL solo tiene IP privada. El backend accede mediante Direct VPC egress a la VPC `private-network`.
- **Administración:** el acceso a la base de datos se hace por SSH a través de la VM de monitoreo, que actúa como bastión dentro de la red privada.
- **Archivos:** la subida y reproducción de videos se hace directamente contra Cloud Storage mediante URLs firmadas, sin pasar por la memoria del backend.
- **Grafana:** requiere inicio de sesión. El acceso anónimo está deshabilitado y la contraseña de administrador se guarda en Secret Manager.
- **Credenciales:** ningún secreto se guarda en el repositorio. Los archivos `.env` están excluidos con `.gitignore`.

## Monitoreo

Grafana se conecta a Cloud Monitoring y Cloud Logging. El dashboard "Sistema Audiovisual - Estado general" incluye:

- Tarjetas ACTIVO (ONLINE) / INACTIVO (OFFLINE) por servicio: frontend, backend, ollama, ia-service y PostgreSQL.
- Gráficos de requests, instancias, memoria, CPU y latencia p95 por servicio.
- Logs separados por servicio y un panel de logs de errores.

El dashboard está versionado en `infrastructure/monitoring/grafana-cloud/dashboards/` y se despliega con la imagen de Grafana.

## Despliegue

Cada push a la rama principal dispara un trigger de Cloud Build que construye la imagen del servicio correspondiente, la sube a Artifact Registry y la despliega en Cloud Run. La orquestación (despliegue, escalado y reemplazo de instancias que fallan) la realiza Cloud Run, por lo que no se usa un orquestador adicional.

---

# Toma de decisiones

## Infraestructura

Se optó por una arquitectura Serverless utilizando Google Cloud Run, en lugar de la infraestructura anterior basada en máquinas virtuales. La arquitectura serverless es superior principalmente por la reducción de costos operacionales, la escalabilidad automática y la simplificación de la administración de la infraestructura.

## Tecnologías

### Grafana

Se utiliza para centralizar la observabilidad y el monitoreo visual del sistema. En una arquitectura de múltiples servicios es necesario un panel de control en tiempo real para vigilar la salud de los contenedores, el consumo de recursos y rastrear errores, con los registros centralizados en un solo lugar.

### Docker

Se justifica por su capacidad de garantizar portabilidad, aislamiento y consistencia. Resuelve el problema de "en mi computadora sí funciona" al empaquetar cada aplicación con exactamente las dependencias que necesita.

### Ollama

Permite ejecutar modelos de lenguaje en infraestructura propia. Su uso se justifica porque elimina el pago por uso a APIs de terceros, reduce la latencia al procesar la información dentro del mismo sistema y mantiene los datos de las sesiones bajo control del proyecto, un factor importante si se procesa información audiovisual interna de una institución.

### Google Cloud Run

Se utiliza por su despliegue sin servidor y su escalabilidad automática. Permite ejecutar contenedores Docker sin preocuparse por el sistema operativo ni por mantener o actualizar servidores. Además, es eficiente en costos: si la plataforma recibe un pico de usuarios, crea automáticamente más copias de los servicios para soportar la carga y, si nadie la está usando, se reduce a cero.

### Cloud Storage (buckets)

Los buckets son la solución para el almacenamiento persistente de los archivos multimedia. Como los contenedores son efímeros y no comparten disco, los archivos se guardan en un servicio de almacenamiento seguro, económico y de capacidad prácticamente ilimitada. Esto eliminó los problemas de sincronización de la versión anterior, donde cada máquina virtual tenía su propio directorio de archivos.

### Cloud SQL

Base de datos PostgreSQL administrada, con respaldos y mantenimiento gestionados por Google. Se mantiene en la red privada y solo con IP privada, para que no sea accesible desde Internet.

### Cloud Build y Artifact Registry

Automatizan la construcción y el despliegue de los contenedores a partir de cada cambio en el repositorio, lo que evita despliegues manuales y deja un registro versionado de las imágenes.

### Secret Manager

Guarda las credenciales y claves del sistema fuera del código y del repositorio, y las entrega a los servicios en tiempo de ejecución.

### Máquina virtual de monitoreo (bastión)

Es la única máquina virtual que se conserva. Permite administrar por SSH la base de datos que está en la red privada y ejecutar los respaldos hacia Cloud Storage.