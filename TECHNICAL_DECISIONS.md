# Decisões Técnicas

Este documento lista as principais tecnologias usadas no projeto e o motivo de cada escolha.

## Base

### Vue 3

Framework reativo, com boa curva de aprendizado e ecossistema maduro para construir interfaces de forma componentizada.

### TypeScript

Tipagem estática que reduz erros em tempo de desenvolvimento e melhora a manutenção e a legibilidade do código.

### Vite

Ferramenta de build rápida, com hot reload instantâneo e configuração simples.

### pnpm

Gerenciador de pacotes rápido e eficiente no uso de disco, com instalação determinística.

## Estado, rotas e internacionalização

### Pinia

Gerenciador de estado oficial do Vue, simples, tipado e integrado ao Vue DevTools.

### Vue Router

Roteador oficial do Vue, com suporte a rotas aninhadas, guards de navegação e lazy loading.

### vue-i18n

Solução consolidada para internacionalização, permitindo suportar múltiplos idiomas (`en` e `pt-BR`).

## Comunicação HTTP

### Fetch nativo (`apiRequest`)

Evita dependências extras, já que a API nativa do navegador atende às necessidades do projeto.

## Decisões de implementação

### Scroll infinito com paginação por cursor

A API pagina por cursor (`after`/`next`), sem número de página, então a lista de projetos carrega a próxima página quando o fim da lista fica visível (`useInfiniteList` + `IntersectionObserver` nativo), em vez de usar um paginador numerado.

### Buscas recentes no `localStorage`, por usuário

É um dado só de interface, que não justifica endpoint nem store; a chave inclui o id do usuário (`projects.recentSearches.<userId>`) para que contas diferentes no mesmo navegador não compartilhem o histórico.

### Destaque de busca sem diferenciar acentos e maiúsculas

O termo e o texto são normalizados (NFD, sem diacríticos, minúsculos) antes da comparação, para que "acao" destaque "Ação", algo essencial para conteúdo em pt-BR.

### Lupa de busca no lado esquerdo do cabeçalho

As capturas mostram a lupa à direita, mas ela foi movida para o lado esquerdo para liberar o lado direito do cabeçalho para as outras opções (`.app-header-actions`), como o seletor de idioma, o acesso ao perfil e o logout, sem que elas disputem espaço com a busca.

## Qualidade de código

### ESLint

Padroniza o código e identifica problemas comuns automaticamente.

### Oxlint

Linter extremamente rápido que complementa o ESLint.

### Prettier

Formatação automática e consistente do código, evitando discussões sobre estilo.

### vue-tsc

Checagem de tipos em arquivos `.vue`, garantindo a integridade do TypeScript nos componentes.

## Testes

### Vitest

Framework de testes unitários integrado ao Vite, rápido e com API compatível com Jest.

### jsdom

Simula o ambiente do navegador para os testes unitários de componentes.

### Playwright

Testes end-to-end confiáveis em múltiplos navegadores, simulando o uso real da aplicação.
