<?php
// Monitor da lista de presentes (Meu Chá de Panela) → aviso no grupo do WhatsApp.
// Roda pela Cron da Hostinger a cada 5 minutos:  php /caminho/chadecasanova/api/presentes-monitor.php
//
// Entra no painel do casal pela mesma API que o site deles usa (api/login-user e api/list-user),
// compara cada presente com a última leitura (tabela wp_torti_presentes_vistos) e avisa quem
// escolheu qual presente. Na primeira execução só registra o que já estava escolhido, sem avisar.
// Precisa de MCP_EMAIL e MCP_SENHA (login do painel) e das credenciais da Z-API no config.php.

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/avisos.php';

const MCP_API = 'https://www.meuchadepanela.com.br/api/';

function log_monitor(string $msg): void
{
    echo date('Y-m-d H:i:s') . ' ' . $msg . "\n";
}

// Uma execução por vez (se a anterior travar, a próxima não duplica avisos).
$trava = fopen(sys_get_temp_dir() . '/chadecasanova-presentes.lock', 'c');
if (!$trava || !flock($trava, LOCK_EX | LOCK_NB)) {
    log_monitor('outra execução em andamento');
    exit;
}

if (!defined('MCP_EMAIL') || !defined('MCP_SENHA') || MCP_EMAIL === '' || MCP_SENHA === '') {
    log_monitor('MCP_EMAIL / MCP_SENHA não configurados no config.php');
    exit(1);
}

// Mesma sessão (cookie) para o login e a leitura da lista.
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEFILE => '',          // cookies só em memória
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json;charset=UTF-8', 'Accept: application/json'],
    CURLOPT_USERAGENT => 'chadecasanova-monitor/1.0',
]);

function mcp_post($ch, string $rota, array $dados): ?array
{
    curl_setopt($ch, CURLOPT_URL, MCP_API . $rota);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dados));
    $corpo = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($corpo === false || $status !== 200) {
        log_monitor("erro em $rota: HTTP $status " . curl_error($ch));
        return null;
    }
    return json_decode($corpo, true);
}

$login = mcp_post($ch, 'login-user', ['login' => MCP_EMAIL, 'pass' => MCP_SENHA]);
$token = $login['data']['token'] ?? null;
if (empty($login['status']) || !$token) {
    log_monitor('login no Meu Chá de Panela falhou: ' . ($login['error'] ?? 'resposta inesperada'));
    exit(1);
}

$lista = mcp_post($ch, 'list-user', ['token' => $token]);
$presentes = $lista['list']['presentes'] ?? null;
if (!is_array($presentes)) {
    log_monitor('lista de presentes não veio na resposta');
    exit(1);
}

$pdo->exec("CREATE TABLE IF NOT EXISTS wp_torti_presentes_vistos (
    presente_id BIGINT PRIMARY KEY,
    presente_nome VARCHAR(255) NOT NULL,
    convidado_id BIGINT NULL,
    convidado_nome VARCHAR(255) NULL,
    convidado_email VARCHAR(255) NULL,
    atualizado_em DATETIME NOT NULL
) DEFAULT CHARSET=utf8mb4");

$vistos = [];
foreach ($pdo->query('SELECT presente_id, convidado_id FROM wp_torti_presentes_vistos') as $v) {
    $vistos[(int)$v['presente_id']] = $v['convidado_id'] === null ? null : (int)$v['convidado_id'];
}
$primeiraVez = empty($vistos);

$salvar = $pdo->prepare('REPLACE INTO wp_torti_presentes_vistos
    (presente_id, presente_nome, convidado_id, convidado_nome, convidado_email, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?)');
$agora = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');

$avisados = 0;
foreach ($presentes as $p) {
    $id = (int)$p['id'];
    $convidadoId = empty($p['id_convidado']) ? null : (int)$p['id_convidado'];
    $nomeConvidado = trim($p['convidado']['nome'] ?? '');
    $email = trim($p['convidado']['email'] ?? '');
    $nomePresente = trim($p['nome'] ?? 'Presente');

    $mudou = !array_key_exists($id, $vistos) || $vistos[$id] !== $convidadoId;
    if (!$mudou) continue;

    // Presente que acabou de ganhar um convidado (novo ou trocado). Escolha removida só atualiza.
    if ($convidadoId !== null && !$primeiraVez) {
        if (!whatsapp_enviar(texto_presente($nomeConvidado, $email, $nomePresente))) {
            log_monitor("aviso não enviado para o presente $id; tenta de novo na próxima execução");
            continue;   // não grava: o aviso é repetido na próxima rodada
        }
        $avisados++;
        log_monitor("avisado: $nomePresente");
    }
    $salvar->execute([$id, $nomePresente, $convidadoId, $nomeConvidado ?: null, $email ?: null, $agora]);
}

curl_close($ch);
$escolhidos = count(array_filter($presentes, fn($p) => !empty($p['id_convidado'])));
log_monitor(($primeiraVez ? 'primeira execução: estado registrado sem avisos. ' : '')
    . "presentes: " . count($presentes) . ", escolhidos: $escolhidos, avisos enviados: $avisados");
