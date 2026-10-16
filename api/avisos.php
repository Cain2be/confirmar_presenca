<?php
// Textos dos avisos no grupo do WhatsApp (confirmação de presença e presente escolhido).
require_once __DIR__ . '/whatsapp.php';

// Uma mensagem por evento (família ou amigos) com as pessoas recém-confirmadas e o total.
function avisar_confirmacao(PDO $pdo, array $novos, $quem_confirmou): void
{
    $eventos = [
        1 => ['titulo' => 'Chá em família (15/11)', 'total' => 'no chá em família'],
        2 => ['titulo' => 'Chá dos amigos (21/11)', 'total' => 'no chá dos amigos'],
    ];

    $quem = null;
    if ($quem_confirmou) {
        $st = $pdo->prepare('SELECT full_name FROM wp_torti_guests WHERE id = ?');
        $st->execute([$quem_confirmou]);
        $quem = $st->fetchColumn() ?: null;
    }
    $quemEhNovo = in_array((int)$quem_confirmou, array_map(fn($g) => (int)$g['id'], $novos), true);

    $porEvento = [];
    foreach ($novos as $g) $porEvento[(int)$g['invited_cha']][] = trim($g['full_name']);

    foreach ($porEvento as $tipo => $nomes) {
        $evento = $eventos[$tipo] ?? ['titulo' => 'Chá de Casa', 'total' => 'no chá'];
        $st = $pdo->prepare('SELECT COUNT(*) AS convidados, SUM(confirmed = 1) AS confirmados FROM wp_torti_guests WHERE invited_cha = ?');
        $st->execute([$tipo]);
        $t = $st->fetch();

        $n = count($nomes);
        $pessoas = $n === 1 ? '1 pessoa' : "$n pessoas";
        $autor = trim($quem ?? $nomes[0]);
        $verbo = $quemEhNovo || $quem === null ? 'confirmou' : 'confirmou mais';

        $texto = "✅ *Nova confirmação · {$evento['titulo']}*\n"
            . "$autor $verbo $pessoas:\n"
            . whatsapp_lista($nomes) . "\n\n"
            . "Total confirmado {$evento['total']}: " . (int)$t['confirmados'] . ' de ' . (int)$t['convidados'];
        whatsapp_enviar($texto);
    }
}

// Aviso de mudança num presente do Meu Chá de Panela. $antes / $depois: ['nome' => ..., 'email' => ...]
// de quem tinha / tem o presente, ou null. Troca de convidado entre duas leituras vira uma mensagem só
// (remoção + escolha), para um reenvio nunca duplicar metade do aviso. Sem nada a avisar: null.
function texto_presente(?array $antes, ?array $depois, string $presente): ?string
{
    $quem = fn(array $c) => ($c['nome'] !== '' ? $c['nome'] : 'Alguém') . ($c['email'] !== '' ? " ({$c['email']})" : '');
    $partes = [];
    if ($antes) $partes[] = "↩️ *Presente liberado*\n" . $quem($antes) . " removeu a seleção de *$presente*";
    if ($depois) $partes[] = "🎁 *Presente escolhido*\n" . $quem($depois) . " escolheu *$presente*";
    return $partes ? implode("\n\n", $partes) : null;
}
