# Guía para crear y publicar un proyecto web

## Desarrollo de pequeñas aplicaciones de software

**Liceo Unesco — Curso lectivo 2026**

## 1. Descripción de la tarea

Cada estudiante deberá desarrollar una pequeña aplicación o juego web utilizando:

- HTML para organizar el contenido.
- CSS para crear el diseño visual.
- JavaScript para programar el comportamiento del proyecto.

El proyecto se publicará como un micrositio dentro de la galería de proyectos del curso. Cada carpeta funciona como un sitio independiente y puede abrirse directamente desde GitHub Pages.

Cuando la carpeta se agrega al repositorio, la galería busca automáticamente las carpetas que contienen un archivo `index.html` y las muestra como tarjetas. No es necesario modificar manualmente el archivo principal de la galería.

## 2. Objetivo

Crear una aplicación web pequeña, funcional, comprensible y fácil de utilizar que demuestre el uso de:

- Estructura HTML semántica.
- Estilos CSS.
- Variables, condiciones, ciclos y funciones en JavaScript.
- Eventos del usuario, como clics, teclado o controles táctiles.
- Manipulación de elementos de la página.
- Organización correcta de archivos y carpetas.

## 3. Estructura obligatoria

El nombre de la carpeta principal debe identificar el proyecto. Utilice letras minúsculas y evite espacios, tildes y caracteres especiales.

Ejemplo:

```text
memoria-animales/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── img/
    ├── carta-leon.png
    └── carta-tigre.png
```

Requisitos de la estructura:

- `index.html` debe encontrarse directamente dentro de la carpeta del proyecto.
- Los estilos deben guardarse en `css/styles.css`.
- El código JavaScript debe guardarse en `js/app.js`.
- Las imágenes deben guardarse en la carpeta `img`.
- No utilice rutas que comiencen con `C:\`, `/home/`, `file://` u otra ubicación de su computadora.
- Todas las rutas deben ser relativas.

Ejemplos de rutas correctas:

```html
<link rel="stylesheet" href="./css/styles.css">
<script src="./js/app.js" defer></script>
<img src="./img/carta-leon.png" alt="Carta con la imagen de un león">
```

## 4. Archivo `index.html`

El archivo `index.html` es el punto de entrada del proyecto. Debe incluir idioma, codificación, adaptación para dispositivos móviles y metadatos descriptivos.

Utilice esta base:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <meta
    name="description"
    content="Juego de memoria sobre animales creado por Ana Pérez, sección 11-1."
  >

  <meta name="author" content="Ana Pérez">
  <meta name="theme-color" content="#1d4ed8">

  <title>Memoria de animales</title>

  <link rel="stylesheet" href="./css/styles.css">
  <script src="./js/app.js" defer></script>
</head>

<body>
  <header>
    <h1>Memoria de animales</h1>
    <p>Encuentre todas las parejas antes de que termine el tiempo.</p>
  </header>

  <main>
    <!-- Contenido principal del juego -->
  </main>

  <footer>
    <p>Creado por Ana Pérez — Sección 11-1</p>
  </footer>
</body>
</html>
```

### Metadatos requeridos

Cada proyecto debe incluir como mínimo:

```html
<html lang="es">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Descripción breve y específica del proyecto.">
<meta name="author" content="Nombre del estudiante">
<title>Nombre comprensible del proyecto</title>
```

La galería utiliza el contenido de `<title>` como nombre de la tarjeta y puede utilizar `description` como explicación del proyecto. Por eso no deben utilizarse títulos como “Proyecto”, “Página web” o “Sin título”.

Ejemplo adecuado:

```html
<title>Trivia de ciencias naturales</title>
<meta
  name="description"
  content="Trivia interactiva con preguntas de ciencias naturales y marcador de puntos."
