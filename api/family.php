<?php
require_once __DIR__ . '/config.php';

$familyId = filter_input(INPUT_POST, 'family_id', FILTER_VALIDATE_INT)
          ?: filter_input(INPUT_GET, 'family_id', FILTER_VALIDATE_INT);
$cha_tipo = filter_var($_POST['cha_tipo'] ?? $_GET['cha_tipo'] ?? 1, FILTER_VALIDATE_INT);
if (!in_array($cha_tipo, [1, 2])) $cha_tipo = 1;

if (!$familyId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID da familia invalido']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT id, full_name, confirmed
    FROM wp_torti_guests
    WHERE family_id = :family_id AND invited_cha = :tipo
    ORDER BY id ASC
");
$stmt->execute(['family_id' => $familyId, 'tipo' => $cha_tipo]);
$members = $stmt->fetchAll();

echo json_encode($members);
