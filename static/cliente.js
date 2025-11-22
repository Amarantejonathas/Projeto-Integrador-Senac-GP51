// =======================
// cliente.js final
// =======================

function mostrarLogin() { window.location.href = "login_cliente.html"; }
function mostrarCadastro() { window.location.href = "cadastro_cliente.html"; }

const formLogin = document.getElementById("form-login"); // usado nas páginas login_cliente.html
const formCadastro = document.getElementById("form-cadastro"); // usado em cadastro_cliente.html

// elementos na página principal (cliente.html)
const campoBusca = document.getElementById("campoBusca");
const listaPrestadores = document.getElementById("listaPrestadores");

function getToken() { return localStorage.getItem("token_cliente") || ""; }
function authHeaders() { return { "Content-Type":"application/json", "Authorization": `Bearer ${getToken()}` }; }

// Formulário de cadastro (cadastro_cliente.html)
if (formCadastro) {
    formCadastro.addEventListener("submit", async function(e){
        e.preventDefault();
        const nome = document.getElementById("cad-nome").value.trim();
        const email = document.getElementById("cad-email").value.trim();
        const senha = document.getElementById("cad-senha").value;
        try {
            const res = await fetch("/api/client/register", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ nome, email, senha })
            });
            const data = await res.json();
            if (!res.ok) {
                const container = document.getElementById("mensagem");
                if (container) container.innerHTML = `<div class="alert alert-danger">Erro ao realizar cadastro: ${data.error || "Verifique os dados"}</div>`;
                else alert(data.error || "Erro ao cadastrar");
                return;
            }
            const container = document.getElementById("mensagem");
            if (container) container.innerHTML = `<div class="alert alert-success">Cadastro realizado com sucesso!</div>`;
            formCadastro.reset();
            setTimeout(()=>{ window.location.href = "login_cliente.html"; }, 900);
        } catch(err) {
            const container = document.getElementById("mensagem");
            if (container) container.innerHTML = `<div class="alert alert-danger">Erro ao conectar ao servidor.</div>`;
            else alert("Erro ao conectar ao servidor.");
        }
    });
}

// Formulário de login (login_cliente.html)
if (formLogin) {
    formLogin.addEventListener("submit", async function(e){
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const senha = document.getElementById("login-senha").value;
        try {
            const res = await fetch("/api/client/login", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ email, senha })
            });
            const data = await res.json();
            const container = document.getElementById("mensagem-login");
            if (!res.ok) {
                if (container) container.innerHTML = `<div class="alert alert-danger">Erro ao efetuar login: ${data.error || "Dados inválidos"}</div>`;
                else alert(data.error || "Login inválido");
                return;
            }
            localStorage.setItem("token_cliente", data.token);
            localStorage.setItem("cliente_id", data.cliente.id);
            if (container) container.innerHTML = `<div class="alert alert-success">Login realizado! Redirecionando...</div>`;
            setTimeout(()=>{ window.location.href = "cliente.html"; }, 900);
        } catch(err) {
            const container = document.getElementById("mensagem-login");
            if (container) container.innerHTML = `<div class="alert alert-danger">Erro ao conectar ao servidor.</div>`;
            else alert("Erro ao conectar ao servidor.");
        }
    });
}

// Função para pesquisar (cliente.html)
async function pesquisarProfissionais() {
    if (!campoBusca || !listaPrestadores) return;
    const termo = campoBusca.value.trim();
    try {
        const res = await fetch(`/api/providers?q=${encodeURIComponent(termo)}`);
        const providers = await res.json();
        listaPrestadores.innerHTML = "";
        if (!providers.length) {
            listaPrestadores.innerHTML = "<p>Nenhum prestador encontrado.</p>";
            return;
        }
        providers.forEach(p=>{
            const card = document.createElement("div");
            card.className = "card p-3 mb-2";
            card.innerHTML = `
                <h4>${p.nome}</h4>
                <b>Profissão:</b> ${p.profissao}<br>
                <b>Descrição:</b> ${p.descricao}<br><br>
                <button class="btn btn-primary">Conversar com o prestador</button>
            `;
            const btn = card.querySelector("button");
            btn.addEventListener("click",()=>abrirChat(p.id));
            listaPrestadores.appendChild(card);
        });
    } catch(err) {
        alert("Erro ao buscar prestadores.");
    }
}

function abrirChat(provider_id) {
    localStorage.setItem("chat_provider_id", provider_id);
    window.location.href = "chat_cliente.html";
}
