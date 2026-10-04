<?php
require_once __DIR__ . '/config.php';

$familyId = filter_input(INPUT_POST, 'family_id', FILTER_VALIDATE_INT)
          ?: filter_input(INPUT_GET, 'family_id', FILTER_VALIDATE_INT);

if (!$familyId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID da familia invalido']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT id, full_name, confirmed
    FROM wp_torti_guests
    WHERE family_id = :family_id AND invited_cha = 1
    ORDER BY id ASC
");
$stmt->execute(['family_id' => $familyId]);
$members = $stmt->fetchAll();

echo json_encode($members);
