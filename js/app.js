const API = 'api';
const CHA_TIPO = window.CHA_TIPO || 1;
const CHA_DATA = window.CHA_DATA || '2026-11-15T15:00:00-03:00';

// ── Countdown ──
function initCountdown() {
    const target = new Date(CHA_DATA).getTime();
    const elDias = document.getElementById('cd-dias');
    const elHoras = document.getElementById('cd-horas');
    const elMin = document.getElementById('cd-min');
    const elSeg = document.getElementById('cd-seg');

    function update() {
        const diff = target - Date.now();
        if (diff <= 0) {
            elDias.textContent = '0';
            elHoras.textContent = '0';
            elMin.textContent = '0';
            elSeg.textContent = '0';
            return;
        }
        elDias.textContent = Math.floor(diff / 86400000);
        elHoras.textContent = Math.floor((diff % 86400000) / 3600000);
        elMin.textContent = Math.floor((diff % 3600000) / 60000);
        elSeg.textContent = Math.floor((diff % 60000) / 1000);
    }

    update();
    setInterval(update, 1000);
}

// ── RSVP ──
const searchInput = document.getElementById('rsvp-nome');
const searchBtn = document.getElementById('rsvp-buscar-btn');
const resultsDiv = document.getElementById('rsvp-resultados');

let quemConfirmouId = null;

searchBtn.addEventListener('click', function () {
    const nome = searchInput.value.trim();
    const palavras = nome.split(/\s+/).filter(p => p.length > 0);

    if (palavras.length < 2) {
        alert('Por favor, digite seu nome completo (nome e sobrenome).');
        return;
    }

    const textoOriginal = searchBtn.innerHTML;
    searchBtn.disabled = true;
    searchBtn.textContent = 'Buscando...';

    fetch(`${API}/search.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'nome=' + encodeURIComponent(nome) + '&cha_tipo=' + CHA_TIPO,
    })
        .then(r => r.json())
        .then(data => {
            searchBtn.disabled = false;
            searchBtn.innerHTML = textoOriginal;

            if (data.length === 0) {
                resultsDiv.innerHTML =
                    '<p class="rsvp-msg">Nenhum convidado encontrado com esse nome. Confira a grafia ou fale com os noivos.</p>';
                return;
            }

            let html = '<p class="rsvp-msg">Selecione seu nome:</p>';
            data.forEach(g => {
                html += `<button class="rsvp-select-btn" data-family="${g.family_id}" data-id="${g.id}">${esc(g.full_name)}</button>`;
            });
            resultsDiv.innerHTML = html;

            document.querySelectorAll('.rsvp-select-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    quemConfirmouId = this.dataset.id;
                    loadFamily(this.dataset.family);
                });
            });
        })
        .catch(() => {
            searchBtn.disabled = false;
            searchBtn.innerHTML = textoOriginal;
            alert('Ocorreu um erro ao buscar. Tente novamente.');
        });
});

searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn.click();
});

function loadFamily(familyId) {
    fetch(`${API}/family.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'family_id=' + familyId + '&cha_tipo=' + CHA_TIPO,
    })
        .then(r => r.json())
        .then(data => {
            let html = '<p class="rsvp-msg">Marque quem vai comparecer:</p>';
            data.forEach(g => {
                const checked = g.confirmed == 1 ? 'checked' : '';
                const tag = g.confirmed == 1 ? ' <span class="rsvp-ja">(já confirmado)</span>' : '';
                html += `<label class="rsvp-checkbox-label${checked ? ' selecionado' : ''}">
                    <input type="checkbox" class="rsvp-checkbox" value="${g.id}" ${checked}>
                    <span>${esc(g.full_name)}${tag}</span>
                </label>`;
            });

            html += '<label class="rsvp-phone-label">Digite seu telefone:</label>';
            html += '<input type="tel" id="rsvp-telefone" class="rsvp-input" placeholder="(00) 00000-0000">';
            html += '<button id="rsvp-confirmar-btn" class="rsvp-btn rsvp-btn-primary" disabled>Confirmar Presença</button>';

            resultsDiv.innerHTML = html;

            document.querySelectorAll('.rsvp-checkbox').forEach(cb => {
                cb.addEventListener('change', function () {
                    this.closest('.rsvp-checkbox-label').classList.toggle('selecionado', this.checked);
                });
            });

            const telInput = document.getElementById('rsvp-telefone');
            const confirmBtn = document.getElementById('rsvp-confirmar-btn');

            telInput.addEventListener('input', function () {
                let nums = this.value.replace(/\D/g, '').slice(0, 11);
                let fmt = nums;
                if (nums.length > 2) fmt = '(' + nums.slice(0, 2) + ') ' + nums.slice(2);
                if (nums.length > 7) fmt = '(' + nums.slice(0, 2) + ') ' + nums.slice(2, 7) + '-' + nums.slice(7);
                this.value = fmt;
                confirmBtn.disabled = nums.length < 10;
            });

            confirmBtn.addEventListener('click', function () {
                const ids = Array.from(document.querySelectorAll('.rsvp-checkbox:checked')).map(el => el.value);
                const telefone = telInput.value.trim();

                if (ids.length === 0) {
                    alert('Marque ao menos uma pessoa.');
                    return;
                }
                if (telefone.replace(/\D/g, '').length < 10) {
                    alert('Digite um telefone válido com DDD.');
                    return;
                }

                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Confirmando...';

                fetch(`${API}/confirm.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body:
                        'ids=' + ids.join(',') +
                        '&quem_confirmou=' + quemConfirmouId +
                        '&telefone=' + encodeURIComponent(telefone),
                })
                    .then(r => r.json())
                    .then(() => {
                        searchBtn.style.display = 'none';
                        resultsDiv.innerHTML = `
                            <div class="rsvp-sucesso">
                                <div class="rsvp-sucesso-icone">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div class="rsvp-sucesso-texto">Presença confirmada com sucesso!</div>
                                <p class="rsvp-sucesso-sub">Mal podemos esperar para celebrar com você!</p>
                            </div>`;
                    })
                    .catch(() => {
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Confirmar Presença';
                        alert('Erro ao confirmar. Tente novamente.');
                    });
            });

            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', initCountdown);
