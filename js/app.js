"use strict";

const contenedorProyectos = document.getElementById("contenedorProyectos");
const elementoEstado = document.getElementById("estado");
const elementoContador = document.getElementById("contador");
const elementoTotal = document.getElementById("totalProyectos");
const buscador = document.getElementById("buscador");
const selectorOrden = document.getElementById("ordenProyectos");

const CARPETAS_IGNORADAS = new Set([
    ".git",
    ".github",
    "assets",
    "archivos",
    "css",
    "docs",
    "images",
    "img",
    "js",
    "recursos"
]);

const REPOSITORIO_PREDETERMINADO = {
    propietario: "emena2006",
    nombre: "proyectos_info_2026"
};

let proyectos = [];

function crearRuta(ruta) {
    return ruta
        .split("/")
        .filter(Boolean)
        .map(parte => encodeURIComponent(parte))
        .join("/");
}

function crearTitulo(nombreCarpeta) {
    const palabrasMenores = new Set([
        "con", "de", "del", "el", "en", "la", "las", "los", "para", "y"
    ]);

    return nombreCarpeta
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((palabra, indice) => {
            const minuscula = palabra.toLocaleLowerCase("es");

            if (indice > 0 && palabrasMenores.has(minuscula)) {
                return minuscula;
            }

            return minuscula.charAt(0).toLocaleUpperCase("es") +
                minuscula.slice(1);
        })
        .join(" ");
}

/**
 * Obtiene usuario y repositorio desde una URL normal de GitHub Pages.
 * El valor predeterminado permite probar la portada fuera de Pages.
 */
function detectarRepositorio() {
    const partesHost = window.location.hostname.split(".");

    if (
        partesHost.length >= 3 &&
        partesHost.slice(-2).join(".") === "github.io"
    ) {
        const propietario = partesHost[0];
        const primerSegmento = window.location.pathname
            .split("/")
            .filter(Boolean)[0];

        return {
            propietario,
            nombre: primerSegmento || `${propietario}.github.io`
        };
    }

    return REPOSITORIO_PREDETERMINADO;
}

/**
 * Lee el index de una carpeta para confirmar que es un micrositio y obtener
 * un nombre comprensible. Si no responde, esa carpeta no es un proyecto.
 */
async function leerMicrositio(carpeta) {
    try {
        const respuesta = await fetch(
            `./${crearRuta(carpeta)}/index.html`,
            { cache: "no-store" }
        );

        if (!respuesta.ok) {
            return null;
        }

        const html = await respuesta.text();
        const documento = new DOMParser().parseFromString(html, "text/html");
        const tituloDocumento = documento.querySelector("title")
            ?.textContent.trim();
        const descripcion = documento.querySelector('meta[name="description"]')
            ?.getAttribute("content")?.trim();

        return {
            carpeta,
            titulo: tituloDocumento || crearTitulo(carpeta),
            descripcion: descripcion || "Aplicación creada por estudiantes del Liceo Unesco.",
            enlace: carpeta
        };
    } catch (error) {
        console.warn(`No se pudo revisar la carpeta ${carpeta}.`, error);
        return null;
    }
}

/**
 * Lista las carpetas directamente desde el repositorio público. No requiere
 * proyectos.json ni un workflow: subir una carpeta con index.html es suficiente.
 */
async function obtenerProyectosDesdeGitHub() {
    const { propietario, nombre } = detectarRepositorio();
    const respuesta = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(propietario)}/` +
        `${encodeURIComponent(nombre)}/contents`,
        {
            cache: "no-store",
            headers: { Accept: "application/vnd.github+json" }
        }
    );

    if (!respuesta.ok) {
        throw new Error(`GitHub respondió con el código ${respuesta.status}.`);
    }

    const contenido = await respuesta.json();
    const carpetas = contenido
        .filter(elemento => {
            return elemento.type === "dir" &&
                !elemento.name.startsWith(".") &&
                !CARPETAS_IGNORADAS.has(elemento.name.toLocaleLowerCase("es"));
        })
        .map(elemento => elemento.name);

    const resultados = await Promise.all(carpetas.map(leerMicrositio));
    return resultados.filter(Boolean);
}

/**
 * Respaldo para vista local o interrupciones temporales de la API pública.
 */
async function obtenerProyectosDeRespaldo() {
    const respuesta = await fetch(
        `./proyectos.json?actualizacion=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!respuesta.ok) {
        throw new Error("No fue posible consultar la lista de proyectos.");
    }

    const datos = await respuesta.json();
    return Array.isArray(datos.proyectos) ? datos.proyectos : [];
}

async function obtenerProyectos() {
    try {
        return await obtenerProyectosDesdeGitHub();
    } catch (errorApi) {
        console.warn("Se utilizará la lista local de respaldo.", errorApi);
        return obtenerProyectosDeRespaldo();
    }
}

