# Contas do Mocho 🦉

Jogo de cálculo mental (PWA) para iPhone: somar, subtrair, multiplicar e dividir, com 3 níveis, dicas passo a passo do Mocho, sons e música.

## Publicar no GitHub Pages

1. Cria um repositório novo no GitHub (ex.: `contas-do-mocho`), público.
2. Carrega **todos** os ficheiros desta pasta, mantendo a pasta `icons/`.
3. Vai a **Settings → Pages**.
4. Em *Source* escolhe **Deploy from a branch**, branch `main`, pasta `/ (root)`, e guarda.
5. Espera 1–2 minutos. O endereço fica: `https://O-TEU-UTILIZADOR.github.io/contas-do-mocho/`

## Instalar no iPhone

1. Abre o endereço no **Safari**.
2. Toca em **Partilhar** → **Adicionar ao ecrã principal**.
3. Abre a app pelo ícone do Mocho. Depois da primeira abertura funciona sem internet.

## Atualizar a app

Sempre que alterares ficheiros, muda `mocho-v1` para `mocho-v2` (e assim por diante) no `sw.js`. Fecha e volta a abrir a app no iPhone para receber a versão nova.

## Ficheiros

| Ficheiro | Para quê |
|---|---|
| `index.html` | Estrutura dos ecrãs |
| `styles.css` | Visual, cores e animações |
| `app.js` | Contas, dicas, sons, música e pontuação |
| `manifest.json` | Nome, ícone e cores da app instalada |
| `sw.js` | Funcionamento offline |
| `icons/` | Ícones da app |