>
```

## 5. Imagen de presentación

Puede agregar una imagen de presentación dentro de la carpeta principal. Debe llamarse de una de estas formas:

- `preview.png`
- `preview.jpg`
- `preview.jpeg`
- `preview.webp`

Ejemplo:

```text
memoria-animales/
├── index.html
├── preview.png
├── css/
├── js/
└── img/
```

Recomendaciones para la imagen:

- Resolución recomendada: 1200 × 675 píxeles.
- Formato horizontal.
- Debe mostrar claramente el juego o aplicación.
- No debe incluir información privada.
- Se recomienda comprimirla para evitar que pese demasiado.

La imagen es opcional. Si no existe, la galería mostrará un ícono genérico.

## 6. Requisitos funcionales

El proyecto debe:

- Abrir sin errores desde `index.html`.
- Tener instrucciones visibles y fáciles de comprender.
- Incluir un botón claro para comenzar o reiniciar.
- Informar al usuario qué debe hacer.
- Mostrar el resultado, puntaje, progreso o estado de la actividad.
- Responder correctamente a las acciones del usuario.
- Evitar botones o enlaces que no funcionen.
- Adaptarse a computadoras y teléfonos celulares.
- utilizar texto legible y colores con suficiente contraste.
- Tener nombres claros en botones, por ejemplo, “Iniciar juego”, “Comprobar respuesta” o “Jugar de nuevo”.

## 7. Requisitos de accesibilidad y facilidad de uso

El proyecto será visitado por personas con diferentes niveles de experiencia digital. Por esa razón:

- Utilice una letra de al menos 16 píxeles para el contenido normal.
- Evite instrucciones únicamente mediante colores.
- Agregue texto alternativo a las imágenes importantes.
- Utilice elementos `<button>` para las acciones y no elementos `<div>`.
- Asocie cada `<label>` con su campo de formulario.
- Mantenga botones suficientemente grandes para pantallas táctiles.
- Muestre mensajes claros cuando el usuario gana, pierde o comete un error.
- No reproduzca sonidos automáticamente.
- Incluya una opción para activar o desactivar el sonido si el proyecto lo utiliza.
- Evite movimientos rápidos, luces intermitentes o animaciones excesivas.

Ejemplo de imagen accesible:

```html
<img
  src="./img/tortuga.png"
  alt="Tortuga verde utilizada como personaje principal"
>
```

Ejemplo de campo correctamente identificado:

```html
<label for="nombreJugador">Nombre del jugador</label>
<input id="nombreJugador" type="text" autocomplete="name">
```

## 8. Reglas para el código

- Utilice nombres descriptivos para variables y funciones.
- Escriba el código en español o mantenga un solo idioma de manera consistente.
- Evite copiar código que no pueda explicar.
- Divida los problemas grandes en funciones pequeñas.
- Incluya comentarios solamente cuando ayuden a comprender una decisión importante.
- No coloque todo el CSS dentro de `index.html`.
- No coloque todo el JavaScript dentro de `index.html`.
- Revise la consola del navegador y corrija los errores antes de entregar.
- No incluya contraseñas, claves de API, números de teléfono, direcciones ni otros datos privados.

Ejemplo de nombres claros:

```javascript
let puntajeActual = 0;

function aumentarPuntaje(cantidad) {
  puntajeActual += cantidad;
  mostrarPuntaje();
}
```

## 9. Cómo probar el proyecto

No se recomienda abrir la galería principal haciendo doble clic en `index.html`, porque los navegadores restringen algunas solicitudes cuando la dirección comienza con `file://`.

Utilice un servidor local, por ejemplo la extensión **Live Server** de Visual Studio Code:

1. Abra la carpeta completa del repositorio en Visual Studio Code.
2. Instale la extensión Live Server si todavía no está disponible.
3. Presione el botón **Go Live**.
4. Abra la dirección que inicia con `http://localhost` o `http://127.0.0.1`.
5. Pruebe la portada y después abra su proyecto desde la tarjeta.

También puede probar directamente el micrositio con Live Server desde su propio `index.html`.

Antes de entregar, compruebe:

- Que no existan errores en la consola del navegador.
- Que todas las imágenes aparezcan.
- Que los botones funcionen.
- Que sea posible reiniciar la actividad.
- Que el proyecto se pueda utilizar desde un teléfono.
- Que los textos no se salgan de la pantalla.
- Que el título y la descripción sean correctos.

## 10. Entrega del proyecto

La entrega consiste en una sola carpeta con todos los archivos del micrositio.

Proceso:

1. Seleccione un nombre corto para la carpeta.
2. Compruebe que la carpeta contiene `index.html`.
3. Revise que las rutas sean relativas.
4. Pruebe el proyecto con un servidor local.
5. Agregue opcionalmente una imagen `preview`.
6. Suba la carpeta completa al nivel principal del repositorio.
7. Espere a que GitHub Pages publique los cambios.
8. Abra la galería y confirme que la nueva tarjeta aparezca.
9. Abra la tarjeta y realice una última prueba.

