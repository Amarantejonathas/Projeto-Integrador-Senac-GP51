// --------------------------------------------
// Bootstrap alert helper
// --------------------------------------------
function showAlert(containerId, msg, type = "danger", time = 3000) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  setTimeout(() => container.innerHTML = "", time);
}

// --------------------------------------------
// Mostrar Formulário de Login
// --------------------------------------------
function mostrarLogin(tipo) {
  if (tipo === "prestador") {
    document.getElementById("loginPrestador").classList.add("d-none");
    document.getElementById("formLoginPrestador").classList.remove("d-none");
  }
}

function mostrarCadastro(tipo) {
  if (tipo === "prestador") {
    document.getElementById("loginPrestador").classList.add("d-none");
    document.getElementById("cadastroPrestador").classList.remove("d-none");
  }
}

function voltarInicioPrestador() {
  document.getElementById("formLoginPrestador")?.classList.add("d-none");
  document.getElementById("cadastroPrestador")?.classList.add("d-none");
  document.getElementById("loginPrestador")?.classList.remove("d-none");
}

// --------------------------------------------
// Conversão de imagens para Base64
// --------------------------------------------
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// --------------------------------------------
// Cadastro do prestador (INCLUINDO FOTOS)
// --------------------------------------------
async function cadastrarPrestador() {
  const nome = cadNomePrestador.value.trim();
  const email = cadEmailPrestador.value.trim();
  const profissao = cadProfissaoPrestador.value.trim();
  const senha = cadSenhaPrestador.value.trim();
  const descricao = cadDescricaoPrestador.value.trim();
  const fotos = cadFotosPrestador.files;

  if (!nome || !email || !profissao || !senha || !descricao) {
    showAlert("alertContainerCadastroPrestador", "Preencha todos os campos!", "danger");
    return;
  }

  // Converter fotos para base64
  const fotosBase64 = [];
  for (let foto of fotos) {
    fotosBase64.push(await fileToBase64(foto));
  }

  // salvar prestador no localStorage
  const prestadorData = {
    nome,
    email,
    profissao,
    senha,
    descricao,
    fotos: fotosBase64
  };

  localStorage.setItem("prestadorDados", JSON.stringify(prestadorData));

  showAlert("alertContainerCadastroPrestador", "Cadastro realizado com sucesso!", "success");

  setTimeout(() => voltarInicioPrestador(), 1200);
}

// --------------------------------------------
// LOGIN - agora usa senha cadastrada
// --------------------------------------------
function validarLoginPrestador() {
  const email = loginEmailPrestador.value.trim();
  const senha = loginSenhaPrestador.value.trim();

  const saved = JSON.parse(localStorage.getItem("prestadorDados"));

  if (!saved) {
    showAlert("alertContainerPrestador", "Nenhum prestador cadastrado!", "danger");
    return;
  }

  if (email === saved.email && senha === saved.senha) {
    showAlert("alertContainerPrestador", "Login realizado!", "success");

    setTimeout(() => {
      document.getElementById("formLoginPrestador").classList.add("d-none");
      document.getElementById("notificacaoSection").classList.remove("d-none");
    }, 900);

  } else {
    showAlert("alertContainerPrestador", "E-mail ou senha incorretos!", "danger");
  }
}

// --------------------------------------------
// Fluxo normal
// --------------------------------------------
function abrirChat() {
  notificacaoSection.classList.add("d-none");
  chatSection.classList.remove("d-none");
}

function clienteContrata() {
  chatSection.classList.add("d-none");
  pagamentoSection.classList.remove("d-none");
}

function finalizarAtendimento() {
  pagamentoSection.classList.add("d-none");
  avaliacaoPrestador.classList.remove("d-none");
}

// --------------------------------------------
// CLIENTE: EXIBIR LISTA DE PRESTADORES
// --------------------------------------------
function mostrarPrestadoresParaCliente() {
  const areaLista = document.getElementById("listaPrestadores");
  const container = document.getElementById("prestadoresContainer");

  const prestador = JSON.parse(localStorage.getItem("prestadorDados"));
  if (!prestador) return;

  areaLista.classList.remove("d-none");

  container.innerHTML = `
    <div class="col-md-4">
      <div class="card prestador-card p-2">
        <h5>${prestador.nome}</h5>
        <p><strong>Profissão:</strong> ${prestador.profissao}</p>
        <p>${prestador.descricao}</p>

        <div class="mt-2">
          ${prestador.fotos.map(f => `<img src="${f}" class="mb-2 rounded">`).join("")}
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------
// Eventos automáticos
// --------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  btnCadastrarPrestador.addEventListener("click", cadastrarPrestador);
  btnLoginPrestador.addEventListener("click", validarLoginPrestador);
});
