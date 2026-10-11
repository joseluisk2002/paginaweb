/* =========================================================
   GT Ingenierías — funciones de la página
   1. Configuración
   2. Menú móvil
   3. Mapa bajo demanda (no carga Google hasta que se pide)
   4. Formulario de contacto
   5. Aviso de imágenes que faltan
   6. Año del pie de página
   ========================================================= */

/* 1. CONFIGURACIÓN ---------------------------------------
   - whatsapp: número al que se envían las solicitudes por WhatsApp
     (con el prefijo 34 y sin espacios).
   - El envío por correo lo hace formulario/enviar.php en el hosting;
     el correo de destino se cambia en formulario/config.php. */
const CONFIG = {
  whatsapp: "34689109953",
  mapSrc:
    "https://maps.google.com/maps?q=Grupo%20T%C3%A9cnico%20de%20Ingenier%C3%ADa%2C%20C.%20Jacques%20Cousteau%206%2C%2018680%20Salobre%C3%B1a%2C%20Granada&t=&z=17&ie=UTF8&iwloc=&output=embed",
};

/* 2. MENÚ MÓVIL ------------------------------------------ */
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    menu.classList.toggle("is-open", !open);
  });

  // Cerrar el menú al pulsar un enlace
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    })
  );
}

/* 3. MAPA BAJO DEMANDA ----------------------------------- */
const mapBox = document.getElementById("map");
const mapButton = mapBox?.querySelector(".map-load");

mapButton?.addEventListener("click", () => {
  const iframe = document.createElement("iframe");
  iframe.src = CONFIG.mapSrc;
  iframe.title = "Ubicación de la oficina de GT Ingenierías en Salobreña";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  mapBox.innerHTML = "";
  mapBox.appendChild(iframe);
});

/* 4. FORMULARIO ------------------------------------------
   Dos formas de enviarlo:
   - Por correo: se manda a formulario/enviar.php, que lo envía desde el hosting.
   - Por WhatsApp: abre WhatsApp con la solicitud ya escrita. */
const form = document.getElementById("contact-form");
const statusMsg = form?.querySelector(".form-status");
const successBox = document.getElementById("form-success");
const emailButton = document.getElementById("send-email");
const whatsappButton = document.getElementById("send-whatsapp");
const loadedAt = Date.now();

function showStatus(text, isError = false) {
  statusMsg.textContent = text;
  statusMsg.classList.toggle("is-error", isError);
}

// Comprueba los campos obligatorios. Por WhatsApp el correo no hace falta.
function validate(viaWhatsapp) {
  const required = viaWhatsapp
    ? ["nombre", "servicio", "mensaje", "privacidad"]
    : ["nombre", "email", "servicio", "mensaje", "privacidad"];
  let firstInvalid = null;

  form.querySelectorAll("[required]").forEach((field) => {
    const needed = required.includes(field.name);
    let valid = true;
    if (needed) {
      valid = field.type === "checkbox" ? field.checked : field.value.trim() !== "" && field.checkValidity();
    }
    field.classList.toggle("is-invalid", !valid);
    if (!valid && !firstInvalid) firstInvalid = field;
  });

  if (!firstInvalid) return true;

  let text = "Revisa los campos marcados: nombre, un correo válido y los detalles del encargo.";
  if (firstInvalid.name === "privacidad") text = "Marca la casilla de privacidad para poder enviar la solicitud.";
  else if (firstInvalid.name === "servicio") text = "Elige qué servicio necesitas en el desplegable.";
  else if (viaWhatsapp) text = "Revisa los campos marcados: nombre y detalles del encargo.";
  showStatus(text, true);
  firstInvalid.focus();
  return false;
}

// Envío por correo (a través del hosting)
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validate(false)) return;

  form.tiempo.value = String(Math.round((Date.now() - loadedAt) / 1000));
  emailButton.disabled = true;
  emailButton.textContent = "Enviando…";
  showStatus("");

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => ({ ok: false }));
    if (!response.ok || !result.ok) throw new Error(result.mensaje || "Error al enviar");

    form.classList.add("is-sent");
    successBox.hidden = false;
    successBox.focus();
  } catch (error) {
    showStatus(
      (error.message && error.message !== "Failed to fetch" && error.message !== "Error al enviar" ? error.message + " " : "") +
        "No se ha podido enviar por correo. Prueba de nuevo, envíala por WhatsApp o llama al 689 109 953.",
      true
    );
  } finally {
    emailButton.disabled = false;
    emailButton.textContent = "Enviar por correo";
  }
});

// Envío por WhatsApp
whatsappButton?.addEventListener("click", () => {
  if (!validate(true)) return;
  const data = new FormData(form);
  const lines = [
    "Hola, quiero pedir presupuesto desde la web.",
    "",
    `*Servicio:* ${data.get("servicio")}`,
    `*Nombre:* ${data.get("nombre")}`,
  ];
  if (data.get("telefono")) lines.push(`*Teléfono:* ${data.get("telefono")}`);
  if (data.get("email")) lines.push(`*Correo:* ${data.get("email")}`);
  lines.push("", "*Detalles:*", String(data.get("mensaje")).trim());

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  showStatus("Se ha abierto WhatsApp con tu solicitud. Solo falta pulsar enviar en el chat.");
});

