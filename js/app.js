"use strict";

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
 * Convierte una ruta relativa en una dirección segura.
 */
function crearRuta(ruta) {
    return ruta
        .split("/")
        .filter(Boolean)
        .map(parte => encodeURIComponent(parte))
        .join("/");
}

/**
 * Carga proyectos.json sin utilizar la API de GitHub.
 */
async function obtenerProyectos() {
    const controlador = new AbortController();

    const limiteTiempo = setTimeout(() => {
        controlador.abort();
    }, 10000);

    try {
        /*
          El parámetro evita que el navegador muestre
          una versión antigua del archivo.
        */
        const respuesta = await fetch(
            `./proyectos.json?actualizacion=${Date.now()}`,
            {
                cache: "no-store",
                signal: controlador.signal
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo leer proyectos.json. Código ${respuesta.status}.`
            );
        }

        const datos = await respuesta.json();

        if (!datos || !Array.isArray(datos.proyectos)) {
            throw new Error(
                "El contenido de proyectos.json no es válido."
            );
        }

        return datos.proyectos;
    } finally {
        clearTimeout(limiteTiempo);
    }
}

/**
 * Crea el elemento visual de una card.
 */
function crearTarjeta(proyecto, indice) {
    const tarjeta = document.createElement("a");

    tarjeta.className = "tarjeta-proyecto";
    tarjeta.href = `./${crearRuta(proyecto.enlace)}/`;

    tarjeta.setAttribute(
        "aria-label",
        `Abrir el proyecto ${proyecto.titulo}`
    );

    const contenedorImagen =
        document.createElement("div");

    contenedorImagen.className = "tarjeta-imagen";

    if (proyecto.preview) {
        const imagen = document.createElement("img");

        imagen.src = `./${crearRuta(proyecto.preview)}`;
        imagen.alt = `Vista previa de ${proyecto.titulo}`;
        imagen.loading = "lazy";

        imagen.addEventListener("error", () => {
            mostrarImagenAlternativa(contenedorImagen);
        });

        contenedorImagen.appendChild(imagen);
    } else {
        mostrarImagenAlternativa(contenedorImagen);
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
        "Aplicación desarrollada por estudiantes de " +
        "Desarrollo de pequeñas aplicaciones de software.";

    const tecnologias =
        document.createElement("div");

    tecnologias.className = "tarjeta-tecnologias";

    ["HTML", "CSS", "JavaScript"].forEach(nombre => {
        const tecnologia = document.createElement("span");

        tecnologia.className = "tecnologia";
        tecnologia.textContent = nombre;

        tecnologias.appendChild(tecnologia);
    });

    const accion = document.createElement("div");

    accion.className = "tarjeta-accion";

    const textoAccion = document.createElement("span");
    textoAccion.textContent = "Abrir proyecto";

    const flecha = document.createElement("span");
    flecha.textContent = "→";

    accion.append(textoAccion, flecha);

    contenido.append(
        etiqueta,
        titulo,
        descripcion,
        tecnologias,
        accion
    );

    tarjeta.append(
        contenedorImagen,
        contenido
    );

    return tarjeta;
}

/**
 * Muestra un ícono cuando no existe preview.
 */
function mostrarImagenAlternativa(contenedor) {
    const imagenAnterior =
        contenedor.querySelector("img");

    if (imagenAnterior) {
        imagenAnterior.remove();
    }

    if (
        contenedor.querySelector(".imagen-alternativa")
    ) {
        return;
    }

    const alternativa = document.createElement("div");

    alternativa.className = "imagen-alternativa";
    alternativa.textContent = "🧩";

    contenedor.prepend(alternativa);
}

/**
 * Filtra y ordena la lista.
 */
function obtenerListaVisible() {
    const consulta =
        buscador.value.trim().toLowerCase();

    const lista = proyectos.filter(proyecto => {
        return (
            proyecto.titulo
                .toLowerCase()
                .includes(consulta) ||
            proyecto.carpeta
                .toLowerCase()
                .includes(consulta)
        );
    });

    lista.sort((a, b) => {
        const comparacion =
            a.titulo.localeCompare(
                b.titulo,
                "es",
                { sensitivity: "base" }
            );

        return selectorOrden.value === "nombre-desc"
            ? -comparacion
            : comparacion;
    });

    return lista;
}

/**
 * Muestra las cards.
 */
function mostrarProyectos() {
    const lista = obtenerListaVisible();

    contenedorProyectos.innerHTML = "";

    if (lista.length === proyectos.length) {
        elementoContador.textContent =
            proyectos.length === 1
                ? "1 proyecto"
                : `${proyectos.length} proyectos`;
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

        <strong>
          No se encontraron proyectos
        </strong>

        <p>
          Cada carpeta de proyecto debe contener
          un archivo index.html.
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
 * Inicia o actualiza la galería.
 */
async function cargarProyectos() {
    botonActualizar.disabled = true;
    botonActualizar.textContent = "Cargando…";

    contenedorProyectos.classList.add("oculto");

    elementoEstado.className = "estado";
    elementoEstado.classList.remove("oculto");

    elementoEstado.innerHTML = `
    <div class="cargador"></div>
    <p>Cargando proyectos publicados…</p>
  `;

    elementoContador.textContent = "Cargando…";

    try {
        proyectos = await obtenerProyectos();

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
                ? "La carga tardó demasiado. Intenta actualizar."
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

buscador.addEventListener(
    "input",
    mostrarProyectos
);

selectorOrden.addEventListener(
    "change",
    mostrarProyectos
);

botonActualizar.addEventListener(
    "click",
    cargarProyectos
);

cargarProyectos();