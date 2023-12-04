import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 1, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0:
                    case 1:
                        const store = db.createObjectStore('anotacao', {
                            keyPath: 'titulo'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
            }
        });
        console.log("banco de dados aberto!");
    }catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event =>{
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarAnotacao);
    document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoes);
    document.getElementById('btnDeletar').addEventListener('click', deletarAnotacao);
});

async function buscarTodasAnotacoes(){
    if(db == undefined){
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if(anotacoes){
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
                    <p>Pizzaria</p>
                    <p>Nome:${anotacao.titulo} </p>
                    <p>Latitude:${anotacao.latitude}</p>
                    <p>Longitude:${anotacao.longitude}</p>
                    <button class="btnDeletar" data-titulo="${anotacao.titulo}">Deletar</button>
                    <div class="mapouter">
                    <div class="gmap_canvas">
                        <iframe width="600" height="500" id="gmap_canvas_${anotacao.titulo}" 
                            src="https://maps.google.com/maps?q=${anotacao.latitude}%2C${anotacao.longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                            frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
                        <a href="https://123movies-i.net"></a>
                        <br>
                        <style>.mapouter{position:relative;text-align:right;height:500px;width:600px;}</style>
                        <a href="https://www.embedgooglemap.net">google maps embed</a>
                        <style>.gmap_canvas{overflow:hidden;background:none!important;height:500px;width:600px;}</style>
                    </div>
                </div>
                <button class="btnMostrarMapa" data-latitude="${anotacao.latitude}" data-longitude="${anotacao.longitude}">Mostrar Mapa</button>
               </div>`;
        });
        listagem(divLista.join(' '));
    }
    document.querySelectorAll('.btnMostrarMapa').forEach(button => {
        button.addEventListener('click', mostrarMapa);
    });
}

function mostrarMapa(event) {
    const latitude = event.target.getAttribute('data-latitude');
    const longitude = event.target.getAttribute('data-longitude');
    const titulo = event.target.parentElement.querySelector('p:nth-child(2)').innerText.split(' ')[1]; // obtém o nome da pizzaria

    if (latitude && longitude) {
        const mapaDiv = event.target.parentElement.querySelector('.mapouter');

        // Atualiza o iframe com as novas coordenadas
        mapaDiv.innerHTML = `<div class="gmap_canvas">
                                <iframe width="600" height="500" id="gmap_canvas_${titulo}" 
                                    src="https://maps.google.com/maps?q=${latitude}%2C${longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                                    frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
                                <a href="https://123movies-i.net"></a>
                                <br>
                                <style>.mapouter{position:relative;text-align:right;height:500px;width:600px;}</style>
                                <a href="https://www.embedgooglemap.net">google maps embed</a>
                                <style>.gmap_canvas{overflow:hidden;background:none!important;height:500px;width:600px;}</style>
                            </div>`;
    }
}

async function adicionarAnotacao() {
    let titulo = document.getElementById("titulo").value;
    let latitude = document.getElementById("latitude").value;
    let longitude = document.getElementById("longitude").value;
    let data = document.getElementById("data").value;
    const tx = await db.transaction('anotacao', 'readwrite')
    const store = tx.objectStore('anotacao');
    try {
        await store.add({ titulo: titulo, latitude: latitude, longitude: longitude, data: data });
        await tx.done;
        limparCampos();
        console.log('Registro adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar registro:', error);
        tx.abort();
    }
}

document.getElementById('btnBuscar').addEventListener('click', async () => {
    const tituloParaBuscar = document.getElementById('tituloBusca').value;

    if (!tituloParaBuscar) {
        console.log('Digite um título para buscar.');
        return;
    }

    const tx = await db.transaction('anotacao', 'readonly');
    const store = tx.objectStore('anotacao');

    try {
        const anotacaoEncontrada = await store.get(tituloParaBuscar);
        if (anotacaoEncontrada) {
            const divResultado = `
                <div class="item">
                    <p>Anotação Encontrada</p>
                    <p>${anotacaoEncontrada.titulo} - ${anotacaoEncontrada.data} </p>
                    <p>${anotacaoEncontrada.latitude}</p>
                    <p>${anotacaoEncontrada.longitude}</p>
                    <button class="btnDeletar" data-titulo="${anotacaoEncontrada.titulo}">Deletar</button>
                </div>`;
            listagem(divResultado);
        } else {
            console.log('Anotação não encontrada.');
        }
    } catch (error) {
        console.error('Erro ao buscar anotação:', error);
    }
});

async function buscarTodasAnotacoesParaAtualizar() {
    if (db == undefined) {
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if (anotacoes) {
        const selectAnotacao = document.getElementById('anotacaoParaAtualizar');
        selectAnotacao.innerHTML = "<option value=''>Selecione uma Anotação</option>";
        anotacoes.forEach(anotacao => {
            const option = document.createElement('option');
            option.value = anotacao.titulo;
            option.textContent = `${anotacao.titulo} - ${anotacao.data}`;
            selectAnotacao.appendChild(option);
        });
    }
}

document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoesParaAtualizar);
document.getElementById('btnAtualizar').addEventListener('click', async () => {
    const tituloParaAtualizar = document.getElementById('anotacaoParaAtualizar').value;
    const novalongitude = document.getElementById('novalongitude').value;
    const novalatitude = document.getElementById('novalatitude').value;
    const novaData = document.getElementById('novaData').value;

    if (!tituloParaAtualizar) {
        console.log('Selecione uma anotação para atualizar.');
        return;
    }

    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');

    try {
        const anotacaoExistente = await store.get(tituloParaAtualizar);
        if (!anotacaoExistente) {
            console.log('A anotação selecionada não foi encontrada.');
            return;
        }
        if (novalongitude) {
            anotacaoExistente.longitude = novalongitude;
        }
        if (novalatitude) {
            anotacaoExistente.latitude = novalatitude;
        }
        if (novaData) {
            anotacaoExistente.data = novaData;
        }

        await store.put(anotacaoExistente);
        await tx.done;
        console.log('Anotação atualizada com sucesso!');
        limparCampos();
    } catch (error) {
        console.error('Erro ao atualizar anotação:', error);
        tx.abort();
    }
});


function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("latitude").value = '';
    document.getElementById("longitude").value = '';
    document.getElementById("data").value = '';
}


function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}



document.getElementById('resultados').addEventListener('click', async (event) => {
    if (event.target.classList.contains('btnDeletar')) {
        const tituloParaDeletar = event.target.getAttribute('data-titulo');
        if (tituloParaDeletar) {
            if (confirm(`Tem certeza de que deseja excluir a anotação "${tituloParaDeletar}"?`)) {
                await deletarAnotacao(tituloParaDeletar);
                buscarTodasAnotacoes();
            }
        }
    }
});

async function deletarAnotacao(tituloParaDeletar) {
    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.delete(tituloParaDeletar);
        await tx.done;
        console.log(`Anotação "${tituloParaDeletar}" excluída com sucesso!`);
    } catch (error) {
        console.error('Erro ao excluir anotação:', error);
        tx.abort();
    }
}
