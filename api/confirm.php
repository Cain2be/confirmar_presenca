<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'erro' => 'Metodo nao permitido']);
    exit;
}

$ids_raw = $_POST['ids'] ?? '';
$quem_confirmou = filter_var($_POST['quem_confirmou'] ?? 0, FILTER_VALIDATE_INT);
$telefone_bruto = trim($_POST['telefone'] ?? '');
$telefone = preg_replace('/\D/', '', $telefone_bruto);

if (strlen($telefone) < 10) {
    echo json_encode(['success' => false, 'erro' => 'Telefone invalido']);
    exit;
}

$ids = array_map('intval', explode(',', $ids_raw));
$ids = array_filter($ids);

if (empty($ids)) {
    echo json_encode(['success' => false, 'erro' => 'Nenhum convidado selecionado']);
    exit;
}

$ids = array_values(array_unique($ids));
$telefone_valido = in_array($quem_confirmou, $ids);

// Quem ainda não estava confirmado: só essas pessoas entram no aviso do WhatsApp.
$marcadores = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare("SELECT id, full_name, confirmed, invited_cha FROM wp_torti_guests WHERE id IN ($marcadores) ORDER BY id");
$stmt->execute($ids);
$novos = array_values(array_filter($stmt->fetchAll(), fn($g) => (int)$g['confirmed'] !== 1));

$fuso = new DateTimeZone('America/Sao_Paulo');
$agora = new DateTime('now', $fuso);
$data_hora = $agora->format('Y-m-d H:i:s');

$stmtComTel = $pdo->prepare("
    UPDATE wp_torti_guests
    SET confirmed = 1, confirmed_at = :confirmed_at, phone_number = :phone
    WHERE id = :id
");

$stmtSemTel = $pdo->prepare("
    UPDATE wp_torti_guests
    SET confirmed = 1, confirmed_at = :confirmed_at
    WHERE id = :id
");

foreach ($ids as $id) {
    if ($id === $quem_confirmou && $telefone_valido) {
        $stmtComTel->execute([
            'confirmed_at' => $data_hora,
            'phone' => $telefone,
            'id' => $id,
        ]);
    } else {
        $stmtSemTel->execute([
            'confirmed_at' => $data_hora,
            'id' => $id,
        ]);
    }
}

echo json_encode(['success' => true]);

// O convidado já recebeu a resposta; o aviso no grupo vem depois e não o faz esperar.
if (!empty($novos)) {
    if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
    elseif (function_exists('litespeed_finish_request')) litespeed_finish_request();

    require_once __DIR__ . '/avisos.php';
    avisar_confirmacao($pdo, $novos, $quem_confirmou);
}
