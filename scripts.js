
let nome = document.querySelector(".nome");
let personagem = document.querySelector(".personagem");

function escolherPersonagem(nomePersonagem, imagemPersonagem, cor) {
    nome.textContent = nomePersonagem;
    personagem.src = imagemPersonagem;
    nome.style.color = cor;
}

// Remove os pixels claros conectados às bordas da imagem.
async function removerQuadriculado(imagem) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });

    canvas.width = imagem.naturalWidth || imagem.width;
    canvas.height = imagem.naturalHeight || imagem.height;

    ctx.drawImage(imagem, 0, 0);

    const largura = canvas.width;
    const altura = canvas.height;
    const dados = ctx.getImageData(0, 0, largura, altura);
    const pixels = dados.data;
    const total = largura * altura;

    const visitados = new Uint8Array(total);
    const fila = new Uint32Array(total);
    let inicio = 0;
    let fim = 0;

    function pareceFundo(i) {
        const p = i * 4;
        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        return min > 165 && max - min < 25;
    }

    function adicionar(x, y) {
        const i = y * largura + x;

        if (!visitados[i] && pareceFundo(i)) {
            visitados[i] = 1;
            fila[fim++] = i;
        }
    }

    for (let x = 0; x < largura; x++) {
        adicionar(x, 0);
        adicionar(x, altura - 1);
    }

    for (let y = 0; y < altura; y++) {
        adicionar(0, y);
        adicionar(largura - 1, y);
    }

    while (inicio < fim) {
        const i = fila[inicio++];
        const x = i % largura;
        const y = Math.floor(i / largura);

        pixels[i * 4 + 3] = 0;

        if (x > 0) adicionar(x - 1, y);
        if (x < largura - 1) adicionar(x + 1, y);
        if (y > 0) adicionar(x, y - 1);
        if (y < altura - 1) adicionar(x, y + 1);
    }

    ctx.putImageData(dados, 0, 0);

    return canvas.toDataURL("image/png");
}

async function lerfoto(input) {
    console.log("A função lerfoto foi chamada!");

    const foto = input.files[0];

    if (!foto) {
        alert("Selecione uma foto primeiro!");
        return;
    }

    console.log("Foto selecionada:", foto.name);

    const leitor = new FileReader();

    leitor.onload = async function () {
        try {
            nome.textContent = "Criando personagem...";

            const desenho = await puter.ai.txt2img(
                "Transforme a pessoa da imagem de referência em um personagem de videogame. " +
                "Contorno preto grosso, cores vivas, meio corpo, mantendo o rosto parecido. " +
                "Personagem isolado, fundo transparente real, sem padrão xadrez.",
                {
                    model: "gpt-image-2.5-flare",
                    provider: "openai",
                    input_image: leitor.result,
                    quality: "medium"
                }
            );

            console.log("Imagem recebida:", desenho);

            // Aguarda a imagem carregar antes de processá-la.
            const imagem = new Image();

            imagem.onload = async function () {
                try {
                    console.log("Iniciando remoção do fundo...");

                    const imagemLimpa =
                        await removerQuadriculado(imagem);

                    escolherPersonagem(
                        "Você",
                        imagemLimpa,
                        "#ee3d1e"
                    );

                    console.log("Processamento concluído!");
                } catch (erro) {
                    console.error("Erro ao remover o fundo:", erro);
                    nome.textContent = "Erro ao remover fundo";
                }
            };

            imagem.onerror = function () {
                console.error("Não foi possível carregar a imagem gerada.");
                nome.textContent = "Erro ao carregar imagem";
            };

            imagem.src = desenho.src;

        } catch (erro) {
            console.error("Erro ao gerar personagem:", erro);
            nome.textContent = "Não foi possível gerar";
            alert("Erro ao gerar a imagem. Abra o Console com F12.");
        }
    };

    leitor.onerror = function () {
        console.error("Erro ao ler a foto.");
        alert("Não foi possível abrir a foto selecionada.");
    };

    leitor.readAsDataURL(foto);
}