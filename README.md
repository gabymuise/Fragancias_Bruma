# Fragancias Bruma

Control de stock y ganancias con HTML, CSS, JavaScript y Supabase. Preparado para el Worker existente `fragancias-bruma`.

## Archivos que podés subir a GitHub

**Todo el contenido de esta carpeta está preparado para subir al repositorio.** No incluye respaldos del negocio, contraseñas ni correos personales. `public/js/config.js` contiene únicamente la URL de Supabase y su clave publicable. El control de acceso depende de las políticas SQL y de los usuarios autorizados.

| Ruta | Contenido |
| --- | --- |
| `public/index.html` | Estructura principal, pantalla de acceso y formularios. |
| `public/css/base.css` | Colores, tipografía y componentes. |
| `public/css/tables.css` | Tablas, desplazamiento, acciones y paginación. |
| `public/css/responsive.css` | Adaptación a celular, tablet e impresión. |
| `public/js/config.js` | URL de Supabase y clave publicable. |
| `public/js/core/state.js` | Estado, categorías, utilidades y preferencias de página. |
| `public/js/core/calculations.js` | Validaciones, stock y cálculos del negocio. |
| `public/js/components/ui.js` | Componentes comunes, tablas, avisos y renderizado. |
| `public/js/components/forms.js` | Formularios de alta y edición. |
| `public/js/pages/resumen.js` | Indicadores y resultados mensuales. |
| `public/js/pages/productos.js` | Tabla de productos. |
| `public/js/pages/compras.js` | Tabla de compras. |
| `public/js/pages/decants.js` | Tabla de preparaciones. |
| `public/js/pages/ventas.js` | Tabla de ventas y márgenes. |
| `public/js/pages/gastos.js` | Tabla de gastos. |
| `public/js/pages/ajustes.js` | Tabla de ajustes. |
| `public/js/pages/guia.js` | Guía de uso, importación y respaldos. |
| `public/js/pages/registros.js` | Búsqueda y paginación comunes a las listas. |
| `public/js/services/supabase.js` | Sesiones, lectura, guardado y control de conflictos. |
| `public/js/router.js` | Navegación entre secciones y rutas. |
| `public/js/events.js` | Botones, búsquedas, importación y eventos de navegación. |
| `public/js/app.js` | Inicio de la aplicación. |
| `database/01_instalar.sql` | Instalación de tablas y permisos. |
| `database/02_autorizar_usuarios.example.sql` | Ejemplo de autorización, sin correos reales. |
| `wrangler.jsonc` | Configuración de Cloudflare Workers; publica solo `public/`. |
| `.gitignore` | Excluye respaldos, configuración privada y archivos temporales. |
| `.gitattributes` | Normaliza finales de línea para trabajar desde Windows. |

Las páginas comparten un único HTML y tienen archivos JavaScript propios. La navegación usa rutas como `/#/productos`, `/#/ventas` y `/#/guia`. Funciona con Atrás/Adelante y permite recargar cada sección sin configurar rutas en el servidor. Los scripts se cargan en el orden indicado en `index.html`; no requiere React, PHP, npm install ni un paso de compilación.

## Qué cambió en las tablas

- El panel ocupa el ancho disponible y las tablas anchas se desplazan dentro de su contenedor.
- Los textos largos pueden ocupar varias líneas.
- En escritorio, los botones de acciones permanecen visibles a la derecha al desplazar la tabla.
- En pantallas de hasta 800 px, las filas se presentan como tarjetas con etiquetas: no se ocultan columnas ni importes.
- Las listas incluyen páginas de 10, 25 o 50 registros y mantienen su buscador.
- Las búsquedas reinician la paginación; si se eliminan registros, el número de página se ajusta.

## Reemplazar tu estructura actual

