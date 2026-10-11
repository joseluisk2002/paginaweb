<?php
/* =========================================================
   GT Ingenierías: envío del formulario de contacto
   ---------------------------------------------------------
   Recibe la solicitud, la comprueba y la envía por correo
   desde el propio hosting. No guarda ningún dato.
   Compatible con PHP 7.2 o superior.
   ========================================================= */

date_default_timezone_set('Europe/Madrid');
$config = require __DIR__ . '/config.php';

// Si la petición viene de la web (JavaScript) se responde en JSON;
// si no, se redirige a una página de confirmación o de error.
$aceptaJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function responder($ok, $mensaje, $codigo, $json)
{
    if ($json) {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? '../gracias.html' : '../index.html?envio=error#contacto'), true, 303);
    }
    exit;
}

function cortar($texto, $max)
{
    return function_exists('mb_substr') ? mb_substr($texto, 0, $max, 'UTF-8') : substr($texto, 0, $max);
}

function limpiar($valor, $max, $multilinea = false)
{
    $valor = trim((string) $valor);
    // Fuera caracteres de control (y saltos de línea si el campo es de una línea)
    $patron = $multilinea ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u';
    $valor = preg_replace($patron, '', $valor);
    return cortar($valor === null ? '' : $valor, $max);
}

function cabeceraUtf8($texto)
{
    return '=?UTF-8?B?' . base64_encode($texto) . '?=';
}

// ---------- 1. Solo se admiten envíos del formulario ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(false, 'Método no permitido.', 405, true);
}

// ---------- 2. Antispam ----------
// Campo trampa: las personas no lo ven; los robots lo rellenan.
if (!empty($_POST['web'])) {
    responder(true, 'Solicitud enviada.', 200, $aceptaJson); // se finge éxito para no dar pistas
}
// Tiempo de relleno: nadie rellena el formulario en menos de 3 segundos.
if (isset($_POST['tiempo']) && $_POST['tiempo'] !== '' && (int) $_POST['tiempo'] < 3) {
    responder(true, 'Solicitud enviada.', 200, $aceptaJson);
}

// Límite de envíos por hora desde una misma conexión
$ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
$registro = rtrim(sys_get_temp_dir(), '/\\') . '/gt_formulario_' . md5($ip);
$ahora = time();
$envios = [];
if (is_readable($registro)) {
    $envios = array_filter(
        array_map('intval', explode(',', (string) file_get_contents($registro))),
        function ($momento) use ($ahora) { return $momento > $ahora - 3600; }
    );
}
if (count($envios) >= (int) $config['limite_por_hora']) {
    responder(false, 'Has enviado varias solicitudes seguidas. Inténtalo más tarde o escríbenos por WhatsApp.', 429, $aceptaJson);
}

// ---------- 3. Comprobación de los datos ----------
$servicios = [
    'Proyecto o informe técnico',
    'Energía solar fotovoltaica',
    'Licencia de apertura',
    'Peritaje',
    'Medición o valoración',
    'Estudio o medición acústica',
    'Certificado o eficiencia energética',
    'Informe o medición de telecomunicaciones',
    'Otro encargo',
];

$nombre   = limpiar($_POST['nombre'] ?? '', 100);
$email    = trim((string) ($_POST['email'] ?? ''));
$telefono = cortar(preg_replace('/[^0-9+ ]/', '', (string) ($_POST['telefono'] ?? '')), 20);
$servicio = limpiar($_POST['servicio'] ?? '', 80);
$mensaje  = limpiar($_POST['mensaje'] ?? '', 3000, true);
$acepta   = ($_POST['privacidad'] ?? '') === 'on';

$errores = [];
if ($nombre === '')                                 $errores[] = 'el nombre';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     $errores[] = 'un correo válido';
if (!in_array($servicio, $servicios, true))         $errores[] = 'el servicio';
if ((function_exists('mb_strlen') ? mb_strlen($mensaje, 'UTF-8') : strlen($mensaje)) < 5) $errores[] = 'los detalles del encargo';
if (!$acepta)                                       $errores[] = 'la aceptación de la política de privacidad';

if ($errores) {
    responder(false, 'Revisa ' . implode(', ', $errores) . '.', 422, $aceptaJson);
}

// ---------- 4. Correo ----------
$asunto = 'Nueva solicitud web: ' . $servicio;
$cuerpo = "Nueva solicitud desde la web de GT Ingenierías\n\n"
        . "Nombre o empresa: {$nombre}\n"
        . "Correo: {$email}\n"
        . 'Teléfono: ' . ($telefono !== '' ? $telefono : 'No indicado') . "\n"
        . "Servicio: {$servicio}\n\n"
        . "Detalles del encargo:\n{$mensaje}\n\n"
        . "---\n"
        . 'Enviado el ' . date('d/m/Y') . ' a las ' . date('H:i') . " desde el formulario de la web.\n"
        . "Para contestar, responde directamente a este correo.\n";

$enviado = false;
$smtp = $config['smtp'];

if (!empty($smtp['activo'])) {
    // Envío por SMTP con PHPMailer
    require_once __DIR__ . '/lib/PHPMailer/Exception.php';
    require_once __DIR__ . '/lib/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/lib/PHPMailer/SMTP.php';

    $correo = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $correo->isSMTP();
        $correo->Host       = $smtp['host'];
        $correo->Port       = (int) $smtp['puerto'];
        $correo->SMTPSecure = $smtp['seguridad'];
        $correo->SMTPAuth   = true;
        $correo->Username   = $smtp['usuario'];
        $correo->Password   = $smtp['clave'];
        $correo->CharSet    = 'UTF-8';
        $correo->setFrom($config['remitente'], $config['nombre_remitente']);
        $correo->addAddress($config['destinatario']);
        $correo->addReplyTo($email, $nombre);
        $correo->Subject = $asunto;
        $correo->Body    = $cuerpo;
        $correo->isHTML(false);
        $enviado = $correo->send();
    } catch (Exception $e) {
        error_log('Formulario GT: error SMTP: ' . $correo->ErrorInfo);
    }
} else {
    // Envío con la función de correo del propio hosting
    $cabeceras = implode("\r\n", [
        'From: ' . cabeceraUtf8($config['nombre_remitente']) . ' <' . $config['remitente'] . '>',
        'Reply-To: ' . cabeceraUtf8($nombre) . ' <' . $email . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    $enviado = mail($config['destinatario'], cabeceraUtf8($asunto), $cuerpo, $cabeceras, '-f' . $config['remitente']);
    if (!$enviado) {
        error_log('Formulario GT: la función mail() ha fallado.');
    }
}

if (!$enviado) {
    responder(false, 'No se ha podido enviar la solicitud.', 500, $aceptaJson);
}

// Se apunta el envío para el límite por hora
$envios[] = $ahora;
@file_put_contents($registro, implode(',', $envios), LOCK_EX);

responder(true, 'Solicitud enviada.', 200, $aceptaJson);