function mostrarImagenAlternativa(contenedor) {
    contenedor.querySelector("img")?.remove();

    if (contenedor.querySelector(".imagen-alternativa")) {
        return;
    }

    const alternativa = document.createElement("div");
    alternativa.className = "imagen-alternativa";
    alternativa.setAttribute("aria-hidden", "true");
    alternativa.textContent = "🧩";
    contenedor.prepend(alternativa);
}

function agregarPreview(contenedor, proyecto) {
    const extensiones = ["png", "jpg", "jpeg", "webp"];
    let indice = 0;
    const imagen = document.createElement("img");

    imagen.alt = `Vista previa de ${proyecto.titulo}`;
    imagen.loading = "lazy";

    const probarSiguiente = () => {
        if (indice >= extensiones.length) {
            mostrarImagenAlternativa(contenedor);
            return;
        }

        imagen.src = `./${crearRuta(proyecto.carpeta)}/preview.${extensiones[indice]}`;
        indice += 1;
    };

    imagen.addEventListener("error", probarSiguiente);
    contenedor.appendChild(imagen);
    probarSiguiente();
}

function crearTarjeta(proyecto, indice) {
    const tarjeta = document.createElement("a");
    tarjeta.className = "tarjeta-proyecto";
    tarjeta.href = `./${crearRuta(proyecto.enlace)}/`;
    tarjeta.setAttribute("aria-label", `Ver el proyecto ${proyecto.titulo}`);

    const contenedorImagen = document.createElement("div");
    contenedorImagen.className = "tarjeta-imagen";
    agregarPreview(contenedorImagen, proyecto);

    const numero = document.createElement("span");
    numero.className = "tarjeta-numero";
    numero.textContent = `Proyecto ${String(indice + 1).padStart(2, "0")}`;
    contenedorImagen.appendChild(numero);

    const contenido = document.createElement("div");
    contenido.className = "tarjeta-contenido";

    const etiqueta = document.createElement("span");
    etiqueta.className = "tarjeta-etiqueta";
    etiqueta.textContent = "Listo para explorar";

    const titulo = document.createElement("h3");
    titulo.textContent = proyecto.titulo;

    const descripcion = document.createElement("p");
    descripcion.textContent = proyecto.descripcion ||
        "Aplicación creada por estudiantes del Liceo Unesco.";

    const accion = document.createElement("div");
    accion.className = "tarjeta-accion";

    const textoAccion = document.createElement("span");
    textoAccion.textContent = "Ver proyecto";

    const flecha = document.createElement("span");
    flecha.setAttribute("aria-hidden", "true");
    flecha.textContent = "→";

    accion.append(textoAccion, flecha);
    contenido.append(etiqueta, titulo, descripcion, accion);
    tarjeta.append(contenedorImagen, contenido);
    return tarjeta;
}

function obtenerListaVisible() {
    const consulta = buscador.value.trim().toLocaleLowerCase("es");
    const lista = proyectos.filter(proyecto => {
        return proyecto.titulo.toLocaleLowerCase("es").includes(consulta) ||
            proyecto.carpeta.toLocaleLowerCase("es").includes(consulta);
    });

    lista.sort((a, b) => {
        const comparacion = a.titulo.localeCompare(
            b.titulo,
            "es",
            { sensitivity: "base" }
        );

        return selectorOrden.value === "nombre-desc" ? -comparacion : comparacion;
    });

    return lista;
}

function mostrarProyectos() {
    const lista = obtenerListaVisible();
    contenedorProyectos.replaceChildren();

    elementoContador.textContent = lista.length === proyectos.length
        ? `${proyectos.length} ${proyectos.length === 1 ? "proyecto" : "proyectos"}`
        : `${lista.length} de ${proyectos.length} proyectos`;

    if (lista.length === 0) {
        contenedorProyectos.classList.add("oculto");
        elementoEstado.className = "estado";
        elementoEstado.classList.remove("oculto");
        elementoEstado.innerHTML = `
            <div>
                <span class="estado-icono" aria-hidden="true">📂</span>
                <strong>No se encontraron proyectos</strong>
                <p>Pruebe con otro nombre en el buscador.</p>
            </div>`;
        return;
    }

    elementoEstado.classList.add("oculto");
    contenedorProyectos.classList.remove("oculto");
    lista.forEach((proyecto, indice) => {
        contenedorProyectos.appendChild(crearTarjeta(proyecto, indice));
    });
}

async function cargarProyectos() {
    try {
        proyectos = await obtenerProyectos();
        elementoTotal.textContent = proyectos.length;
        mostrarProyectos();
    } catch (error) {
        console.error(error);
        elementoTotal.textContent = "0";
        elementoContador.textContent = "No disponible";
        contenedorProyectos.classList.add("oculto");
        elementoEstado.className = "estado estado-error";
        elementoEstado.innerHTML = `
            <div>
                <span class="estado-icono" aria-hidden="true">⚠️</span>
                <strong>No fue posible cargar los proyectos</strong>
                <p>Revise su conexión y vuelva a cargar esta página.</p>
            </div>`;
    }
}

buscador.addEventListener("input", mostrarProyectos);
selectorOrden.addEventListener("change", mostrarProyectos);
cargarProyectos();
