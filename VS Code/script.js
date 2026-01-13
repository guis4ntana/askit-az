const firebaseConfig = {
    apiKey: "AIzaSyA3tjkxPRMzZEa2f94eDKGl4jQdFqWC2Ac",
    authDomain: "sistema-askit.firebaseapp.com",
    projectId: "sistema-askit",
    storageBucket: "sistema-askit.firebasestorage.app",
    messagingSenderId: "653414779930",
    appId: "1:653414779930:web:7113c8352c7403fb2255a3",
    measurementId: "G-L2VDCW146Y"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function adicionarCampo(nome = "", mascara = "") {
    const container = document.getElementById('containerCampos');
    const novoDiv = document.createElement('div');
    novoDiv.className = 'campo-item-grupo';
    novoDiv.innerHTML = `
        <input type="text" class="nome-campo" placeholder="Nome do Campo" value="${nome}">
        <textarea class="mascara-campo" placeholder="Conteúdo da Máscara">${mascara}</textarea>
        <button onclick="this.parentElement.remove()" style="color:red; border:none; background:none; cursor:pointer; font-size:0.7rem;">[Remover Campo]</button>
    `;
    container.appendChild(novoDiv);
}

async function salvarNoFirebase() {
    const id = document.getElementById('editId').value;
    const titulo = document.getElementById('formTitulo').value;
    const nomes = document.querySelectorAll('.nome-campo');
    const mascaras = document.querySelectorAll('.mascara-campo');
    
    let dadosCampos = [];
    nomes.forEach((input, index) => {
        if(input.value.trim() !== "") {
            dadosCampos.push({ label: input.value, conteudo: mascaras[index].value });
        }
    });

    if (!titulo || dadosCampos.length === 0) return alert("Preencha o título e os campos!");

    const dados = {
        titulo: titulo,
        estrutura: dadosCampos,
        ultimaAlteracao: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            await db.collection("modelos").doc(id).update(dados);
            alert("Modelo atualizado!");
        } else {
            dados.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("modelos").add(dados);
            alert("Modelo criado!");
        }
        cancelarEdicao();
    } catch (e) { alert("Erro: " + e); }
}

// Carregamento em tempo real
db.collection("modelos").orderBy("ultimaAlteracao", "desc").onSnapshot((snapshot) => {
    const lista = document.getElementById('listaModelos');
    lista.innerHTML = "";
    snapshot.forEach((doc) => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-busca', d.titulo.toLowerCase());
        
        let htmlLinhas = d.estrutura.map(item => `
            <div class="item-linha">
                <span class="texto-label">${item.label}</span>
                <button class="btn-copiar" onclick="copiarTexto(\`${item.conteudo}\`)">Copiar</button>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="acoes-card">
                <button class="btn-acao" onclick="prepararEdicao('${doc.id}')" title="Editar">✏️</button>
                <button class="btn-acao" onclick="excluirModelo('${doc.id}')" title="Excluir">🗑️</button>
            </div>
            <h4>${d.titulo}</h4>
            <div>${htmlLinhas}</div>
        `;
        lista.appendChild(card);
    });
});

async function excluirModelo(id) {
    if(confirm("Tem certeza que deseja excluir este modelo permanentemente?")) {
        await db.collection("modelos").doc(id).delete();
    }
}

async function prepararEdicao(id) {
    const doc = await db.collection("modelos").doc(id).get();
    const data = doc.data();

    document.getElementById('editId').value = id;
    document.getElementById('formTitulo').value = data.titulo;
    document.getElementById('formLabel').innerText = "Editando Modelo";
    document.getElementById('btnSalvar').innerText = "Atualizar Modelo";
    document.getElementById('btnCancelar').style.display = "block";
    
    const container = document.getElementById('containerCampos');
    container.innerHTML = "";
    data.estrutura.forEach(campo => adicionarCampo(campo.label, campo.conteudo));
    window.scrollTo(0,0);
}

function cancelarEdicao() {
    document.getElementById('editId').value = "";
    document.getElementById('formTitulo').value = "";
    document.getElementById('formLabel').innerText = "Novo Formulário";
    document.getElementById('btnSalvar').innerText = "Salvar no Sistema";
    document.getElementById('btnCancelar').style.display = "none";
    document.getElementById('containerCampos').innerHTML = `
        <div class="campo-item-grupo">
            <input type="text" class="nome-campo" placeholder="Nome do Campo">
            <textarea class="mascara-campo" placeholder="Conteúdo da Máscara"></textarea>
        </div>`;
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto);
    // Opcional: toast de sucesso
}

function filtrar() {
    const termo = document.getElementById('inputBusca').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        card.style.display = card.getAttribute('data-busca').includes(termo) ? 'block' : 'none';
    });
}