1. En la web que usás actualmente, exportá un respaldo antes de cambiar archivos.
2. Conservá tus SQL personalizados y `respaldo_inicial.json` **fuera del repositorio**, por ejemplo en otra carpeta privada del escritorio. Este ZIP no los necesita para funcionar.
3. Extraé este ZIP en una carpeta nueva. Usá su contenido como nueva raíz del repositorio `Fragancias_Bruma`; `public/` y `wrangler.jsonc` deben quedar directamente en la raíz del repositorio, no dentro de otra carpeta contenedora.
4. El HTML que ahora se publica es `public/index.html`. El antiguo `index.html` de la raíz ya no se usa. No mantengas un segundo `wrangler.toml` o `wrangler.json` que compita con el `wrangler.jsonc` incluido: conservá una copia de tu configuración anterior fuera del repositorio si necesitás consultarla.
5. Si los respaldos o el SQL con correos reales ya estaban versionados, movelos fuera del repositorio y registrá su retiro del seguimiento de Git. `.gitignore` no deja de seguir archivos previamente agregados ni borra el historial. Si subís archivos desde la interfaz web de GitHub, no arrastres tus archivos privados: esa interfaz no aplica `.gitignore` por vos.

## Publicar en Cloudflare

En el proyecto existente `fragancias-bruma`, verificá:

| Ajuste | Valor |
| --- | --- |
| Rama de producción | La que uses actualmente, por ejemplo `main`. |
| Root directory | Raíz del repositorio (`/`). |
| Build command | Vacío / None. |
| Deploy command | `npx wrangler deploy`. |

Wrangler lee `wrangler.jsonc` y publica **solo `public/`**. No uses `--assets .` ni `--assets ./` porque publicarían la raíz completa. Si tu configuración anterior tenía ese argumento, reemplazá el comando por `npx wrangler deploy`.

La dirección sigue siendo la del Worker existente:
https://fragancias-bruma.gabrielmuise765.workers.dev/

Esperá el estado exitoso y recargá con Ctrl+F5. Revisá que carguen los archivos CSS y JavaScript. Este paquete no realizó un despliegue ni modificó tu repositorio remoto.

Referencia de la configuración: https://developers.cloudflare.com/workers/static-assets/binding/

## Supabase: continuar con lo que ya configuraste

**Esta reorganización no requiere cambiar el esquema ni borrar datos.** Si ya ejecutaste el primer SQL y autorizaste a ambos usuarios, conservá esa configuración e ingresá normalmente.

Si falta autorizar las cuentas, hacé una copia local del ejemplo llamada `database/02_autorizar_usuarios.sql`, reemplazá los correos y ejecutala en Supabase SQL Editor. Esa copia personalizada está excluida por `.gitignore`.

La tabla `bruma_state` guarda el estado completo como JSONB y controla versiones concurrentes. `bruma_members` define quién puede acceder. No se agregaron nuevas tablas. Los productos, ventas y ganancias conservan las reglas anteriores.

La información solo se carga después de iniciar sesión con un usuario autorizado. El guardado requiere conexión, y los cambios se consultan cada 15 segundos mientras no haya un formulario abierto. Si otra persona guardó primero, actualizá antes de repetir tu operación.

## Recuperar los datos anteriores

Si la base todavía está vacía, iniciá sesión y entrá en **Guía → Importar respaldo**. Seleccioná tu respaldo más reciente. Importar reemplaza el estado compartido para ambos usuarios; no combina archivos.

`respaldo_inicial.json` del paquete anterior es una carga inicial y puede no incluir cambios recientes. No lo subas a GitHub ni lo coloques en `public/`.

## Probar localmente

Desde esta carpeta, si tenés Python instalado en Windows:

```powershell
py -m http.server 5500 --directory public
```

Abrí http://localhost:5500/. También podés servir `public/` con tu servidor estático habitual. La aplicación está configurada con tu Supabase real: cualquier cambio que guardes con una cuenta autorizada modifica los datos compartidos.

Para verificar la presentación, recorré Productos, Compras y Ventas a ancho completo y en la vista móvil del navegador. En móvil, cada tarjeta tiene todos los campos. En escritorio, las tablas grandes incluyen una barra horizontal propia.

## Validación realizada

Se verificó la sintaxis de todos los archivos JavaScript, las referencias a archivos locales y la generación de las ocho páginas. Con datos y Supabase simulados se probaron productos, compras, decants, ventas, gastos, ajustes, búsqueda, paginación, conservación de cálculos, stock insuficiente, errores de red, conflictos de versión y cierre de sesión.

La vista local fue bloqueada por el navegador del entorno de preparación; no se pudo completar la inspección visual en navegador. No se realizaron operaciones contra tu base real. La comprobación visual final y el inicio de sesión real deben hacerse después de publicar.
