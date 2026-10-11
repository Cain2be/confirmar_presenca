<?php
// Avisos no grupo do WhatsApp pela Z-API. Único arquivo que fala com a Z-API.
// Credenciais em config.php (servidor) ou credenciais.local.php (testes): ZAPI_INSTANCE, ZAPI_TOKEN,
// ZAPI_CLIENT_TOKEN e ZAPI_GRUPO. Sem elas, os avisos ficam desligados e nada quebra.

function whatsapp_configurado(): bool
{
    foreach (['ZAPI_INSTANCE', 'ZAPI_TOKEN', 'ZAPI_CLIENT_TOKEN', 'ZAPI_GRUPO'] as $c) {
        if (!defined($c) || constant($c) === '') return false;
    }
    return true;
}

// Manda um texto para o grupo. Devolve true se a Z-API aceitou. Nunca lança exceção:
// um aviso que falha não pode atrapalhar a confirmação de presença.
function whatsapp_enviar(string $texto): bool
{
    // Testes: com WHATSAPP_SIMULAR a mensagem só é impressa, nada é enviado.
    if (defined('WHATSAPP_SIMULAR') && WHATSAPP_SIMULAR) {
        echo "----- mensagem (simulada) -----\n$texto\n";
        return true;
    }
    if (!whatsapp_configurado()) {
        error_log('whatsapp: credenciais da Z-API não configuradas');
        return false;
    }
    $url = 'https://api.z-api.io/instances/' . ZAPI_INSTANCE . '/token/' . ZAPI_TOKEN . '/send-text';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['phone' => ZAPI_GRUPO, 'message' => $texto], JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Client-Token: ' . ZAPI_CLIENT_TOKEN],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
    ]);
    $resposta = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $erro = curl_error($ch);
    curl_close($ch);

    $json = is_string($resposta) ? json_decode($resposta, true) : null;
    $ok = $status >= 200 && $status < 300 && is_array($json) && empty($json['error']);
    if (!$ok) {
        error_log('whatsapp: falha ao enviar (HTTP ' . $status . ') ' . ($erro ?: substr((string)$resposta, 0, 200)));
    }
    return $ok;
}

// Lista com marcadores: "• Fulano\n• Beltrano"
function whatsapp_lista(array $itens): string
{
    return implode("\n", array_map(fn($i) => '• ' . $i, $itens));
}