Ejemplo correcto dentro del repositorio:

```text
proyectos_info_2026/
├── index.html
├── css/
├── js/
├── memoria-animales/
│   ├── index.html
│   ├── preview.png
│   ├── css/
│   ├── js/
│   └── img/
└── trivia-ciencias/
    ├── index.html
    ├── css/
    └── js/
```

No coloque un proyecto dentro de la carpeta de otro estudiante.

## 11. Lista de verificación

Antes de entregar, marque cada punto:

- [ ] La carpeta tiene un nombre breve, sin espacios ni tildes.
- [ ] Existe un archivo `index.html` en la raíz de la carpeta.
- [ ] Existe la carpeta `css` con `styles.css`.
- [ ] Existe la carpeta `js` con `app.js`.
- [ ] Las imágenes están organizadas dentro de `img`.
- [ ] El documento utiliza `lang="es"`.
- [ ] El documento incluye `charset` y `viewport`.
- [ ] El proyecto tiene un `<title>` específico.
- [ ] El proyecto incluye `description` y `author`.
- [ ] El nombre y la sección del estudiante son visibles.
- [ ] Las instrucciones del juego son claras.
- [ ] El proyecto tiene una forma de iniciar y reiniciar.
- [ ] El puntaje o resultado se muestra correctamente.
- [ ] No existen errores en la consola.
- [ ] Los botones funcionan con clic o toque.
- [ ] El diseño funciona en computadora y teléfono.
- [ ] No se incluyeron datos privados ni claves.
- [ ] La tarjeta aparece en la galería publicada.

## 12. Prompt de ayuda para el estudiante

El siguiente prompt puede utilizarse con un asistente de inteligencia artificial. Reemplace la información entre corchetes antes de enviarlo.

```text
Actúa como tutor de desarrollo web para un estudiante de secundaria.

Estoy creando un proyecto llamado [NOMBRE DEL PROYECTO]. Su objetivo es
[EXPLICAR QUÉ HACE EL JUEGO O APLICACIÓN].

Debo utilizar únicamente HTML, CSS y JavaScript sin frameworks. La estructura
obligatoria es:

[nombre-del-proyecto]/
├── index.html
├── css/styles.css
├── js/app.js
└── img/

Requisitos de mi proyecto:
- Debe funcionar en computadora y teléfono.
- Debe tener instrucciones claras.
- Debe incluir un botón para iniciar y otro para reiniciar.
- Debe mostrar el puntaje, resultado o progreso.
- Debe ser accesible y fácil de utilizar.
- El HTML debe incluir title, description, author y viewport.
- Debo entender y poder explicar el código.

En este momento necesito ayuda con [DESCRIBIR EL PROBLEMA CONCRETO].

Este es mi código actual:
[PEGAR SOLAMENTE EL CÓDIGO RELACIONADO CON EL PROBLEMA]

Ayúdame de esta manera:
1. Explícame primero cuál es la causa del problema con palabras sencillas.
2. Indica en qué archivo debo hacer el cambio.
3. Muéstrame únicamente el código necesario.
4. Explica cómo funciona el código nuevo.
5. Dame pasos para probar que la solución funciona.
6. No agregues bibliotecas ni cambies toda la estructura sin consultarme.
7. Si falta información, hazme una pregunta antes de asumirla.
```

### Recomendación para utilizar inteligencia artificial

La inteligencia artificial puede ayudar a explicar errores, proponer ideas y revisar código. Sin embargo, el estudiante debe:

- Leer y comprender cada cambio.
- Probar el código recibido.
- Modificarlo para adaptarlo a su propio proyecto.
- Poder explicar cómo funciona.
- No compartir información personal.
- No pedir ni copiar una solución completa sin revisarla.

## 13. Posibles juegos o aplicaciones para replicar

### Nivel inicial

