const API_URL = "https://dummy.restapiexample.com/api/v1";
const STORAGE_KEY = 'meus_funcionarios';
const tableBody = document.getElementById('employee-table-body');
let paginaAtual = 1;
const itensPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    configurarEventos();
    configurarNavegacao();
    mostrarCard('listar');
});

function showToast(message, type = 'info') {
    let container = document.getElementById('top-notification-bar');
    if (!container) {
        container = document.createElement('div');
        container.id = 'top-notification-bar';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.pointerEvents = 'none'; 
        document.body.appendChild(container);
    }

    const msgBox = document.createElement('div');
    msgBox.style.padding = '15px 30px';
    msgBox.style.marginTop = '15px';
    msgBox.style.borderRadius = '4px';
    msgBox.style.color = '#fff';
    msgBox.style.fontWeight = 'bold';
    msgBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    msgBox.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    msgBox.style.transform = 'translateY(-20px)';
    msgBox.style.opacity = '0';
    msgBox.innerHTML = message;

    if (type === 'success') msgBox.style.backgroundColor = '#4CAF50';
    else if (type === 'error') msgBox.style.backgroundColor = '#F44336';
    else msgBox.style.backgroundColor = '#2196F3';

    container.appendChild(msgBox);

    // animacao de entrada
    requestAnimationFrame(() => {
        msgBox.style.transform = 'translateY(0)';
        msgBox.style.opacity = '1';
    });

    // Remove dps de 3 segundos
    setTimeout(() => {
        msgBox.style.opacity = '0';
        msgBox.style.transform = 'translateY(-20px)';
        setTimeout(() => msgBox.remove(), 500);
    }, 3000);
}

function mostrarCard(idCard) {
    document.querySelectorAll('.card').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.navbar a').forEach(a => a.classList.remove('active-nav'));
    document.getElementById(idCard).style.display = 'block';
    document.getElementById(`nav-${idCard}`).classList.add('active-nav');
}

function configurarNavegacao() {
    ['listar', 'inserir', 'alterar', 'excluir'].forEach(rota => {
        document.getElementById(`nav-${rota}`).addEventListener('click', () => mostrarCard(rota));
    });
}

function configurarEventos() {
    // post
    document.getElementById('form-create').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const salary = document.getElementById('salary').value;
        const age = document.getElementById('age').value;

        try {
            const res = await fetch(`${API_URL}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, salary, age })
            });
            const json = await res.json();

            if (json.status === "success" || res.ok) {
                const novo = {
                    id: json.data?.id || Date.now(), // Usa o ID da API ou gera um local se falhar
                    employee_name: name,
                    employee_salary: salary,
                    employee_age: age
                };
                const lista = getLocalData();
                lista.push(novo);
                saveLocalData(lista);
                
                showToast("Funcionário salvo com sucesso!", "success");
                e.target.reset();
                renderizarTabela();
                mostrarCard('listar');
            } else {
                showToast("Erro ao salvar na API.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Erro de conexão ao criar.", "error");
        }
    });

    // get by id
    const btnBuscar = document.getElementById('btn-buscar');
    const editContainer = document.getElementById('edit-fields-container');

    btnBuscar.addEventListener('click', async () => {
        const idBusca = document.getElementById('update-id').value;
        showToast("Buscando funcionário...", "info");

        try {
            const res = await fetch(`${API_URL}/employee/${idBusca}`);
            const json = await res.json();
            
            let func = null;
            if (json.status === "success" && json.data) {
                func = json.data;
            } else {
                // fallback para pegar do local caso a API de too many requests
                func = getLocalData().find(emp => emp.id == idBusca);
            }

            if (func) {
                document.getElementById('update-name').value = func.employee_name || func.name;
                document.getElementById('update-salary').value = func.employee_salary || func.salary;
                document.getElementById('update-age').value = func.employee_age || func.age;

                editContainer.style.display = 'block';
                editContainer.classList.add('fade-in');
            } else {
                editContainer.style.display = 'none';
                showToast("ID não encontrado.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Erro de conexão ao buscar.", "error");
        }
    });

    // put
    document.getElementById('form-update').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('update-id').value;
        const name = document.getElementById('update-name').value;
        const salary = document.getElementById('update-salary').value;
        const age = document.getElementById('update-age').value;

        try {
            const res = await fetch(`${API_URL}/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, salary, age })
            });
            const json = await res.json();

            if (json.status === "success" || res.ok) {
                let lista = getLocalData();
                const idx = lista.findIndex(f => f.id == id);

                if (idx !== -1) {
                    lista[idx] = {
                        ...lista[idx],
                        employee_name: name,
                        employee_salary: salary,
                        employee_age: age
                    };
                    saveLocalData(lista);
                }

                editContainer.style.display = 'none';
                editContainer.classList.remove('fade-in');

                showToast("Dados atualizados com sucesso!", "success");
                renderizarTabela();
                mostrarCard('listar');
            } else {
                showToast("Erro ao atualizar na API.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Erro de conexão ao atualizar.", "error");
        }
    });

    // delete
    document.getElementById('form-delete').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('delete-id').value;

        try {
            const res = await fetch(`${API_URL}/delete/${id}`, {
                method: 'DELETE'
            });
            const json = await res.json();

            if (json.status === "success" || res.ok) {
                let lista = getLocalData();
                const nova = lista.filter(f => f.id != id);
                saveLocalData(nova);
                
                showToast("Removido com sucesso!", "success");
                renderizarTabela();
                mostrarCard('listar');
                e.target.reset();
            } else {
                showToast("Erro ao deletar na API.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Erro de conexão ao deletar.", "error");
        }
    });
}

// GET
async function carregarDados() {
    if (getLocalData().length === 0) {
        try {
            const res = await fetch(`${API_URL}/employees`);
            if (res.ok) {
                const json = await res.json();
                if (json.status === "success") {
                    saveLocalData(json.data);
                }
            }
        } catch (e) { 
            console.error("API Offline ou bloqueada pelo CORS"); 
        }
    }
    renderizarTabela();
}

function saveLocalData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function getLocalData() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }

function renderizarTabela() {
    const dados = getLocalData();
    tableBody.innerHTML = "";
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const itens = dados.slice(inicio, inicio + itensPorPagina);

    itens.forEach(emp => {
        tableBody.innerHTML += `<tr>
            <td>${emp.id}</td>
            <td>${emp.employee_name || emp.name}</td>
            <td>${emp.employee_salary || emp.salary}</td>
            <td>${emp.employee_age || emp.age}</td>
        </tr>`;
    });
    atualizarPaginacao(dados.length);
}

function atualizarPaginacao(total) {
    const container = document.getElementById('pagination-controls');
    const totalPaginas = Math.ceil(total / itensPorPagina);
    container.innerHTML = "";

    if (totalPaginas <= 1) return;

    const btnPrev = document.createElement('button');
    btnPrev.innerHTML = "&laquo;";
    btnPrev.disabled = (paginaAtual === 1);
    btnPrev.onclick = () => { paginaAtual--; renderizarTabela(); };
    container.appendChild(btnPrev);

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === paginaAtual) btn.classList.add('active');
        btn.onclick = () => { paginaAtual = i; renderizarTabela(); };
        container.appendChild(btn);
    }

    const btnNext = document.createElement('button');
    btnNext.innerHTML = "&raquo;";
    btnNext.disabled = (paginaAtual === totalPaginas);
    btnNext.onclick = () => { paginaAtual++; renderizarTabela(); };
    container.appendChild(btnNext);
}