// Volver a mostrar el formulario vacío
document.getElementById("send-another")?.addEventListener("click", () => {
  form.reset();
  form.classList.remove("is-sent");
  successBox.hidden = true;
  showStatus("");
  form.nombre.focus();
});

// Si se envió sin JavaScript y falló, la página vuelve con ?envio=error
if (form && new URLSearchParams(window.location.search).get("envio") === "error") {
  showStatus("No se ha podido enviar la solicitud. Prueba de nuevo, envíala por WhatsApp o llama al 689 109 953.", true);
}

/* Al corregir un campo marcado, se quita la marca de error */
form?.querySelectorAll("[required]").forEach((field) =>
  field.addEventListener("change", () => field.classList.remove("is-invalid"))
);

/* Enlaces que preseleccionan el servicio en el formulario */
document.querySelectorAll("[data-servicio]").forEach((link) =>
  link.addEventListener("click", () => {
    const select = document.getElementById("servicio");
    if (select) select.value = link.dataset.servicio;
  })
);

/* Sombra de la cabecera al bajar y enlace del menú activo */
const header = document.querySelector(".site-header");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Enlace del menú activo según la sección visible.
   Servicios y Telecomunicaciones marcan el botón "Servicios". */
const subToggle = document.querySelector(".nav-sub-toggle");
const navTargets = {
  servicios: subToggle,
  telecomunicaciones: subToggle,
  nosotros: document.querySelector('.main-nav > a[href="#nosotros"]'),
  preguntas: document.querySelector('.main-nav > a[href="#preguntas"]'),
};
const navItems = [...new Set(Object.values(navTargets))].filter(Boolean);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const active = navTargets[entry.target.id];
        navItems.forEach((item) => item.classList.toggle("is-active", item === active));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  Object.keys(navTargets).forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

/* Desplegable "Servicios": categorías y trabajos para saltar a cada uno.
   - Ordenador: se abre al pasar el ratón; un clic en "Servicios" lleva a la sección.
   - Teclado y móvil: se abre y se cierra pulsando "Servicios". */
const subMenu = document.querySelector(".has-sub");
if (subMenu && subToggle) {
  const canHover = window.matchMedia("(hover: hover) and (min-width: 861px)");
  let closeTimer;

  const setOpen = (open) => {
    subMenu.classList.toggle("is-open", open);
    subToggle.setAttribute("aria-expanded", String(open));
  };

  subToggle.addEventListener("click", (event) => {
    // event.detail === 0 significa que se ha pulsado con el teclado
    if (canHover.matches && event.detail > 0) {
      setOpen(false);
      document.getElementById("servicios")?.scrollIntoView();
      return;
    }
    setOpen(!subMenu.classList.contains("is-open"));
  });

  subMenu.addEventListener("mouseenter", () => {
    if (!canHover.matches) return;
    clearTimeout(closeTimer);
    setOpen(true);
  });
  subMenu.addEventListener("mouseleave", () => {
    if (!canHover.matches) return;
    closeTimer = setTimeout(() => setOpen(false), 160);
  });

  // Al elegir un trabajo, se cierra el desplegable
  subMenu.querySelectorAll(".mega a").forEach((link) =>
    link.addEventListener("click", () => {
      setOpen(false);
      link.blur();
    })
  );

  // Escape y clic fuera lo cierran
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && subMenu.classList.contains("is-open")) {
      setOpen(false);
      subToggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!subMenu.contains(event.target)) setOpen(false);
  });
  // Al salir del desplegable con el tabulador, se cierra
  subMenu.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !subMenu.contains(event.relatedTarget)) setOpen(false);
  });
}

/* 5. IMÁGENES QUE FALTAN ----------------------------------
   Si una foto aún no está en /img, se muestra un aviso en su
   lugar en vez de un icono roto. */
document.querySelectorAll("figure img").forEach((img) => {
  const markMissing = () => {
    const figure = img.closest("figure");
    const name = img.getAttribute("src");
    figure.classList.add("img-missing");
    figure.innerHTML = `<span>Falta la imagen <strong>${name}</strong>.<br>Cópiala en la carpeta img.</span>`;
  };
  if (img.complete && img.naturalWidth === 0) markMissing();
  else img.addEventListener("error", markMissing);
});

// El retrato es opcional: si no está, simplemente se oculta
document.querySelectorAll("img.portrait").forEach((img) => {
  const hide = () => (img.style.display = "none");
  if (img.complete && img.naturalWidth === 0) hide();
  else img.addEventListener("error", hide);
});

/* 6. AÑO ACTUAL ------------------------------------------ */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