1. **Adivina el número:** el sistema elige un número y ofrece pistas.
2. **Piedra, papel o tijera:** el usuario juega contra la computadora.
3. **Lanzamiento de dados:** permite lanzar uno o varios dados y sumar resultados.
4. **Cara o cruz:** simula el lanzamiento de una moneda y registra resultados.
5. **Contador de clics:** mide cuántos clics realiza el jugador durante un tiempo determinado.
6. **Semáforo interactivo:** cambia estados y plantea preguntas sobre seguridad vial.
7. **Calculadora básica:** realiza operaciones y conserva un historial sencillo.
8. **Generador de contraseñas educativas:** explica la importancia de contraseñas seguras sin guardar datos.
9. **Convertidor de unidades:** convierte temperatura, distancia, masa o moneda con valores de práctica.
10. **Ruleta de preguntas:** selecciona preguntas o retos al azar.

### Nivel intermedio

11. **Juego de memoria:** el usuario debe encontrar parejas de cartas.
12. **Trivia educativa:** presenta preguntas, opciones, puntaje y retroalimentación.
13. **Ahorcado:** permite descubrir una palabra antes de agotar los intentos.
14. **Tres en línea:** juego para dos personas o contra la computadora.
15. **Simón dice:** reproduce una secuencia de colores que el usuario debe recordar.
16. **Ordenar palabras:** permite formar una oración colocando palabras en el orden correcto.
17. **Sopa de letras:** el usuario encuentra palabras relacionadas con una materia.
18. **Rompecabezas deslizante:** reorganiza piezas para completar una imagen.
19. **Juego de reacción:** mide cuánto tarda el usuario en responder a una señal.
20. **Atrapa el objeto:** el jugador debe seleccionar objetos que aparecen en posiciones diferentes.
21. **Bingo educativo:** genera cartones y preguntas de matemáticas, idiomas o ciencias.
22. **Clasificación de residuos:** arrastra objetos al contenedor correcto.
23. **Mapa interactivo:** identifica provincias, países, ríos o regiones.
24. **Entrenador de tablas de multiplicar:** presenta operaciones y registra aciertos.

### Nivel avanzado

25. **Juego de la culebra:** controla un personaje, suma puntos y detecta colisiones.
26. **Flappy Bird educativo:** combina obstáculos con preguntas o ejercicios.
27. **Pong:** controla paletas, pelota, colisiones y marcador.
28. **Breakout:** destruye bloques utilizando una pelota y una plataforma.
29. **Buscaminas:** crea un tablero, calcula pistas y detecta minas.
30. **Laberinto:** permite mover un personaje hasta encontrar la salida.
31. **Juego de plataformas sencillo:** incorpora movimiento, saltos y obstáculos.
32. **Carrera de preguntas:** el personaje avanza cuando el usuario responde correctamente.
33. **Defensa matemática:** resuelve operaciones para detener objetos antes de que lleguen a la meta.
34. **Batalla naval:** administra tableros, turnos, barcos e impactos.
35. **Sudoku básico:** valida filas, columnas y regiones.
36. **2048:** combina fichas utilizando controles del teclado o gestos táctiles.

## 14. Ideas para dar valor educativo al juego

Un juego conocido puede adaptarse a un tema educativo:

- Ahorcado con vocabulario de inglés o francés.
- Memoria con elementos químicos y sus símbolos.
- Trivia sobre historia de Costa Rica.
- Flappy Bird con operaciones matemáticas.
- Bingo con conceptos de ciencias.
- Carrera con preguntas de seguridad digital.
- Clasificación de residuos para educación ambiental.
- Mapa interactivo de provincias y cantones.
- Rompecabezas con obras de arte o sitios históricos.
- Simón dice con notas musicales o vocabulario.

El objetivo no es copiar exactamente un producto comercial, sino estudiar su mecánica principal y crear una versión propia, educativa y apropiada para el curso.

## 15. Criterios sugeridos de evaluación

| Criterio | Porcentaje sugerido |
|---|---:|
| Funcionamiento del proyecto | 30 % |
| Uso de JavaScript y lógica | 20 % |
| Organización de archivos y código | 15 % |
| Diseño adaptable y facilidad de uso | 15 % |
| Accesibilidad e instrucciones | 10 % |
| Creatividad y aporte educativo | 10 % |

El proyecto debe ser original, funcional y comprensible para su autor. Una aplicación pequeña que funciona correctamente tiene mayor valor que una aplicación muy grande, incompleta o que el estudiante no pueda explicar.
