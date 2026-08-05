"use strict";

const CONFIGURACION = {
    usuario: "emena2006",
    repositorio: "proyectos_info_2026",
    rama: "main",

    carpetasIgnoradas: [
        ".github",
        "css",
        "js",
        "img",
        "images",
        "assets",
        "recursos",
        "archivos",
        "docs"
    ]
};

const API_BASE = "https://api.github.com/repos";

const contenedorProyectos =
    document.getElementById("contenedorProyectos");

const elementoEstado =
    document.getElementById("estado");

const elementoContador =
    document.getElementById("contador");

const elementoTotal =
    document.getElementById("totalProyectos");

const buscador =
    document.getElementById("buscador");

const selectorOrden =
    document.getElementById("ordenProyectos");

const botonActualizar =
    document.getElementById("botonActualizar");

let proyectos = [];

/**
 * Realiza una consulta a GitHub con un límite
 * de tiempo para evitar que el spinner quede fijo.
 */
async function consultarGitHub(url) {
    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
        controlador.abort();
    }, 12000);

    try {
        const respuesta = await fetch(url, {
            cache: "no-store",
            signal: controlador.signal,
            headers: {
                Accept: "application/vnd.github+json"
            }
        });

        if (!respuesta.ok) {
            throw new Error(
                `GitHub respondió con el código ${respuesta.status}.`
            );
        }

        return await respuesta.json();
    } finally {
        clearTimeout(temporizador);
    }
}

/**
 * Convierte el nombre de carpeta en un título.
 */
function formatearNombre(nombre) {
    const palabrasMinusculas = [
        "de",
        "del",
        "la",
        "las",
        "el",
        "los",
        "y",
        "en",
        "para",
        "con"
    ];

    return nombre
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((palabra, indice) => {
            const minuscula = palabra.toLowerCase();

            if (
                indice > 0 &&
                palabrasMinusculas.includes(minuscula)
            ) {
                return minuscula;
            }

            return (
                minuscula.charAt(0).toUpperCase() +
                minuscula.slice(1)
            );
        })
        .join(" ");
}

/**
 * Determina si una carpeta principal puede ser
 * candidata a proyecto.
 */
function esCarpetaCandidata(elemento) {
    if (elemento.type !== "dir") {
        return false;
    }

    if (elemento.name.startsWith(".")) {
        return false;
    }

    const ignoradas =
        CONFIGURACION.carpetasIgnoradas.map(
            nombre => nombre.toLowerCase()
        );

    return !ignoradas.includes(
        elemento.name.toLowerCase()
    );
}

/**
 * Revisa el contenido de una carpeta y confirma
 * que tenga un archivo index.html.
 */
async function comprobarProyecto(carpeta) {
    try {
        const url =
            `${API_BASE}/` +
            `${CONFIGURACION.usuario}/` +
            `${CONFIGURACION.repositorio}/contents/` +
            `${encodeURIComponent(carpeta.name)}` +
            `?ref=${encodeURIComponent(CONFIGURACION.rama)}`;

        const contenido = await consultarGitHub(url);

        if (!Array.isArray(contenido)) {
            return null;
        }

        const tieneIndex = contenido.some(elemento => {
            return (
                elemento.type === "file" &&
                elemento.name.toLowerCase() === "index.html"
            );
        });

        if (!tieneIndex) {
            return null;
        }

        const tienePreview = contenido.some(elemento => {
            const nombre = elemento.name.toLowerCase();

            return (
                elemento.type === "file" &&
                (
                    nombre === "preview.png" ||
                    nombre === "preview.jpg" ||
                    nombre === "preview.jpeg" ||
                    nombre === "preview.webp"
                )
            );
        });

        const archivoPreview = contenido.find(elemento => {
            const nombre = elemento.name.toLowerCase();

            return (
                elemento.type === "file" &&
                (
                    nombre === "preview.png" ||
                    nombre === "preview.jpg" ||
                    nombre === "preview.jpeg" ||
                    nombre === "preview.webp"
                )
            );
        });

        return {
            nombre: carpeta.name,
            titulo: formatearNombre(carpeta.name),
            enlace:
                `./${encodeURIComponent(carpeta.name)}/`,
            preview: tienePreview
                ? `./${encodeURIComponent(carpeta.name)}/` +
                archivoPreview.name
                : null
        };
    } catch (error) {
        console.warn(
            `No se pudo revisar ${carpeta.name}:`,
            error
        );

        return null;
    }
}

/**
 * Crea una card para un proyecto.
 */
