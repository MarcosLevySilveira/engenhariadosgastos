// sw.js — Service Worker do Lighthouse (PWA)
// Estratégia:
// - Páginas HTML (navegação): network-first, cai pro cache se estiver offline.
// - Outros arquivos (css/js/imagens/ícones): cache-first, busca na rede se não tiver.
// - Qualquer arquivo novo que o usuário visitar é armazenado no cache automaticamente
//   (cache dinâmico), então não é preciso listar toda página do site aqui.

const CACHE_VERSION = "lighthouse-v2"; // <- versão trocada: força limpar o cache antigo (v1)

// Arquivos essenciais pré-carregados na instalação.
// Ajuste esta lista se você renomear/adicionar arquivos principais.
const APP_SHELL = [
    "./",
    "./index.html",
    "./cadastro4.html",
    "./styles.css",
    "./manifest.json",
    "./dados_iniciais.js",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            // addAll falha se QUALQUER arquivo da lista não existir — por isso
            // cada item é adicionado individualmente, ignorando falhas isoladas.
            return Promise.all(
                APP_SHELL.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn("Não foi possível pré-cachear:", url, err);
                    })
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(
                nomes
                    .filter((nome) => nome !== CACHE_VERSION)
                    .map((nome) => caches.delete(nome))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Só trata requisições GET do mesmo domínio (deixa CDNs externos, ex. Chart.js, passarem direto)
    if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
        return;
    }

    const isNavegacao = request.mode === "navigate" ||
        (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));

    if (isNavegacao) {
        // Network-first: tenta buscar a versão mais nova; se offline, usa o cache.
        event.respondWith(
            fetch(request)
                .then((resposta) => {
                    const copia = resposta.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, copia));
                    return resposta;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
        );
        return;
    }

    // Network-first para os demais recursos (css, js, imagens, etc.)
    // Assim, sempre que o arquivo mudar no servidor, a próxima visita já
    // pega a versão nova; só cai pro cache se estiver offline.
    event.respondWith(
        fetch(request)
            .then((resposta) => {
                const copia = resposta.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, copia));
                return resposta;
            })
            .catch(() => caches.match(request))
    );
});
