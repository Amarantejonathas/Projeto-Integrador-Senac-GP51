// Mostrar/ocultar seções
function mostrarLogin() {
  document.getElementById('loginSection').classList.add('d-none');
  document.getElementById('formLoginSection').classList.remove('d-none');
}

function mostrarCadastro() {
  document.getElementById('loginSection').classList.add('d-none');
  document.getElementById('cadastroSection').classList.remove('d-none');
}

function voltarInicio() {
  document.querySelectorAll('#formLoginSection, #cadastroSection').forEach(el => el.classList.add('d-none'));
  document.getElementById('loginSection').classList.remove('d-none');
}

// Função para mostrar alerta do Bootstrap
function mostrarAlerta(mensagem, tipo = "danger") {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  // Fecha automaticamente após 3 segundos
  setTimeout(() => {
    const alerta = bootstrap.Alert.getOrCreateInstance(alertContainer.querySelector(".alert"));
    alerta.close();
  }, 3000);
}

// Cadastro
document.getElementById("btnCadastrar").addEventListener("click", () => {
  const nome = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const senha = document.getElementById('cadSenha').value.trim();

  if (nome && email && senha) {
    localStorage.setItem('clienteNome', nome);
    localStorage.setItem('clienteEmail', email);
    localStorage.setItem('clienteSenha', senha);
    alert('Cadastro realizado com sucesso!');
    voltarInicio();
  } else {
    alert('Por favor, preencha todos os campos.');
  }
});

// Validação de login
document.getElementById("btnLogin").addEventListener("click", () => {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const emailCadastrado = localStorage.getItem('clienteEmail');
  const senhaCadastrada = localStorage.getItem('clienteSenha');
  const nomeCadastrado = localStorage.getItem('clienteNome');

  if (email === emailCadastrado && senha === senhaCadastrada) {
    document.getElementById('formLoginSection').classList.add('d-none');
    document.getElementById('pesquisaSection').classList.remove('d-none');
    document.getElementById('boasVindas').textContent = `Bem-vindo(a), ${nomeCadastrado}!`;
  } else {
    mostrarAlerta("E-mail ou senha incorretos. Tente novamente.", "danger");
  }
});

// Fluxo do serviço
document.getElementById("btnPesquisar").addEventListener("click", () => {
  document.getElementById('pesquisaSection').classList.add('d-none');
  document.getElementById('resultadoSection').classList.remove('d-none');
});

document.getElementById("btnContratar").addEventListener("click", () => {
  document.getElementById('resultadoSection').classList.add('d-none');
  document.getElementById('confirmacaoSection').classList.remove('d-none');
});

document.getElementById("btnPagar").addEventListener("click", () => {
  document.getElementById('confirmacaoSection').classList.add('d-none');
  document.getElementById('avaliacaoSection').classList.remove('d-none');
});
