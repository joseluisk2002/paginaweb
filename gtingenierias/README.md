# Web de GT Ingenierías

Web estática (HTML, CSS y JavaScript, sin dependencias). Se sube tal cual a
cualquier hosting.

## Estructura

```
gtingenierias/
├── index.html          Página principal
├── aviso-legal.html    Aviso legal (LSSI)
├── privacidad.html     Política de privacidad (RGPD)
├── cookies.html        Política de cookies
├── 404.html            Página de error "no encontrada"
├── gracias.html        Confirmación de envío (si el navegador no tiene JavaScript)
├── formulario/
│   ├── enviar.php      Envía las solicitudes por correo desde el hosting
│   ├── config.php      Correo de destino, remitente y SMTP
│   └── lib/PHPMailer/  Librería para el envío por SMTP (licencia LGPL)
├── robots.txt          Indica a Google qué puede rastrear
├── sitemap.xml         Mapa del sitio para Google
├── site.webmanifest    Permite "instalar" la web en el móvil
├── .htaccess           Ajustes del servidor (HTTPS, caché, compresión). Archivo oculto
├── css/styles.css      Estilos. Colores y tipografías en las variables del principio
├── js/main.js          Menú, mapa, formulario y WhatsApp
├── fonts/              Tipografías alojadas en la propia web (licencia libre OFL)
└── img/
    ├── logo-gt.svg         Símbolo del logo, redibujado a partir del rótulo de la furgoneta
    ├── icon-192.png        Iconos para móvil y navegador
    ├── icon-512.png
    ├── apple-touch-icon.png
    ├── og-image.png        Imagen que sale al compartir el enlace por WhatsApp o redes
    ├── furgoneta.jpg/.webp Foto de la furgoneta (versión JPG y WebP, más ligera)
    └── antonio.jpg/.webp   Retrato de Antonio
```

## Cómo verla en Visual Studio Code

1. *Archivo > Abrir carpeta* y elige `gtingenierias`.
2. Instala la extensión **Live Server** (de Ritwick Dey).
3. Clic derecho en `index.html` > **Open with Live Server**.

Usa siempre Live Server para probarla: si abres el archivo con doble clic,
algunas cosas (la precarga de fuentes, la página 404) no funcionan igual que
en el servidor real.

## Antes de publicar

Busca `CAMBIAR` y `REVISAR` en todo el proyecto (Ctrl+Shift+F):

- [ ] Horario de la oficina (opcional): ahora no aparece. Si se quiere mostrar, añadirlo
      en la sección de contacto de `index.html`.
- [ ] Zona de trabajo (portada, preguntas frecuentes, pie y datos estructurados del `<head>`).
- [ ] Respuestas de las preguntas frecuentes.
- [ ] Si añadís más fotos, comprimidlas antes (máximo unos 200 KB; se puede usar squoosh.app).
- [ ] Datos en rojo de las páginas legales (NIF, correo, colegio).

## Al publicar

1. Sube todo el contenido de la carpeta (incluido `.htaccess`) a la carpeta raíz
   del hosting (normalmente `public_html` o `www`).
2. Activa el certificado SSL gratuito en el panel del hosting.
3. Cuando la web ya cargue con `https://`, edita `.htaccess` y quita las
   almohadillas del bloque "Forzar HTTPS".
4. Comprueba la velocidad en pagespeed.web.dev.

## Posicionamiento en Google (fuera de la web)

1. **Perfil de Empresa de Google** (business.google.com): crea o reclama la ficha
   de GT Ingenierías con la misma dirección, teléfono y horario que la web.
   Es lo que más influye en aparecer en "perito Salobreña" o en Google Maps.
2. **Pide reseñas** en esa ficha a clientes satisfechos.
3. **Google Search Console** (search.google.com/search-console): da de alta la
   web y envía `https://www.gtingenierias.es/sitemap.xml`.
4. Directorios: el del colegio profesional y directorios locales, siempre con
   el mismo nombre, dirección y teléfono.
5. Comprueba la vista previa al compartir en opengraph.xyz y los datos
   estructurados en search.google.com/test/rich-results.

## Formulario de contacto

Tiene dos botones:

- **Enviar por WhatsApp**: abre WhatsApp con la solicitud ya escrita, dirigida al
  689 109 953. Funciona siempre, también en local. El número se cambia en
  `js/main.js` (`CONFIG.whatsapp`).
- **Enviar por correo**: manda la solicitud a `formulario/enviar.php`, que la envía
  desde el hosting a antmorea@gmail.com. **Solo funciona en el hosting** (necesita
  PHP 7.2 o superior, que tienen casi todos); en Live Server dará error, es normal.

### Puesta en marcha del envío por correo

1. En el panel del hosting, crea un buzón del dominio para el formulario, por
   ejemplo `formulario@gtingenierias.es`.
2. Abre `formulario/config.php` y comprueba el destinatario y el remitente.
3. Sube la web y haz una prueba desde el formulario. Mira también la carpeta de
   spam de Gmail; si llega ahí, márcalo como "No es spam".
4. Si no llega o sigue yendo a spam, activa el SMTP en `formulario/config.php`
   (`'activo' => true`) con el servidor, puerto, usuario y contraseña del buzón
   que te da el hosting. El envío pasa a hacerse con PHPMailer (incluido en
   `formulario/lib`), que es más fiable.

### Seguridad del formulario

- Campo trampa invisible y control de tiempo para frenar robots.
- Máximo de 5 envíos por hora desde una misma conexión (se cambia en `config.php`).
- Se comprueban todos los campos y no se pueden colar cabeceras en el correo.
- `config.php` y la librería están protegidos para que no se abran desde el navegador.
- No se guarda ningún dato en el servidor.
