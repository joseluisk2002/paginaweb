<?php
/* =========================================================
   Configuración del formulario de contacto
   ========================================================= */
return [

    // Correo donde llegan las solicitudes
    'destinatario' => 'antmorea@gmail.com',

    // CAMBIAR: un correo del propio dominio, creado en el panel del hosting
    // (por ejemplo formulario@gtingenierias.es). Los correos salen desde aquí.
    // Usar un correo del dominio evita que lleguen a la carpeta de spam.
    'remitente'        => 'formulario@gtingenierias.es',
    'nombre_remitente' => 'Web GT Ingenierías',

    // Envío por SMTP (recomendado si los correos no llegan o van a spam).
    // Los datos los da el hosting al crear el buzón del remitente.
    'smtp' => [
        'activo'    => false,                     // CAMBIAR a true para usarlo
        'host'      => 'smtp.gtingenierias.es',    // CAMBIAR: servidor SMTP del hosting
        'puerto'    => 465,                        // 465 con 'ssl' o 587 con 'tls'
        'seguridad' => 'ssl',
        'usuario'   => 'formulario@gtingenierias.es',
        'clave'     => '',                         // CAMBIAR: contraseña del buzón
    ],

    // Máximo de solicitudes por hora desde una misma conexión (frena abusos)
    'limite_por_hora' => 5,
];
