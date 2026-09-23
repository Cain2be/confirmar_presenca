<?php
require_once __DIR__ . '/config.php';

$termo = trim($_POST['nome'] ?? $_GET['nome'] ?? '');

function remove_accents_custom($str) {
    $map = [
        'á'=>'a','à'=>'a','ã'=>'a','â'=>'a','ä'=>'a',
        'é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
        'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i',
        'ó'=>'o','ò'=>'o','õ'=>'o','ô'=>'o','ö'=>'o',
        'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u',
        'ç'=>'c','ñ'=>'n',
        'Á'=>'A','À'=>'A','Ã'=>'A','Â'=>'A','Ä'=>'A',
        'É'=>'E','È'=>'E','Ê'=>'E','Ë'=>'E',
        'Í'=>'I','Ì'=>'I','Î'=>'I','Ï'=>'I',
        'Ó'=>'O','Ò'=>'O','Õ'=>'O','Ô'=>'O','Ö'=>'O',
        'Ú'=>'U','Ù'=>'U','Û'=>'U','Ü'=>'U',
        'Ç'=>'C','Ñ'=>'N',
    ];
    return strtr($str, $map);
}

$termo_normalizado = mb_strtolower(remove_accents_custom($termo), 'UTF-8');
$palavras_busca = array_filter(preg_split('/\s+/', $termo_normalizado));

if (count($palavras_busca) < 2) {
    echo json_encode([]);
    exit;
}

$stmt = $pdo->query("SELECT id, full_name, family_id FROM wp_torti_guests");
$todos = $stmt->fetchAll();

$encontrados = [];
foreach ($todos as $convidado) {
    $nome_normalizado = mb_strtolower(remove_accents_custom(trim($convidado['full_name'])), 'UTF-8');
    $palavras_nome = array_filter(preg_split('/\s+/', $nome_normalizado));

    $correspondencias = 0;
    foreach ($palavras_busca as $palavra) {
        if (in_array($palavra, $palavras_nome)) {
            $correspondencias++;
        }
    }

    if ($correspondencias >= 2) {
        $encontrados[] = [
            'id' => (int)$convidado['id'],
            'full_name' => $convidado['full_name'],
            'family_id' => (int)$convidado['family_id'],
        ];
    }
}

echo json_encode($encontrados);
