// =======================
// Integração com API Flask
// =======================

const formCadastroPrest = document.getElementById("form-cad-prestador");
const formLoginPrest = document.getElementById("form-login-prestador");
const notificacoesDiv = document.getElementById("notificacoes");

// Auxiliares
function getTokenPrestador() {
    return localStorage.getItem("token_prestador") || "";
}

function authHeadersPrestador() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getTokenPrestador()}`
    };
}

// ==============================
// CADASTRO DE PRESTADOR
// ==============================
if (formCadastroPrest) {
    formCadastroPrest.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nome = document.getElementById("prest-nome").value.trim();
        const email = document.getElementById("prest-email").value.trim();
        const profissao = document.getElementById("prest-profissao").value.trim();
        const descricao = document.getElementById("prest-descricao").value.trim();
        const senha = document.getElementById("prest-senha").value;

        // Fotos (convertidas em base64)
        const fotosInput = document.getElementById("prest-fotos");
        let fotosBase64 = [];

        if (fotosInput.files.length > 0) {
            for (const file of fotosInput.files) {
                const base64 = await fileToBase64(file);
                fotosBase64.push(base64);
            }
        }

        const res = await fetch("/api/provider/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                nome,
                email,
                profissao,
                descricao,
                senha,
                fotos: fotosBase64
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Erro ao cadastrar prestador");
            return;
        }

        alert("Prestador cadastrado com sucesso!");
        window.location.href = "prestador.html";
    });
}

// Função auxiliar p/ foto → Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==============================
// LOGIN DO PRESTADOR
// ==============================
if (formLoginPrest) {
    formLoginPrest.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("login-prest-email").value.trim();
        const senha = document.getElementById("login-prest-senha").value;

        const res = await fetch("/api/provider/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Erro no login");
            return;
        }

        localStorage.setItem("token_prestador", data.token);
        localStorage.setItem("prestador_id", data.provider.id);

        alert("Login efetuado!");
        window.location.href = "prestador.html";
    });
}

// ==============================
// NOTIFICAÇÕES (mensagens de clientes)
// ==============================
async function carregarNotificacoes() {
    const res = await fetch("/api/provider/notifications", {
        headers: authHeadersPrestador()
    });

    const msgs = await res.json();

    if (!Array.isArray(msgs)) {
        notificacoesDiv.innerHTML = "<p>Erro ao carregar notificações.</p>";
        return;
    }

    notificacoesDiv.innerHTML = "";

    msgs.forEach(msg => {
        notificacoesDiv.innerHTML += `
            <div class="card p-2 mb-2">
                <b>Cliente ID:</b> ${msg.from_client_id}<br>
                <b>Mensagem:</b> ${msg.texto}<br>
                <button class="btn btn-success mt-1" onclick="abrirChatPrestador(${msg.from_client_id})">
                    Responder
                </button>
            </div>
        `;
    });
}

// Abrir chat para responder cliente
function abrirChatPrestador(client_id) {
    localStorage.setItem("chat_client_id", client_id);
    window.location.href = "chat_prestador.html";
}

// Enviar mensagem de prestador → cliente
async function enviarMensagemPrestador(texto) {
    const client_id = localStorage.getItem("chat_client_id");

    const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: authHeadersPrestador(),
        body: JSON.stringify({
            client_id,
            texto
        })
    });

    return await res.json();
}