function crearTarjeta(proyecto, indice) {
    const tarjeta = document.createElement("a");

    tarjeta.className = "tarjeta-proyecto";
    tarjeta.href = proyecto.enlace;

    tarjeta.setAttribute(
        "aria-label",
        `Abrir el proyecto ${proyecto.titulo}`
    );

    const contenedorImagen =
        document.createElement("div");

    contenedorImagen.className = "tarjeta-imagen";

    if (proyecto.preview) {
        const imagen = document.createElement("img");

        imagen.src = proyecto.preview;
        imagen.alt =
            `Vista previa del proyecto ${proyecto.titulo}`;

        imagen.loading = "lazy";

        imagen.addEventListener("error", () => {
            imagen.remove();

            const alternativa =
                document.createElement("div");

            alternativa.className = "imagen-alternativa";
            alternativa.textContent = "🧩";

            contenedorImagen.prepend(alternativa);
        });

        contenedorImagen.appendChild(imagen);
    } else {
        const alternativa =
            document.createElement("div");

        alternativa.className = "imagen-alternativa";
        alternativa.textContent = "🧩";

        contenedorImagen.appendChild(alternativa);
    }

    const numero = document.createElement("span");

    numero.className = "tarjeta-numero";
    numero.textContent =
        `Proyecto ${String(indice + 1).padStart(2, "0")}`;

    contenedorImagen.appendChild(numero);

    const contenido = document.createElement("div");

    contenido.className = "tarjeta-contenido";

    const etiqueta = document.createElement("span");

    etiqueta.className = "tarjeta-etiqueta";
    etiqueta.textContent = "Proyecto educativo";

    const titulo = document.createElement("h3");
    titulo.textContent = proyecto.titulo;

    const descripcion = document.createElement("p");

    descripcion.textContent =
        "Aplicación web desarrollada por estudiantes " +
        "de Desarrollo de pequeñas aplicaciones de software.";

    const accion = document.createElement("div");

    accion.className = "tarjeta-accion";

    const texto = document.createElement("span");
    texto.textContent = "Abrir proyecto";

    const flecha = document.createElement("span");
    flecha.textContent = "→";

    accion.append(texto, flecha);

    contenido.append(
        etiqueta,
        titulo,
        descripcion,
        accion
    );

    tarjeta.append(contenedorImagen, contenido);

    return tarjeta;
}

/**
 * Ordena y filtra los proyectos.
 */
function obtenerListaVisible() {
    const consulta =
        buscador.value.trim().toLowerCase();

    const filtrados = proyectos.filter(proyecto => {
        return (
            proyecto.nombre.toLowerCase().includes(consulta) ||
            proyecto.titulo.toLowerCase().includes(consulta)
        );
    });

    filtrados.sort((a, b) => {
        if (selectorOrden.value === "nombre-desc") {
            return b.titulo.localeCompare(
                a.titulo,
                "es",
                { sensitivity: "base" }
            );
        }

        return a.titulo.localeCompare(
            b.titulo,
            "es",
            { sensitivity: "base" }
        );
    });

    return filtrados;
}

/**
 * Dibuja las cards.
 */
function mostrarProyectos() {
    const lista = obtenerListaVisible();

    contenedorProyectos.innerHTML = "";

    if (lista.length === proyectos.length) {
        elementoContador.textContent =
            `${proyectos.length} ` +
            `${proyectos.length === 1 ? "proyecto" : "proyectos"}`;
    } else {
        elementoContador.textContent =
            `${lista.length} de ${proyectos.length} proyectos`;
    }

    if (lista.length === 0) {
        contenedorProyectos.classList.add("oculto");

        elementoEstado.className = "estado";
        elementoEstado.classList.remove("oculto");

        elementoEstado.innerHTML = `
      <div>
        <span class="estado-icono">📂</span>
        <strong>No se encontraron proyectos</strong>
        <p>
          Cada carpeta debe contener un archivo
          llamado index.html.
        </p>
      </div>
    `;

        return;
    }

    elementoEstado.classList.add("oculto");
    contenedorProyectos.classList.remove("oculto");

    lista.forEach((proyecto, indice) => {
        contenedorProyectos.appendChild(
            crearTarjeta(proyecto, indice)
        );
    });
}

/**
 * Consulta las carpetas y valida cada proyecto.
 */
async function cargarProyectos() {
    botonActualizar.disabled = true;
    botonActualizar.textContent = "Buscando…";

    contenedorProyectos.classList.add("oculto");

    elementoEstado.className = "estado";
    elementoEstado.classList.remove("oculto");

    elementoEstado.innerHTML = `
    <div class="cargador"></div>
    <p>Buscando proyectos publicados…</p>
  `;

    elementoContador.textContent = "Cargando…";

    try {
        const urlRaiz =
            `${API_BASE}/` +
            `${CONFIGURACION.usuario}/` +
            `${CONFIGURACION.repositorio}/contents` +
            `?ref=${encodeURIComponent(CONFIGURACION.rama)}`;

        const contenidoRaiz =
            await consultarGitHub(urlRaiz);

        if (!Array.isArray(contenidoRaiz)) {
            throw new Error(
                "GitHub no devolvió una lista válida."
            );
        }

        const carpetas =
            contenidoRaiz.filter(esCarpetaCandidata);

        const resultados = await Promise.all(
            carpetas.map(comprobarProyecto)
        );

        proyectos = resultados.filter(
            proyecto => proyecto !== null
        );

        elementoTotal.textContent = proyectos.length;

        mostrarProyectos();
    } catch (error) {
        console.error(error);

        proyectos = [];

        elementoTotal.textContent = "0";
        elementoContador.textContent = "Error";

        contenedorProyectos.classList.add("oculto");

        elementoEstado.className =
            "estado estado-error";

        elementoEstado.classList.remove("oculto");

        const mensaje =
            error.name === "AbortError"
                ? "La consulta tardó demasiado. " +
                "Presiona Actualizar para intentarlo nuevamente."
                : error.message;

        elementoEstado.innerHTML = `
      <div>
        <span class="estado-icono">⚠️</span>

        <strong>
          No fue posible cargar los proyectos
        </strong>

        <p>${mensaje}</p>
      </div>
    `;
    } finally {
        botonActualizar.disabled = false;
        botonActualizar.textContent = "↻ Actualizar";
    }
}

buscador.addEventListener("input", mostrarProyectos);

selectorOrden.addEventListener(
    "change",
    mostrarProyectos
);

botonActualizar.addEventListener(
    "click",
    cargarProyectos
);

cargarProyectos();