const BASE_URL = 'http://10.133.234.14:8080';

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const favicon = document.getElementById('favicon');
    const form = document.getElementById('form');
    const submitBtn = document.getElementById('submit');

    // --- MODO DARK ---
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
        favicon.setAttribute('href', 'icon-dark.png');
    }

    themeToggle?.addEventListener('change', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        favicon.setAttribute('href', isDarkMode ? 'icon-dark.png' : 'icon-light.png');
    });

    carregarPedidos();

    // --- SALVAR / ATUALIZAR ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('orderId').value;

        const dados = {
            nomeSolicitante: document.getElementById('nome').value,
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            dataPedido: document.getElementById('dataPedido').value
                ? new Date(document.getElementById('dataPedido').value).toISOString()
                : new Date().toISOString(),
            dataEntrega: document.getElementById('dataEntrega').value
                ? new Date(document.getElementById('dataEntrega').value).toISOString()
                : null
        };

        try {
            const url = id ? `${BASE_URL}/update/${id}` : `${BASE_URL}/addorder`;
            const response = await fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                alert(id ? "Pedido atualizado!" : "Pedido enviado!");
                form.reset();
                document.getElementById('orderId').value = '';
                if (submitBtn) submitBtn.textContent = "Salvar Pedido";
                carregarPedidos();
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    });
});

// --- FUNÇÕES GLOBAIS ---

async function carregarPedidos() {
    const orderList = document.getElementById('orderList');
    const filtroData = document.getElementById('filtroData')?.value || 'desc';

    try {
        const response = await fetch(`${BASE_URL}/`);
        let pedidos = await response.json();

        // Ordenação por Data
        pedidos.sort((a, b) => {
            const da = new Date(a.dataPedido);
            const db = new Date(b.dataPedido);
            return filtroData === 'asc' ? da - db : db - da;
        });

        orderList.innerHTML = '';

        pedidos.forEach(p => {
            const pedidoJSON = JSON.stringify(p).replace(/'/g, "\\'");
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${p.nomeSolicitante}</strong> - ${p.titulo}</span>
                <div style="display: flex; gap: 5px;">
                    <button onclick='mostrarDesc(${pedidoJSON})' class="btn-acao btn-info">i</button>
                    <button onclick='prepararEdicao(${pedidoJSON})' class="btn-acao btn-edit">✎</button>
                    <button onclick="deletarPedido(${p.id})" class="btn-acao btn-del">✖</button>
                </div>
            `;
            orderList.appendChild(li);
        });
    } catch (error) { console.error('Erro ao listar:', error); }
}

function mostrarDesc(p) {
    const modal = document.getElementById('modalDesc');
    const conteudo = document.getElementById('modalConteudo');
    const btnDownload = document.getElementById('btnDownload');
    const containerDownload = document.getElementById('containerDownload');

    // Identifica links de arquivos na descrição
    const regexLink = /(https?:\/\/[^\s]+\.(stl|glb|3mf|png|jpg|jpeg))/i;
    const match = p.descricao.match(regexLink);
    const textoSemLink = p.descricao.replace(regexLink, '').trim();

    conteudo.innerHTML = `
        <h3 style="margin-top:0">${p.titulo}</h3>
        <p><strong>Solicitante:</strong> ${p.nomeSolicitante}</p>
        <p><strong>Descrição:</strong> ${textoSemLink || 'Sem observações adicionais.'}</p>
        <p><strong>Status:</strong> ${match ? '✅ Arquivo Disponível' : '⏳ Aguardando Modelo'}</p>
        <p style="display:inline;"><small><strong>Pedido em: </strong>${p.dataPedido ? new Date(p.dataPedido).toLocaleDateString('pt-BR') : '---'}</small></p>
        <p style="display:inline;"><small><strong>Prazo: </strong>${p.dataEntrega ? new Date(p.dataEntrega).toLocaleDateString('pt-BR') : '---'}</small></p>
        `;

    // // Lógica para mostrar botão de download se houver link
    // if (match && btnDownload && containerDownload) {
    //     btnDownload.href = match[0];
    //     containerDownload.style.display = "block";
    // } else if (containerDownload) {
    //     containerDownload.style.display = "none";
    // }

    modal.style.display = "block";
}

function fecharModal() {
    document.getElementById('modalDesc').style.display = "none";
}

window.onclick = (e) => {
    if (e.target == document.getElementById('modalDesc')) fecharModal();
};

function prepararEdicao(p) {
    document.getElementById('orderId').value = p.id;
    document.getElementById('nome').value = p.nomeSolicitante;
    document.getElementById('titulo').value = p.titulo;
    document.getElementById('descricao').value = p.descricao;

    if (p.dataPedido) document.getElementById('dataPedido').value = p.dataPedido.split('T')[0];
    if (p.dataEntrega) document.getElementById('dataEntrega').value = p.dataEntrega.split('T')[0];

    document.getElementById('submit').textContent = "Atualizar Pedido";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletarPedido(id) {
    if (!confirm('Excluir este pedido?')) return;
    try {
        await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
        carregarPedidos();
    } catch (error) { alert('Erro ao deletar'); }
}
