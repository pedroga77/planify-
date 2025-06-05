const selectCategoria = document.getElementById('categoria');
const selectEstados = document.getElementById('estados');
const API_URL = 'http://localhost:3030/v1/planify/evento';
const container = document.getElementById('eventos-container');
let todosEventos = [];
let estadosMap = {};

document.addEventListener('DOMContentLoaded', async () => {
  await carregarEstados();
  await loadEventos();
  await carregarCategorias();
});

// Filtro unificado
selectCategoria.addEventListener('change', filtrarEventos);
selectEstados.addEventListener('change', filtrarEventos);

function filtrarEventos() {
  const categoriaSelecionada = selectCategoria.value;
  const estadoSelecionado = selectEstados.value;

  let eventosFiltrados = todosEventos;

  if (categoriaSelecionada) {
    eventosFiltrados = eventosFiltrados.filter(e =>
      Array.isArray(e.categoria) &&
      e.categoria.some(cat => String(cat.id_categoria) === categoriaSelecionada)
    );
  }

  if (estadoSelecionado) {
    eventosFiltrados = eventosFiltrados.filter(e =>
      String(e.id_estado) === estadoSelecionado
    );
  }

  renderizarEventos(eventosFiltrados);
}

async function carregarEstados() {
  try {
    const resposta = await fetch('http://localhost:3030/v1/planify/estado');
    const dados = await resposta.json();
    const estados = dados.estado || dados;

    estadosMap = {};
    selectEstados.innerHTML = '<option value="">Todos os estados</option>';

    estados.forEach(estado => {
      estadosMap[estado.id_estado] = estado.estado;
      const option = document.createElement('option');
      option.value = estado.id_estado;
      option.textContent = estado.estado;
      selectEstados.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar estados:", erro);
    selectEstados.innerHTML = '<option disabled selected>Erro ao carregar estados</option>';
  }
}

async function carregarCategorias() {
  try {
    const resposta = await fetch('http://localhost:3030/v1/planify/categoria');
    const dados = await resposta.json();
    const categorias = dados.categoria || dados;

    selectCategoria.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id_categoria;
      option.textContent = cat.categoria;
      selectCategoria.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar categorias:", erro);
    selectCategoria.innerHTML = '<option disabled selected>Erro ao carregar categorias</option>';
  }
}

async function loadEventos() {
  try {
    const resposta = await fetch(API_URL);
    const dados = await resposta.json();
    todosEventos = dados.eventos || [];
    renderizarEventos(todosEventos);

    if (todosEventos.length === 0) {
      container.innerHTML = '<p>Nenhum evento encontrado.</p>';
    }
  } catch (erro) {
    console.error('Erro ao carregar eventos:', erro);
    container.innerHTML = '<p>Não foi possível carregar os eventos.</p>';
  }
}

function renderizarEventos(eventos) {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  const id_usuario_logado = usuarioLogado?.id_usuario;

  container.innerHTML = '';

  eventos.forEach(e => {
    const usuario = e.usuario?.[0] || {};
    const categoria = Array.isArray(e.categoria)
      ? e.categoria.map(cat => cat.categoria).join(", ")
      : "Sem categoria";

    const estado = estadosMap[e.id_estado] || "Não identificado";
    const data = new Date(e.data_evento).toLocaleDateString('pt-BR');
    const hora = new Date(e.horario).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
    const valor = parseFloat(e.valor_ingresso).toFixed(2);

    const card = document.createElement('div');
    card.classList.add('card-evento');
    card.innerHTML = `
      <img src="${e.imagem}" alt="${e.titulo}" style="width: 100%; border-radius: 10px; max-height: 180px; object-fit: cover;" />
      <h3>${e.titulo}</h3>
      <p>${e.descricao}</p>
      <p><strong>Data:</strong> ${data} às ${hora}</p>
      <p><strong>Local:</strong> ${e.local}</p>
      <p><strong>Estado:</strong> ${estado}</p>
      <p><strong>Ingresso:</strong> R$ ${valor}</p>
      <p><strong>Categoria:</strong> ${categoria}</p>
      <p><strong>Organizador:</strong> ${usuario.nome || 'Desconhecido'} ${usuario.id_usuario === id_usuario_logado ? "(você)" : ""}</p>
      <a href="${e.linkCompra}" class="compra">Comprar</a>
    `;
    container.appendChild(card);
  });
}
