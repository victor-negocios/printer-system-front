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
        favicon.setAttribute('href', 'icon-dark.png'); // Define o ícone ao carregar a página
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

            // Alterna entre o ícone dark e o original
            const novoIcone = isDarkMode ? 'icon-dark.png' : 'icon-light.png';
            favicon.setAttribute('href', novoIcone);
        });
    }


    carregarPedidos();

    // --- SALVAR / ATUALIZAR (POST / PUT) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('orderId').value;

        const dados = {
            nomeSolicitante: document.getElementById('nome').value,
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            dataPedido: document.getElementById('dataPedido').value ? new Date(document.getElementById('dataPedido').value).toISOString() : new Date().toISOString(),
            prazo: document.getElementById('dataEntrega').value ? new Date(document.getElementById('dataEntrega').value).toISOString() : null,
            dataEntrega: null
        };

        try {
            const url = id ? `${BASE_URL}/update/${id}` : `${BASE_URL}/addorder`;
            const metodo = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                alert(id ? "Pedido atualizado!" : "Pedido enviado!");
                form.reset();
                document.getElementById('orderId').value = '';
                if (submitBtn) submitBtn.textContent = "Enviar Pedido";
                carregarPedidos();
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    });
});

// --- FUNÇÕES GLOBAIS (Devem estar fora do DOMContentLoaded para o onclick funcionar) ---

async function carregarPedidos() {
    const orderList = document.getElementById('orderList');
    // 1. Captura o valor do filtro (se não existir, o padrão é 'desc')
    const filtroData = document.getElementById('filtroData')?.value || 'desc';

    try {
        const response = await fetch(`${BASE_URL}/`);
        let pedidos = await response.json();

        // 2. Lógica de Ordenação por Data
        pedidos.sort((a, b) => {
            const dataA = new Date(a.dataPedido);
            const dataB = new Date(b.dataPedido);

            // Ordem Crescente (Antigos primeiro) ou Decrescente (Recentes primeiro)
            return filtroData === 'asc' ? dataA - dataB : dataB - dataA;
        });

        // 3. Limpa a lista antes de renderizar
        orderList.innerHTML = '';

        // 4. Renderiza os itens ordenados
        pedidos.forEach(p => {
            const dataBrPD = p.dataPedido ? new Date(p.dataPedido).toLocaleDateString('pt-BR') : '---';
            const dataBrPR = p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : '---';

            // Escapa aspas para evitar erro no onclick do HTML
            const pedidoJSON = JSON.stringify(p).replace(/'/g, "\\'");

            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${p.nomeSolicitante}</strong> - ${p.titulo} (${dataBrPD}) - (${dataBrPR})</span>
                <div>
                    <button onclick='mostrarDesc(${p.id})'style="background:#e74c3c; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; margin-left:5px">Detalhes</button>
                    <button onclick='prepararEdicao(${pedidoJSON})' style="background:var(--editar-cor); color:white; border:none; padding:5px; border-radius:4px; cursor:pointer" class='editar'>Editar</button>
                    <button onclick="deletarPedido(${p.id})" style="background:#e74c3c; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; margin-left:3px">X</button>
                </div>
            `;
            orderList.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao listar:', error);
    }
}


function prepararEdicao(pedido) {
    document.getElementById('orderId').value = pedido.id;
    document.getElementById('nome').value = pedido.nomeSolicitante;
    document.getElementById('titulo').value = pedido.titulo;
    document.getElementById('descricao').value = pedido.descricao;

    const submitBtn = document.getElementById("submit");
    if (submitBtn) submitBtn.textContent = "Atualizar Pedido";

    if (pedido.dataPedido) {
        document.getElementById('dataPedido').value = pedido.dataPedido.split('T')[0];
    }
    if (pedido.prazo) {
        document.getElementById('dataEntrega').value = pedido.prazo.split('T')[0];
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletarPedido(id) {
    if (!confirm('Excluir este pedido?')) return;
    try {
        await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
        carregarPedidos();
    } catch (error) {
        alert('Erro ao deletar');
    }
}

function mostrarDesc(id){
    
}