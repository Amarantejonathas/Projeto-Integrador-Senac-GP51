function mostrarCadastro(tipo) {
  if (tipo === 'cliente') {
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('cadastroSection').classList.remove('d-none');
  } else {
    document.getElementById('loginPrestador').classList.add('d-none');
    document.getElementById('cadastroPrestador').classList.remove('d-none');
  }
}

function fazerLogin(tipo) {
  if (tipo === 'cliente') {
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('pesquisaSection').classList.remove('d-none');
  } else {
    document.getElementById('loginPrestador').classList.add('d-none');
    document.getElementById('notificacaoSection').classList.remove('d-none');
  }
}

function pesquisarProfissionais() {
  document.getElementById('cadastroSection').classList.add('d-none');
  document.getElementById('pesquisaSection').classList.remove('d-none');
}

function mostrarProfissionais() {
  document.getElementById('pesquisaSection').classList.add('d-none');
  document.getElementById('resultadoSection').classList.remove('d-none');
}

function confirmarContratacao() {
  document.getElementById('resultadoSection').classList.add('d-none');
  document.getElementById('confirmacaoSection').classList.remove('d-none');
}

function finalizarServico() {
  document.getElementById('confirmacaoSection').classList.add('d-none');
  document.getElementById('avaliacaoSection').classList.remove('d-none');
}

function notificarCliente() {
  document.getElementById('cadastroPrestador').classList.add('d-none');
  document.getElementById('notificacaoSection').classList.remove('d-none');
}

function abrirChat() {
  document.getElementById('notificacaoSection').classList.add('d-none');
  document.getElementById('chatSection').classList.remove('d-none');
}

function clienteContrata() {
  document.getElementById('chatSection').classList.add('d-none');
  document.getElementById('pagamentoSection').classList.remove('d-none');
}

function finalizarAtendimento() {
  document.getElementById('pagamentoSection').classList.add('d-none');
  document.getElementById('avaliacaoPrestador').classList.remove('d-none');
}
