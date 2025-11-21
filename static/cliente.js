// =======================
// Integração com API Flask
// =======================

// ----------------------
// NAVEGAÇÃO ENTRE TELAS (CORREÇÃO REQUERIDA)
// ----------------------

function mostrarLogin() {
    window.location.href = "login_cliente.html";
}

function mostrarCadastro() {
    window.location.href = "cadastro_cliente.html";
}

// ----------------------
// Elementos do DOM
// ----------------------
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const buscarBtn = document.getElementById("btn-buscar");
const campoBusca = document.getElementById("campo-busca");
const listaPrestadores = document.getElementById("lista-prestadores");

// ----------- Função auxiliar ----------- //
function getToken() {
    return localStorage.getItem("token_cliente") || "";
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}

// ==============================
// CADASTRO DO CLIENTE
// ==============================
if (formCadastro) {
    formCadastro.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nome = document.getElementById("cad-nome").value.trim();
        const email = document.getElementById("cad-email").value.trim();
        const senha = document.getElementById("cad-senha").value;

        const res = await fetch("/api/client/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Erro ao cadastrar");
            return;
        }

        alert("Cadastro realizado com sucesso!");
        window.location.href = "cliente.html";
    });
}

// ==============================
// LOGIN DO CLIENTE
// ==============================
if (formLogin) {
    formLogin.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const senha = document.getElementById("login-senha").value;

        const res = await fetch("/api/client/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Login inválido");
            return;
        }

        localStorage.setItem("token_cliente", data.token);
        localStorage.setItem("cliente_id", data.cliente.id);

        alert("Login realizado!");
        window.location.href = "cliente.html";
    });
}

// ==============================
// BUSCAR PRESTADORES
// ==============================
if (buscarBtn) {
    buscarBtn.addEventListener("click", async function () {
        const termo = campoBusca.value.trim();

        const res = await fetch(`/api/providers?q=${encodeURIComponent(termo)}`);
        const providers = await res.json();

        listaPrestadores.innerHTML = "";

        if (providers.length === 0) {
            listaPrestadores.innerHTML = "<p>Nenhum prestador encontrado.</p>";
            return;
        }

        providers.forEach(p => {
            listaPrestadores.innerHTML += `
                <div class="card p-3 mb-2">
                    <h4>${p.nome}</h4>
                    <b>Profissão:</b> ${p.profissao}<br>
                    <b>Descrição:</b> ${p.descricao}<br><br>
                    <button class="btn btn-primary" onclick="abrirChat(${p.id})">
                        Conversar com o prestador
                    </button>
                </div>
            `;
        });
    });
}

// ==============================
// ABRIR CHAT
// ==============================
async function abrirChat(provider_id) {
    localStorage.setItem("chat_provider_id", provider_id);
    window.location.href = "chat_cliente.html"; 
}

// ==============================
// ENVIAR MENSAGEM (CLIENTE → PRESTADOR)
// ==============================
async function enviarMensagemCliente(texto) {
    const provider_id = localStorage.getItem("chat_provider_id");

    const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            provider_id,
            texto
        })
    });

    return await res.json();
}
