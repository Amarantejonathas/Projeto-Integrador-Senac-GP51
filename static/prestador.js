// =======================
// prestador.js corrigido
// =======================

// Exibir alertas formatados
function showAlertPrest(containerId, html) {
    const c = document.getElementById(containerId);
    if (c) c.innerHTML = html;
    else alert(html.replace(/<[^>]*>?/gm, ""));
}

// Helpers
function getTokenPrestador() {
    return localStorage.getItem("token_prestador") || "";
}

function authHeadersPrestador() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getTokenPrestador()}`
    };
}

// =========================
// LOGIN DO PRESTADOR
// =========================

const btnLoginPrest = document.getElementById("btnLoginPrestador");
if (btnLoginPrest) {
    btnLoginPrest.addEventListener("click", async function () {

        const email = document.getElementById("loginEmailPrestador").value.trim();
        const senha = document.getElementById("loginSenhaPrestador").value;

        if (!email || !senha) {
            showAlertPrest("alertContainerPrestador",
                `<div class="alert alert-warning">Preencha todos os campos.</div>`);
            return;
        }

        try {
            const res = await fetch("/api/provider/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();

            if (!res.ok) {
                showAlertPrest("alertContainerPrestador",
                    `<div class="alert alert-danger">${data.error || "Erro ao fazer login"}</div>`);
                return;
            }

            // Salvar dados
            localStorage.setItem("token_prestador", data.token);
            localStorage.setItem("prestador_id", data.provider.id);
            localStorage.setItem("prestador_nome", data.provider.nome);

            showAlertPrest("alertContainerPrestador",
                `<div class="alert alert-success">Login realizado! Redirecionando...</div>`);

            setTimeout(() => {
                window.location.href = "prestador.html";
            }, 900);

        } catch (err) {
            showAlertPrest("alertContainerPrestador",
                `<div class="alert alert-danger">Erro ao conectar ao servidor.</div>`);
        }
    });
}

// =========================
// CADASTRO DO PRESTADOR
// =========================

const btnCadastrarPrestador = document.getElementById("btnCadastrarPrestador");

if (btnCadastrarPrestador) {

    btnCadastrarPrestador.addEventListener("click", async function () {

        const nome = document.getElementById("cadNomePrestador").value.trim();
        const email = document.getElementById("cadEmailPrestador").value.trim();
        const profissao = document.getElementById("cadProfissaoPrestador").value.trim();
        const descricao = document.getElementById("cadDescricaoPrestador").value.trim();
        const senha = document.getElementById("cadSenhaPrestador").value;
        const fotosInput = document.getElementById("cadFotosPrestador");

        let fotosBase64 = [];

        if (fotosInput && fotosInput.files.length > 0) {
            for (const file of fotosInput.files) {
                fotosBase64.push(await fileToBase64(file));
            }
        }

        if (!nome || !email || !profissao || !senha) {
            showAlertPrest("alertContainerCadastroPrestador",
                `<div class="alert alert-warning">Preencha todos os campos obrigatórios.</div>`);
            return;
        }

        try {
            const res = await fetch("/api/provider/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome, email, profissao,
                    descricao, senha, fotos: fotosBase64
                })
            });

            const data = await res.json();

            if (!res.ok) {
                showAlertPrest("alertContainerCadastroPrestador",
                    `<div class="alert alert-danger">${data.error || "Erro ao cadastrar"}</div>`);
                return;
            }

            showAlertPrest("alertContainerCadastroPrestador",
                `<div class="alert alert-success">Cadastro realizado com sucesso! Redirecionando...</div>`);

            setTimeout(() => {
                window.location.href = "prestador.html";
            }, 1200);

        } catch (err) {
            showAlertPrest("alertContainerCadastroPrestador",
                `<div class="alert alert-danger">Erro ao conectar ao servidor.</div>`);
        }
    });
}

// Conversão de arquivos para Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

// =========================
// ÁREA LOGADA DO PRESTADOR
// =========================

const areaPrestador = document.getElementById("areaPrestador");
const inicioPrestador = document.getElementById("inicioPrestador");

window.addEventListener("DOMContentLoaded", () => {

    const token = getTokenPrestador();
    const nome = localStorage.getItem("prestador_nome");

    if (token && areaPrestador && inicioPrestador) {
        inicioPrestador.classList.add("d-none");
        areaPrestador.classList.remove("d-none");

        const boas = document.getElementById("boasVindasPrestador");
        if (boas) boas.innerText = `Bem-vindo, ${nome}!`;
    }
});

// Logout do prestador
const btnLogoutPrest = document.getElementById("btnLogoutPrestador");
if (btnLogoutPrest) {
    btnLogoutPrest.addEventListener("click", () => {

        localStorage.removeItem("token_prestador");
        localStorage.removeItem("prestador_id");
        localStorage.removeItem("prestador_nome");

        window.location.href = "prestador.html";
    });
}
