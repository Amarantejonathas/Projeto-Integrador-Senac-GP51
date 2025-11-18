// ----------------------
// EXIBIR ALERTA BOOTSTRAP
// ----------------------
function showAlert(msg, type = "danger") {
  document.getElementById("alertContainer").innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

// ----------------------
// NAVEGAÇÃO DE TELAS
// ----------------------
function mostrarLogin() {
  loginSection.classList.add("d-none");
  formLoginSection.classList.remove("d-none");
}

function mostrarCadastro() {
  loginSection.classList.add("d-none");
  cadastroSection.classList.remove("d-none");
}

function voltarInicio() {
  formLoginSection.classList.add("d-none");
  cadastroSection.classList.add("d-none");
  loginSection.classList.remove("d-none");
}

// ----------------------
// CADASTRO DO CLIENTE
// ----------------------
btnCadastrar.onclick = function () {
  const nome = cadNome.value.trim();
  const email = cadEmail.value.trim();
  const senha = cadSenha.value.trim();

  if (!nome || !email || !senha) {
    showAlert("Preencha todos os campos!");
    return;
  }

  localStorage.setItem("clienteDados", JSON.stringify({ nome, email, senha }));

  showAlert("Cadastro realizado com sucesso!", "success");

  setTimeout(() => voltarInicio(), 1200);
};

// ----------------------
// LOGIN DO CLIENTE
// ----------------------
btnLogin.onclick = function () {
  const email = loginEmail.value.trim();
  const senha = loginSenha.value.trim();

  const dados = JSON.parse(localStorage.getItem("clienteDados"));

  if (!dados || dados.email !== email || dados.senha !== senha) {
    showAlert("E-mail ou senha incorretos!");
    return;
  }

  // Login OK
  formLoginSection.classList.add("d-none");
  pesquisaSection.classList.remove("d-none");

  boasVindas.innerHTML = `Bem-vindo, ${dados.nome}!`;
};

// ----------------------
// PESQUISA DE PRESTADORES
// ----------------------
function pesquisarProfissionais() {
  const busca = campoBusca.value.toLowerCase();
  const container = document.getElementById("listaPrestadores");

  container.innerHTML = ""; // limpa

  const prestador = JSON.parse(localStorage.getItem("prestadorDados"));
  if (!prestador) return;

  // Verifica se corresponde à busca
  if (
    prestador.nome.toLowerCase().includes(busca) ||
    prestador.profissao.toLowerCase().includes(busca) ||
    prestador.descricao.toLowerCase().includes(busca)
  ) {
    container.innerHTML = `
      <div class="col-md-4">
        <div class="card p-2">
          <h5>${prestador.nome}</h5>
          <p><strong>${prestador.profissao}</strong></p>
          <p>${prestador.descricao}</p>

          <div class="row">
            ${prestador.fotos
              .map((f) => `<div class="col-6"><img src="${f}" class="img-fluid rounded mb-2"></div>`)
              .join("")}
          </div>

          <button class="btn btn-success" onclick="abrirChat('${prestador.nome}')">Conversar</button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `<p>Nenhum profissional encontrado.</p>`;
  }
}

// ----------------------
// CHAT
// ----------------------
let chatAtivo = "";
let mensagens = [];

function abrirChat(nomePrestador) {
  chatAtivo = nomePrestador;
  pesquisaSection.classList.add("d-none");
  chatSection.classList.remove("d-none");

  chatCom.innerHTML = `Chat com <b>${nomePrestador}</b>`;

  mensagens = JSON.parse(localStorage.getItem("chatMensagens") || "[]");

  renderizarChat();
}

function renderizarChat() {
  chatMensagens.innerHTML = mensagens
    .map((m) => `<p><strong>${m.autor}:</strong> ${m.texto}</p>`)
    .join("");
}

function enviarMensagem() {
  const texto = msgCliente.value.trim();
  if (!texto) return;

  mensagens.push({ autor: "Cliente", texto });

  localStorage.setItem("chatMensagens", JSON.stringify(mensagens));

  msgCliente.value = "";
  renderizarChat();
}

function fecharChat() {
  chatSection.classList.add("d-none");
  pesquisaSection.classList.remove("d-none");
}
