// Grava um vídeo HTML (timeline GSAP pausada) quadro a quadro.
//
//   node video/render.js video/presentes.html video saida.mp4
//   node video/render.js video/presentes.html snap pasta 2.4 9.2 17.6
//
// A página precisa expor, com ?render: window.READY, window.seekTo(t) e window.renderAudio() (WAV em base64).
// Requisitos: Node, `npm i playwright-core`, ffmpeg e o Chromium headless shell do Playwright
// (`npx playwright install chromium-headless-shell`). O Chrome do sistema em modo headless travou: use o headless shell.
// Variáveis opcionais: CHROME (caminho do executável), FFMPEG (caminho do ffmpeg), FPS (padrão 30).
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

function findChrome() {
    if (process.env.CHROME) return process.env.CHROME;
    const base = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.cache'), 'ms-playwright');
    const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(d => d.startsWith('chromium_headless_shell-')).sort().reverse() : [];
    for (const d of dirs) {
        for (const exe of ['chrome-headless-shell-win64/chrome-headless-shell.exe', 'chrome-linux/headless_shell', 'chrome-mac/headless_shell']) {
            const p = path.join(base, d, exe);
            if (fs.existsSync(p)) return p;
        }
    }
    throw new Error('Headless shell não encontrado. Rode `npx playwright install chromium-headless-shell` ou defina CHROME.');
}

const [htmlArg, mode, out, ...times] = process.argv.slice(2);
if (!htmlArg || !['video', 'snap'].includes(mode) || !out) {
    console.log('uso: node render.js <pagina.html> video <saida.mp4>\n     node render.js <pagina.html> snap <pasta> <t1> <t2> ...');
    process.exit(1);
}
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = Number(process.env.FPS || 30);

(async () => {
    const browser = await chromium.launch({ executablePath: findChrome(), args: ['--hide-scrollbars', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'] });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('ERRO NA PÁGINA:', e.message));
    const url = pathToFileURL(path.resolve(htmlArg)).href + '?render';
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
    const total = await page.evaluate(() => window.tl_duration);

    if (mode === 'snap') {
        fs.mkdirSync(out, { recursive: true });
        for (const s of times) {
            const t = parseFloat(s);
            await page.evaluate(t => window.seekTo(t), t);
            await page.screenshot({ path: path.join(out, `t_${t.toFixed(2)}.png`) });
            console.log('quadro', t.toFixed(2));
        }
    } else {
        const wav = path.join(os.tmpdir(), `render-audio-${process.pid}.wav`);
        fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.renderAudio()), 'base64'));
        const frames = Math.round(total * FPS);
        const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
            '-map', '0:v', '-map', '1:a', '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
            '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', '44100',
            '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'pipe'] });
        let ffErr = ''; ff.stderr.on('data', d => { ffErr = (ffErr + d).slice(-4000); });
        const t0 = Date.now();
        for (let f = 0; f < frames; f++) {
            await page.evaluate(t => window.seekTo(t), f / FPS);
            const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
            if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
            if (f % 90 === 0) console.log(`quadro ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
        }
        ff.stdin.end();
        const code = await new Promise(r => ff.on('close', r));
        fs.rmSync(wav, { force: true });
        if (code !== 0) { console.error(ffErr); process.exit(1); }
        console.log(`${out} pronto em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
