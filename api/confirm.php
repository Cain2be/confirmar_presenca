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

$telefone_valido = in_array($quem_confirmou, $ids);

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
