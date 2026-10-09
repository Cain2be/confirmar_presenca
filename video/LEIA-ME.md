# Vídeos tutoriais (30s, 1920x1080)

| Arquivo | O que é |
|---|---|
| `tutorial.html` | "Como confirmar presença" → `como-confirmar-presenca.mp4` |
| `presentes.html` | "Como dar um presente" (lista do Meu Chá de Panela) → `como-dar-presente.mp4` |
| `engine.css`, `engine.js` | Base comum: celular, títulos, cartões, leque final, encerramento com a logo e a música |
| `render.js` | Grava o MP4 quadro a quadro |

Abrindo um dos HTML no navegador, o botão "Assistir" toca com som.

## Foto e logo
Os vídeos usam as mesmas imagens do site, definidas no topo de `engine.js`:
- `PHOTO_SRC = '../img/casal.jpg'` (foto do hero)
- `LOGO_SRC = '../img/logo-cl.png'` (logo dourada com fundo transparente)

Para trocar, substitua o arquivo em `img/` e grave de novo. No site, use um nome de arquivo novo
(o `.htaccess` guarda imagens em cache por 1 mês) e atualize `index.html` e `amigos.html`.

## Regras da animação
Tudo roda numa única timeline GSAP pausada (`tl`), para o vídeo poder ser gravado frame a frame:
nada de `animation`/`transition` em CSS, `setInterval` ou `onUpdate` mudando estado.
Textos com o TextPlugin (`text:`), visibilidade com `autoAlpha`.
Tempos de cada cena em `T`, `SUCCESS_T` e `TAPS` no topo de cada HTML; textos de exemplo nas constantes logo acima.

## Gravar
Precisa de Node, ffmpeg, `npm i playwright-core` e o headless shell do Playwright
(`npx playwright install chromium-headless-shell`). O Chrome do sistema em modo headless travou: use o headless shell.

```
node video/render.js video/tutorial.html snap pasta 2.4 9.2 17.6     # PNGs para conferir
node video/render.js video/tutorial.html video video/como-confirmar-presenca.mp4
```
Leva ~1 min por vídeo. Variáveis opcionais: `FFMPEG` (caminho do ffmpeg), `CHROME` (caminho do headless shell).
`window.seekTo` não pode devolver a timeline (o Playwright trava tentando serializá-la).

Os MP4 não vão para o git.
