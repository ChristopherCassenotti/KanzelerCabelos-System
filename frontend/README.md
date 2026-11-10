# Kanzler Cabelos - Frontend

Frontend React + TypeScript + Vite da V1 do sistema Kanzler Cabelos.

## Estado atual

- Etapa 1: base técnica concluída.
- Etapa 2: autenticação concluída.
- Etapa 3: layout principal concluído.
- Etapa 4: painel operacional concluído.
- Etapa 5: contatos, cadastro, ficha e exclusões concluídos.
- Etapa 6: fotos privadas concluídas.
- Etapa 7: agenda e rotas concluídas.
- Etapa 8: registro de compra concluído.
- Etapa 9: mapa geral concluído.
- Etapa 10: relatórios e exportação consolidada concluídos.
- Próxima etapa: qualidade, integração e Super Teste Final da V1.

## Executar

```bash
cp .env.example .env
npm install
npm run typecheck
npm run dev
```

Configure:

```env
VITE_API_URL=http://localhost:3333
```

Para validar build de produção:

```bash
npm run build
npm run preview
```

## Sessão

- `POST /auth/login` recebe `email` e `senha`.
- Access token permanece somente em memória.
- Refresh token é mantido pelo backend em cookie HttpOnly.
- Ao recarregar a aplicação, o frontend tenta `POST /auth/refresh`.
- Rotas protegidas enviam `Authorization: Bearer <token>`.
- Em `401`, a API protegida tenta um refresh e repete a chamada uma única vez.
- Logout limpa cookie, sessão em memória e cache das queries.

## Layout principal

Rotas internas preparadas:

- `/painel`
- `/contatos`
- `/agenda`
- `/mapa`
- `/relatorios`

Atalhos:

- **Novo contato** → `/contatos?novo=1`
- **Rota de amanhã** → `/agenda?data=YYYY-MM-DD`, calculado com referência em `America/Sao_Paulo`.

A busca global consulta:

```http
GET /contatos/busca?q=termo
```

A seleção de um resultado direciona temporariamente para:

```text
/contatos?contato=<UUID>
```

A tela de contatos será responsável por abrir a ficha desse UUID quando essa etapa for implementada.

## Painel operacional

A rota `/painel` usa exclusivamente dados calculados pelo backend. Nesta etapa são consultados:

```http
GET /painel/resumo
GET /recompras/prontas
GET /rotas?de=YYYY-MM-DD&ate=YYYY-MM-DD
GET /relatorios/indicadores?periodo=mes_atual
GET /relatorios/compras?periodo=mes_atual
```

O frontend **não recalcula** regra de recompra, status ou indicadores financeiros. Ele apenas formata e apresenta os dados retornados pela API.

O painel mostra:

- contatos totais e resumo do funil;
- quantidade A agendar;
- visitas nos próximos 7 dias;
- cortes, valor pago e peso no mês atual;
- clientes prontas para recompra;
- compras do mês agrupadas por cidade.


## Contatos e ficha completa

A rota `/contatos` agora usa dados reais do backend e integra:

```http
GET /contatos
GET /contatos/:id
GET /cidades
POST /contatos
PATCH /contatos/:id
PATCH /contatos/:id/status
DELETE /contatos/:id
DELETE /contatos/:id/definitivo
GET /export/contatos
```

A listagem mostra cidade, status, cabelo, última compra, R$/g, data do corte e recompra calculada pelo backend. Os filtros disponíveis na tela são os mesmos aceitos pela exportação: cidade, status, origem e cabelo natural.

A ficha abre por query string `?contato=<UUID>`, portanto resultados da busca global e links do painel passam a abrir a cliente diretamente. O atalho `?novo=1` abre o cadastro.

A ficha integra a seção de fotos privadas implementada na Etapa 6, com URLs assinadas temporárias, upload, vínculo opcional à compra e exclusão.

### Observação de performance

O endpoint `GET /contatos` atual retorna a lista sem cidade/compras/recompra enriquecidas. Para reproduzir a tabela completa da referência sem duplicar regras do backend, a V1 desta etapa carrega os detalhes por `GET /contatos/:id` com concorrência limitada a 6 requisições. Isso é aceitável para a base atual pequena, mas deve ser observado no super teste. Se a base crescer de forma relevante, vale criar no backend um endpoint de listagem enriquecida/paginada para eliminar esse N+1.

## Fotos privadas

A ficha da cliente usa os endpoints privados de fotos:

```http
GET /contatos/:contatoId/fotos
POST /contatos/:contatoId/fotos
DELETE /contatos/:contatoId/fotos/:fotoId
```

Regras aplicadas no frontend:

- `signedUrl` é usada apenas para exibição e nunca é persistida no navegador;
- a galeria oferece atualização manual dos links e também refaz a consulta periodicamente enquanto a ficha está aberta;
- upload fica bloqueado quando `autorizouFoto=false`;
- o seletor aceita JPEG, PNG e WebP;
- no máximo 4 arquivos são aceitos por lote;
- cada arquivo é limitado a 10 MiB antes de chegar ao backend;
- os arquivos são enviados individualmente para o endpoint multipart, preservando o limite de lote na interface;
- `tipo` é opcional;
- `compraId` é opcional e pode vincular o lote a um corte já existente da mesma cliente;
- exclusão pede confirmação e remove o arquivo privado e o registro pelo backend;
- o lightbox permite navegação por teclado (`Esc`, setas esquerda/direita) e por controles de toque/clique.

Se um lote falhar no meio, fotos já concluídas permanecem salvas e a galeria é recarregada para refletir o estado real do backend.

---

# Checklist acumulativo de testes

Este bloco deve ser mantido e ampliado a cada implementação. No fim do projeto ele será usado como base para o **super teste completo da V1**.

## Etapa 1 - Base técnica

### Automatizado/local

- [ ] `npm install` conclui sem erro.
- [ ] `npm run typecheck` conclui sem erro TypeScript.
- [ ] `npm run build` gera `dist/`.
- [ ] `npm run preview` abre o build de produção.

### Manual

- [ ] Aplicação inicia com `npm run dev`.
- [ ] `.env` com `VITE_API_URL` é lido corretamente.
- [ ] Não existem erros no console ao carregar a aplicação.
- [ ] Layout básico não gera scroll horizontal indevido em desktop/mobile.

## Etapa 2 - Autenticação

### Login

- [ ] `/login` abre sem autenticação.
- [ ] E-mail inválido é bloqueado pelo formulário.
- [ ] Campos vazios apresentam validação.
- [ ] Credenciais inválidas exibem mensagem do backend.
- [ ] Credenciais válidas autenticam e redirecionam para a área interna.
- [ ] Usuário autenticado não consegue permanecer em `/login`.

### Sessão

- [ ] Access token não aparece em `localStorage` ou `sessionStorage`.
- [ ] Recarregar a página recupera a sessão pelo cookie HttpOnly.
- [ ] Requisições protegidas enviam Bearer token.
- [ ] Um `401` por access token expirado executa um único refresh e repete a requisição.
- [ ] Várias requisições simultâneas em `401` não disparam múltiplos refreshes concorrentes.
- [ ] Refresh inválido/expirado encerra a sessão e leva ao login.
- [ ] Logout limpa sessão, cache e retorna ao login.

## Etapa 3 - Layout principal

### Navegação desktop

- [ ] Sidebar mostra Painel, Contatos, Agenda e rotas, Mapa e Relatórios.
- [ ] Item ativo acompanha a rota atual.
- [ ] Cada item abre a rota correta sem reload da página.
- [ ] `/` redireciona para `/painel`.
- [ ] URL inexistente redireciona para `/painel`.
- [ ] Título e subtítulo do topo mudam conforme a página.
- [ ] Logout continua acessível pelo rodapé da sidebar.

### Atalhos

- [ ] **Novo contato** abre `/contatos?novo=1`.
- [ ] **Rota de amanhã** abre `/agenda?data=...`.
- [ ] A data do atalho de amanhã está correta inclusive próximo da meia-noite, usando `America/Sao_Paulo`.

### Busca global

- [ ] Campo aparece no desktop e no mobile.
- [ ] Digitar 1+ caracteres chama `/contatos/busca?q=` após debounce.
- [ ] Não existe chamada com campo vazio.
- [ ] Loading aparece durante a pesquisa.
- [ ] Busca sem resultado mostra estado vazio.
- [ ] Erro da API mostra mensagem sem quebrar a tela.
- [ ] Resultado mostra nome, cidade/UF e status.
- [ ] Clique em resultado abre `/contatos?contato=<UUID>`.
- [ ] `Esc` fecha os resultados.
- [ ] Clique fora fecha os resultados.
- [ ] Botão limpar zera a busca.

### Responsividade

- [ ] Em largura acima de 820px a sidebar permanece fixa e aberta.
- [ ] Em largura até 820px a sidebar fica escondida por padrão.
- [ ] Botão hamburger abre a sidebar mobile.
- [ ] Clique no overlay fecha a sidebar.
- [ ] Clique em uma navegação fecha a sidebar mobile.
- [ ] Topbar e busca não estouram largura em 320px.
- [ ] Conteúdo principal não fica escondido atrás da sidebar no desktop.

## Etapa 4 - Painel

### Integração e dados

- [ ] `/painel` chama `GET /painel/resumo` autenticado.
- [ ] Total de contatos exibido é igual a `contatos.total`.
- [ ] Funil exibe corretamente lead, avaliação agendada, comprado e perdido.
- [ ] Total A agendar coincide com `aAgendar.total`.
- [ ] Clientes de recompra vêm de `GET /recompras/prontas`, sem cálculo paralelo no frontend.
- [ ] Visitas dos próximos 7 dias vêm das rotas entre hoje e +7 dias.
- [ ] Itens do tipo `tarefa` não são contados como visita.
- [ ] Visitas concluídas não aparecem na lista de próximas visitas.
- [ ] Indicadores mensais usam `periodo=mes_atual`.
- [ ] Valor pago aceita Decimal retornado como string sem gerar `NaN`.
- [ ] Peso mensal é formatado de gramas para kg apenas para exibição.
- [ ] Barras por cidade usam os valores de `/relatorios/compras` sem recalcular compras.

### Estados da interface

- [ ] Loading inicial mostra skeleton sem layout quebrado.
- [ ] Sem recompras mostra estado vazio.
- [ ] Sem visitas mostra estado vazio.
- [ ] Sem compras no mês mostra estado vazio no gráfico por cidade.
- [ ] Falha em um endpoint mostra aviso, mas mantém dados dos endpoints que responderam.
- [ ] Botão **Tentar novamente** refaz as consultas do painel.
- [ ] Refresh em andamento não duplica cards nem causa flicker destrutivo.

### Navegação

- [ ] **Ver contatos** abre `/contatos`.
- [ ] Clique em cliente de recompra abre `/contatos?contato=<UUID>`.
- [ ] **Abrir agenda** abre `/agenda`.
- [ ] Clique em uma próxima visita abre `/agenda?data=YYYY-MM-DD`.

### Responsividade

- [ ] 5 KPIs cabem em desktop largo sem overflow.
- [ ] KPIs quebram para 2 colunas em tablet e 1 coluna em telas menores quando necessário.
- [ ] Listas de recompra e visitas continuam legíveis em 320px.
- [ ] Labels de cidade e valores longos não criam scroll horizontal.
- [ ] Painel mantém o padrão visual das referências fornecidas.


## Etapa 5 - Contatos

### Listagem e filtros

- [ ] `/contatos` carrega a base real autenticada.
- [ ] A lista mostra nome, telefone, cidade, status, características do cabelo e dados da última compra.
- [ ] Valor pago aceita Decimal retornado como string.
- [ ] R$/g só aparece quando existe peso válido maior que zero.
- [ ] Próxima recompra vem de `GET /contatos/:id`; o frontend não recalcula a data.
- [ ] Recompra vencida aparece em vermelho; pronta futura em âmbar; futura fora da janela em neutro.
- [ ] Filtro de cidade reduz a lista corretamente.
- [ ] Filtro de status reduz a lista corretamente.
- [ ] Filtro de origem reduz a lista corretamente.
- [ ] Filtro de cabelo natural diferencia `true`, `false` e não informado.
- [ ] Contador `X de Y contatos` acompanha os filtros.
- [ ] Combinação de filtros funciona sem alterar dados da API.
- [ ] Estado vazio aparece quando nenhum contato atende aos filtros.
- [ ] Falha ao carregar contatos/cidades exibe erro e botão de tentar novamente.
- [ ] Em base com ~30-50 contatos, medir o tempo do carregamento enriquecido e conferir que há no máximo 6 detalhes em paralelo.

### Novo contato

- [ ] Atalho lateral **Novo contato** abre o modal por `?novo=1`.
- [ ] Botão **Novo contato** da tela abre o mesmo modal.
- [ ] Nome e cidade são obrigatórios.
- [ ] Data do primeiro contato inicia com a data atual de `America/Sao_Paulo`.
- [ ] Campos opcionais vazios não são enviados como valores inválidos.
- [ ] Consentimento de foto inicia desmarcado.
- [ ] Cadastro válido executa `POST /contatos`.
- [ ] Erro 400 do backend aparece dentro do modal.
- [ ] Após criar, lista/cache são invalidados e a ficha do novo contato abre.
- [ ] Endereço sem coordenadas continua dependendo do geocoding do backend, sem cálculo paralelo no front.

### Ficha e edição

- [ ] Clique em uma linha abre `?contato=<UUID>`.
- [ ] Link vindo da busca global abre a mesma ficha.
- [ ] Link vindo do painel/recompra abre a mesma ficha.
- [ ] Drawer mostra cidade, origem, indicação, datas, cabelo, consentimento, observações, compras e recompra.
- [ ] Fotos já existentes abrem pela `signedUrl`.
- [ ] `Esc` fecha o drawer quando nenhuma ação destrutiva está em andamento.
- [ ] Botão editar abre formulário preenchido.
- [ ] `PATCH /contatos/:id` atualiza dados sem usar o endpoint genérico para status.
- [ ] Após salvar edição, listagem, ficha e painel são invalidados/atualizados.
- [ ] Campos vazios no formulário de edição são omitidos; validar posteriormente a necessidade de limpeza explícita via `null` conforme schema do backend.

### Status

- [ ] Lead permite somente Avaliação agendada ou Perdido.
- [ ] Avaliação agendada permite somente Comprado ou Perdido.
- [ ] Perdido permite voltar para Lead.
- [ ] Comprado não oferece transição manual não suportada.
- [ ] Ir para Perdido exige motivo antes de habilitar confirmação.
- [ ] Transição usa `PATCH /contatos/:id/status`.
- [ ] Erro 409 de transição inválida é mostrado sem alterar visualmente o status.
- [ ] Status atualizado invalida contatos, painel, recompra e relatórios.

### Ações rápidas

- [ ] WhatsApp abre número somente com dígitos e adiciona `55` para telefone brasileiro local quando necessário.
- [ ] Mapa usa lat/lng quando disponíveis.
- [ ] Sem coordenadas, mapa usa endereço + cidade como fallback.
- [ ] Ações da tabela não abrem a ficha por acidente ao clicar nos ícones.

### Exportação

- [ ] **Exportar Excel** usa `responseType: blob`.
- [ ] Arquivo baixa como `contatos-kanzler.xlsx`.
- [ ] Filtro de cidade é enviado como `cidadeId`.
- [ ] Filtro de status é enviado como `status`.
- [ ] Filtro de origem é enviado como `origem`.
- [ ] Filtro de natural é enviado como boolean.
- [ ] Sem filtros, exportação envia query vazia e baixa todos os contatos.
- [ ] Erro de exportação não quebra a tela.

### Exclusões e LGPD

- [ ] Exclusão lógica pede confirmação.
- [ ] Confirmar chama `DELETE /contatos/:id` e fecha a ficha.
- [ ] Contato excluído logicamente some da listagem após invalidação.
- [ ] Exclusão definitiva mostra alerta explícito de irreversibilidade.
- [ ] Botão definitivo só habilita após digitar `EXCLUIR`.
- [ ] Confirmar chama `DELETE /contatos/:id/definitivo`.
- [ ] Após hard delete, fotos/compras/visitas deixam de existir conforme regra do backend.
- [ ] Erro de exclusão é exibido e não fecha a ficha indevidamente.

### Responsividade

- [ ] Desktop mostra tabela completa sem quebrar o layout principal.
- [ ] Tablet/mobile troca a tabela por cards legíveis.
- [ ] Modal de cadastro/edição cabe em 320px e possui scroll interno.
- [ ] Drawer ocupa a tela no mobile e não cria scroll horizontal.
- [ ] Confirmações destrutivas são utilizáveis por toque.

---

## Etapa 6 - Fotos privadas

### Consentimento e privacidade

- [ ] Cliente com `autorizouFoto=false` vê upload bloqueado.
- [ ] A ação de autorização leva à edição do contato, sem tentar burlar a validação do backend.
- [ ] Mesmo manipulando a UI, o backend responde 403 para upload sem autorização.
- [ ] `signedUrl` não é gravada em localStorage/sessionStorage nem reaproveitada como URL definitiva.
- [ ] Botão **Atualizar links** refaz `GET /contatos/:contatoId/fotos`.
- [ ] Após aproximadamente 1 hora, atualizar a galeria gera links válidos novamente.

### Seleção e validação de arquivos

- [ ] Input aceita JPEG, PNG e WebP.
- [ ] Arquivo de tipo não permitido é recusado antes do upload.
- [ ] Arquivo acima de 10 MiB é recusado antes do upload.
- [ ] Mais de 4 arquivos no mesmo lote é recusado.
- [ ] Pré-visualizações locais aparecem antes do envio.
- [ ] Remover uma prévia não envia aquele arquivo.
- [ ] Selecionar novamente o mesmo arquivo funciona após limpar o input.

### Upload

- [ ] Uma foto gera uma chamada multipart com campo `file`.
- [ ] Tipo opcional é enviado como `tipo` quando selecionado.
- [ ] Compra opcional é enviada como `compraId` quando selecionada.
- [ ] Lote com 2 a 4 fotos envia todas e exibe progresso global.
- [ ] Após sucesso, galeria e ficha são invalidadas/refrescadas.
- [ ] Upload vinculado a compra de outra cliente deve retornar conflito pelo backend e a UI deve mostrar o erro.
- [ ] Falha no meio de um lote mantém as fotos já concluídas e recarrega o estado real.

### Galeria e lightbox

- [ ] Galeria mostra todas as fotos retornadas, sem limitar às 8 primeiras.
- [ ] Tipo da foto aparece sobre a miniatura quando disponível.
- [ ] Vínculo de compra mostra a data do corte correspondente.
- [ ] Clique abre lightbox em tela cheia.
- [ ] `Esc` fecha o lightbox.
- [ ] Setas esquerda/direita navegam quando existe mais de uma foto.
- [ ] Botões anterior/próxima funcionam no mouse e toque.
- [ ] Imagem com URL expirada/quebrada mostra fallback e permite atualizar links.

### Exclusão

- [ ] Excluir pela miniatura abre confirmação.
- [ ] Excluir pelo lightbox abre a mesma confirmação.
- [ ] Cancelar não chama a API.
- [ ] Confirmar chama `DELETE /contatos/:contatoId/fotos/:fotoId`.
- [ ] Após excluir, a foto some da galeria e da ficha.
- [ ] Foto de outro contato/ID inexistente exibe erro 404 sem quebrar a ficha.

### Responsividade e acessibilidade

- [ ] Grade da galeria permanece legível em 320px.
- [ ] Área de upload não cria scroll horizontal.
- [ ] Lightbox cabe em celular e desktop.
- [ ] Botões críticos têm rótulos/`aria-label` adequados.
- [ ] Navegação por teclado do lightbox funciona sem prender a tela após fechar.


# Super teste final da V1

**Não executar como aceite final ainda.** Esta lista será completada etapa por etapa.

Até o momento, o super teste deve cobrir obrigatoriamente:

1. iniciar API e frontend;
2. validar health/API disponível;
3. login válido e inválido;
4. refresh de sessão após reload;
5. navegação por todas as rotas internas;
6. comportamento da sidebar em desktop e celular;
7. busca global real contra o backend;
8. atalhos Novo contato e Rota de amanhã;
9. logout e bloqueio das rotas privadas;
10. carregar `/painel` com dados reais;
11. conferir funil e A agendar contra `/painel/resumo`;
12. conferir recompra contra `/recompras/prontas`;
13. conferir visitas dos próximos 7 dias e atalhos para agenda;
14. conferir indicadores e compras por cidade do mês atual;
15. simular estados vazios e falha parcial das APIs do painel;
16. carregar a listagem real de contatos e validar filtros combinados;
17. criar um contato completo e conferir geocoding/valores gravados;
18. abrir a ficha pelo grid, busca global e painel;
19. editar dados cadastrais e conferir invalidação dos caches;
20. executar transições válidas e inválidas de status, incluindo motivo de perda;
21. validar WhatsApp e fallback de mapa;
22. baixar Excel de contatos com e sem filtros;
23. executar soft delete e confirmar remoção operacional;
24. executar hard delete em um contato de teste e verificar exclusão de dados relacionados;
25. medir o carregamento enriquecido da lista para identificar eventual necessidade de endpoint paginado/enriquecido;
26. validar consentimento de fotos ativo e inativo;
27. enviar 1 foto e depois um lote de 4 fotos válidas;
28. bloquear tipo inválido, arquivo maior que 10 MiB e lote com mais de 4 arquivos;
29. vincular fotos a uma compra existente e conferir a associação ao reabrir a ficha;
30. abrir lightbox, navegar entre fotos e atualizar links assinados;
31. excluir uma foto e confirmar remoção do Storage/registro ao recarregar;
32. simular erro no meio de um lote e confirmar que arquivos já concluídos permanecem consistentes.
33. abrir Agenda pelo menu, por `?data=` e pelo atalho Rota de amanhã;
34. navegar por duas semanas e voltar para Hoje, conferindo datas e rotas carregadas;
35. testar filtros de A agendar por tipo e cidade;
36. criar um novo dia de rota e salvar cidade de saída, hora, minutos por visita e custos;
37. adicionar um Lead e confirmar mudança de status no backend/lista de contatos;
38. adicionar uma cliente de recompra e confirmar que o status persistido continua Comprado;
39. tentar agendar uma cliente que já possui visita futura em outro dia e confirmar que a visita foi movida, não duplicada;
40. adicionar tarefa livre e concluir;
41. reordenar itens por drag-and-drop e por botões subir/descer e conferir persistência após refresh;
42. organizar por menor distância e testar também cenário com localização insuficiente;
43. calcular horários, alterar parâmetros do dia e recalcular;
44. concluir visitas com Não comprou e Não atendeu e conferir persistência;
45. remarcar/adiar uma visita e confirmar criação/uso correto do dia seguinte;
46. concluir uma visita como Comprou e confirmar abertura do fluxo de Registro de compra;
47. remover uma visita e confirmar que o contato continua na base e volta à fila quando elegível;
48. validar mapa da rota, polyline, distância, duração e pinos;
49. abrir rota completa no Google Maps e validar ordem dos waypoints;
50. baixar Excel da rota e imprimir a versão limpa em desktop e mobile;
51. fechar o modal de compra aberto pela agenda sem salvar e confirmar que o aviso permite reabrir;
52. registrar compra pela agenda e confirmar envio do `visitaId`;
53. registrar compra diretamente pela ficha e confirmar ausência de `visitaId`;
54. validar data do corte, peso, comprimento, cor, textura e química;
55. validar Pix e Dinheiro como formas de pagamento;
56. conferir cálculo visual de R$/g sem substituir os cálculos consolidados do backend;
57. salvar compra sem peso e confirmar que R$/g fica indisponível sem bloquear o cadastro;
58. registrar valor/data de revenda e comprador;
59. confirmar que a compra atualiza histórico, status, recompra, painel e relatórios sem reload manual;
60. conferir que a nova compra aparece como opção para vínculo de fotos após refetch;
61. simular 404 de contato no registro de compra;
62. simular 409 de `visitaId` pertencente a outra cliente;
63. validar o modal de compra em 320px, tablet e desktop.
64. abrir `/mapa` e conferir o total de contatos geolocalizados retornado por `GET /mapa`;
65. validar individualmente os filtros Lead, Avaliação agendada, Comprado, Recompra e Perdido;
66. filtrar uma cidade e conferir que lista lateral, pinos e contador permanecem coerentes;
67. ativar **Só prontas p/ recompra** e confirmar que a regra exibida vem do backend;
68. ativar rota para uma data existente e validar partida, polyline, paradas, distância e duração;
69. selecionar uma data sem rota e confirmar estado informativo + atalho para a agenda;
70. clicar em uma cidade da lateral e confirmar que o mapa aproxima os pinos sem alterar indevidamente os filtros;
71. abrir a ficha pelo popup do mapa e conferir `/contatos?contato=<UUID>`;
72. adicionar/mover uma cliente à rota diretamente pelo popup e conferir agenda/A agendar após refetch;
73. tentar adicionar pelo popup quando não existe rota e confirmar redirecionamento para a agenda da data selecionada;
74. abrir WhatsApp pelo popup e validar formatação do telefone;
75. confirmar que contatos sem coordenadas não quebram o mapa e não geram pinos inválidos;
76. validar loading, vazio, erro/refetch e responsividade do mapa em 320px, tablet e desktop.

77. abrir `/relatorios` e confirmar carregamento paralelo de todos os blocos do período `todo`;
78. trocar para mês atual, 30, 90 e 365 dias e conferir que todos os endpoints dependentes usam o mesmo `periodo`;
79. comparar os seis indicadores com `GET /relatorios/indicadores` sem recalcular regras financeiras no browser;
80. validar compras por cidade e por mês, inclusive estado vazio;
81. validar preço médio por grama por cor e textura contra os valores ponderados retornados pelo backend;
82. validar conversão por cidade e total visual de contatos/avaliações/compras;
83. validar origens e motivos de perda, inclusive listas vazias;
84. abrir uma viagem pela tabela e confirmar navegação para `/agenda?data=YYYY-MM-DD`;
85. validar totais de viagens, resultado positivo/negativo e quantidade a revender;
86. validar previsão de recompra por cidade e confirmar que ela não muda ao trocar o filtro de período;
87. abrir a ficha pelo detalhamento de compras e confirmar `/contatos?contato=<UUID>`;
88. baixar `relatorios-kanzler.xlsx` para cada período e abrir as abas geradas;
89. simular falha de apenas um endpoint de relatório e confirmar que os demais blocos continuam utilizáveis;
90. validar loading, refresh, estado vazio, overflow das tabelas e responsividade dos relatórios em 320px, tablet e desktop.

A partir daqui o Super Teste Final já cobre todas as telas funcionais da V1. A próxima etapa é executar, corrigir e repetir esta bateria completa.

## Observações de integração

- Não duplicar no frontend regras de status, recompra, geocoding, visita futura única, ordenação de rota, cálculo de horários ou cálculos de relatórios.
- Datas de negócio devem respeitar a lógica do backend; atalhos relativos usam `America/Sao_Paulo`.
- Valores Decimal recebidos da API podem chegar como strings.
- `recompra` é estado visual/calculado, não status persistido do contato.
- Downloads `.xlsx` deverão ser tratados como binário quando a etapa de exportações for implementada.

---

## Etapa 7 - Agenda e rotas

### Navegação de datas e semana

- [ ] `/agenda` abre a data atual em `America/Sao_Paulo` quando não existe `?data=`.
- [ ] `/agenda?data=YYYY-MM-DD` seleciona exatamente a data informada.
- [ ] Atalho lateral **Rota de amanhã** abre o dia correto.
- [ ] Botões Hoje, Amanhã, semana anterior e próxima semana alteram a data sem recarregar a aplicação.
- [ ] Seletor de data mantém o query string sincronizado.
- [ ] Cards da semana exibem quantidade de visitas por dia e destacam o dia selecionado.
- [ ] Arrastar um contato para outro card da semana cria/move a visita para aquele dia.

### A agendar

- [ ] `GET /a-agendar` carrega somente clientes elegíveis sem visita futura aberta.
- [ ] A UI tolera tanto o shape achatado atual do serviço quanto o shape representativo com `contato` aninhado da documentação.
- [ ] `GET /a-agendar/resumo` alimenta as contagens dos chips.
- [ ] Filtro Todos/Lead/Avaliação/Recompra envia `tipo` somente quando necessário.
- [ ] Filtro por cidade envia `cidadeId`.
- [ ] Recompra usa `diasAte` retornado pelo backend, sem recalcular a regra no frontend.
- [ ] Botão + adiciona a cliente ao dia selecionado.
- [ ] No desktop, drag-and-drop da fila para a rota funciona.
- [ ] No mobile, todo fluxo continua possível sem drag-and-drop.
- [ ] Após adicionar/mover visita, a cliente sai de A agendar conforme a regra do backend.

### Criação e configuração do dia

- [ ] Dia sem rota mostra estado vazio e permite criar a rota pelo card Resumo do dia.
- [ ] Ao adicionar a primeira cliente a um dia sem rota, a V1 cria automaticamente o dia usando União da Vitória como base quando disponível; se não existir, usa a primeira cidade cadastrada.
- [ ] `POST /rotas` envia data, cidade de partida, horário, minutos por visita e custos válidos.
- [ ] Conflito 409 de rota duplicada é exibido sem criar item duplicado.
- [ ] Cidade inexistente/erro 404 é exibido na página.
- [ ] `PATCH /rotas/:id` salva ponto de saída, hora, duração por visita e custos.
- [ ] Custos vazios são enviados como `0.00`.
- [ ] Alterar configurações invalida agenda, mapa, painel e relatórios relacionados.

### Visitas e tarefas

- [ ] `POST /rotas/:diaRotaId/visitas` adiciona uma visita nova.
- [ ] Se a cliente já tiver visita futura aberta, o backend move a visita em vez de duplicar; conferir a UI após refetch.
- [ ] Lead agendado passa para avaliação agendada pelo backend e a listagem de contatos reflete isso.
- [ ] Cliente comprado em recompra continua com status persistido `comprado`.
- [ ] `POST /rotas/:diaRotaId/tarefas` cria tarefa livre.
- [ ] Tarefa pode ser concluída sem resultado de visita.
- [ ] Remover tarefa/visita pede confirmação e não exclui o contato.
- [ ] WhatsApp e Google Maps individuais das visitas abrem corretamente.
- [ ] Clique no nome da cliente abre `/contatos?contato=<UUID>`.

### Ordem da rota

- [ ] Botões subir/descer funcionam no mobile e desktop.
- [ ] Drag-and-drop entre itens persiste via `PATCH /rotas/:diaRotaId/ordem`.
- [ ] A ordem permanece após recarregar a página.
- [ ] `POST /rotas/:diaRotaId/itens/organizar-menor-distancia` só habilita com pelo menos 2 visitas.
- [ ] Otimização preserva itens concluídos e respeita tarefas conforme regra do backend.
- [ ] Erro 422 de localização insuficiente aparece para o usuário sem perder a ordem atual.

### Horários

- [ ] `POST /rotas/:diaRotaId/calcular-horarios` preenche horários persistidos.
- [ ] Horários continuam iguais após recarregar a rota.
- [ ] Alterar `horaSaida` e `minutosPorVisita`, salvar e recalcular produz novos horários.
- [ ] Tarefas com horário definido pelo backend permanecem coerentes com a ordenação.

### Conclusão e resultado

- [ ] Visita exige resultado: Comprou, Não comprou, Não atendeu ou Remarcar.
- [ ] Resultado `comprou` chama o endpoint de conclusão e exibe aviso de que o registro financeiro é separado.
- [ ] Resultado `comprou` abre o modal de Registro de compra e mantém um aviso para reabrir o modal caso ele seja fechado sem salvar.
- [ ] Resultado `nao_comprou` conclui a visita e permanece após refresh.
- [ ] Resultado `nao_atendeu` conclui a visita e permanece após refresh.
- [ ] Resultado Remarcar usa o endpoint de adiamento para mover a visita ao dia seguinte e reabri-la.
- [ ] Botão de adiar visita usa `PATCH /rotas/:diaRotaId/visitas/:itemId/adiar`.
- [ ] Item já concluído não oferece nova conclusão na UI.

### Mapa e navegação externa

- [ ] `GET /rotas/:id/mapa` alimenta mapa, distância, duração e paradas.
- [ ] Polyline6 retornada pelo backend é decodificada corretamente.
- [ ] Sem polyline, o mapa ainda enquadra partida e paradas disponíveis.
- [ ] Contato sem coordenadas não quebra o mapa.
- [ ] Mapa usa OpenStreetMap/Leaflet e cabe no layout responsivo.
- [ ] **Google Maps** abre origem/retorno na cidade de partida e usa visitas pendentes como waypoints.
- [ ] Sem paradas suficientes, a UI informa que ainda não há rota para abrir.

### Exportação e impressão

- [ ] **Excel** usa `GET /export/rota/:diaRotaId` como blob.
- [ ] Arquivo baixa como `rota-kanzler-YYYY-MM-DD.xlsx`.
- [ ] Rota vazia não habilita exportação.
- [ ] Impressão esconde sidebar, topbar, filtros, mapa/configurações e botões operacionais.
- [ ] Impressão mostra cabeçalho da rota e sequência de itens legível em A4.

### Estados e responsividade

- [ ] Loading inicial não mostra rota antiga da semana anterior.
- [ ] Falha de uma operação mostra mensagem e permite continuar usando a página.
- [ ] A agendar fica legível em 320px.
- [ ] Em telas intermediárias, mapa e configurações quebram para duas/uma coluna sem overflow.
- [ ] Em desktop largo, layout segue a referência com A agendar + rota + lateral.
- [ ] A agenda não depende exclusivamente de mouse: +, subir/descer, concluir, adiar e remover funcionam por toque/teclado.

## Observações específicas da Etapa 7

- A regra de visita futura única continua 100% no backend; o frontend só reflete o resultado da operação.
- A ordenação automática e o cálculo de horários nunca são recalculados localmente.
- O mapa apenas decodifica/desenha a `rotaPolyline` retornada; a rota real continua sendo calculada pelo backend/Geoapify.
- A ação `comprou` conclui a visita e abre o fluxo separado de Registro de compra, mantendo o `visitaId` para o backend validar o vínculo.
- A criação automática de dia ao usar +/drag usa a base padrão operacional; para uma base diferente, crie/configure o dia antes de adicionar visitas.


---

## Etapa 8 - Registro de compra

### Abertura do fluxo

- [ ] A ficha da cliente oferece **Registrar compra** no cabeçalho e no histórico.
- [ ] Abrir pela ficha não envia `visitaId`.
- [ ] Marcar uma visita como `comprou` abre o modal automaticamente após a conclusão.
- [ ] Compra iniciada pela agenda envia o `visitaId` da visita concluída.
- [ ] Fechar o modal iniciado pela agenda não perde o contexto; o aviso verde permite abrir novamente enquanto a página permanece aberta.
- [ ] A rota `/contatos?contato=<UUID>&compra=1&visita=<UUID>` continua compatível para deep-link/handoff.

### Dados do corte e cabelo

- [ ] Data do corte é obrigatória e usa `YYYY-MM-DD` na API.
- [ ] Pela agenda, a data selecionada é usada como valor inicial do corte.
- [ ] Pela ficha, a data inicial usa o dia atual em `America/Sao_Paulo`.
- [ ] Comprimento, cor, textura e química são pré-preenchidos com a última compra quando existir; caso contrário, usam o cadastro da cliente.
- [ ] Peso e comprimento aceitam apenas inteiros não negativos.
- [ ] Campos opcionais vazios não são enviados como `undefined`/strings vazias desnecessárias.

### Negociação

- [ ] Valor pago é obrigatório.
- [ ] Valores com vírgula são normalizados para decimal com ponto antes do POST.
- [ ] Forma de pagamento permite Pix ou Dinheiro, conforme contrato do backend.
- [ ] R$/g é apenas uma prévia visual calculada por `valorPago / pesoG`.
- [ ] Sem peso válido, R$/g mostra `-` e a compra ainda pode ser registrada.

### Revenda

- [ ] Valor de revenda é opcional.
- [ ] Data de revenda é opcional.
- [ ] Comprador é opcional.
- [ ] Quando preenchidos, os três campos aparecem no payload da compra.

### Persistência e regras de negócio

- [ ] `POST /contatos/:contatoId/compras` retorna a compra criada.
- [ ] Compra vinculada a visita de outro contato retorna 409 e o modal mostra a mensagem sem fechar.
- [ ] Contato inexistente retorna 404 e o modal mantém os dados digitados.
- [ ] O frontend não altera status manualmente após a compra; o backend deve promover o contato para `comprado`.
- [ ] A recompra exibida após salvar vem do backend, baseada na nova data de corte.
- [ ] Auditoria `compra_registrada` continua responsabilidade do backend.

### Atualização da aplicação

- [ ] Após sucesso, invalidar caches de contatos/ficha.
- [ ] Atualizar painel e lista de recompra.
- [ ] Atualizar agenda e rotas.
- [ ] Atualizar relatórios.
- [ ] Atualizar fotos para permitir vínculo à compra recém-criada.
- [ ] A ficha aberta exibe a nova compra no histórico sem reload completo da aplicação.

### Responsividade

- [ ] Modal cabe em 320px sem scroll horizontal.
- [ ] Rodapé de ações permanece acessível com muitos campos.
- [ ] `Esc` fecha somente quando não há envio em andamento.
- [ ] Em envio, botão muda para `Registrando...` e evita duplo submit.

### Observações importantes

- Registrar uma compra e concluir uma visita são operações separadas por desenho do backend.
- O frontend pode mostrar a prévia de R$/g, mas relatórios e métricas devem continuar usando os cálculos consolidados do backend.
- O `visitaId` só é incluído quando o fluxo veio de uma visita; o backend valida se a visita pertence ao mesmo contato.


---

## Etapa 9 - Mapa geral

### Carregamento e fonte de verdade

- [ ] `/mapa` usa exclusivamente `GET /mapa` para contatos, status visual, recompra, contagens e rota opcional.
- [ ] O frontend não recalcula se uma cliente está pronta para recompra.
- [ ] `statusMapa=recompra` é apenas visual e não altera o status persistido `comprado`.
- [ ] Contatos sem latitude/longitude são ignorados pelo backend e não quebram a renderização.
- [ ] O contador “X no mapa” corresponde ao `total` retornado pela API.

### Filtros

- [ ] “Todos os status” não envia `status`.
- [ ] Lead envia `status=lead`.
- [ ] Avaliação agendada envia `status=avaliacao_agendada`.
- [ ] Comprado envia `status=comprado`.
- [ ] Pronta p/ recompra envia `status=recompra`.
- [ ] Perdido envia `status=perdido`.
- [ ] Cidade envia `cidadeId` e usa o catálogo de `GET /cidades`.
- [ ] Só prontas p/ recompra envia `soProntasRecompra=true`.
- [ ] Filtros podem ser combinados sem duplicar regra de domínio no frontend.

### Rota sobreposta

- [ ] “Mostrar rota de” envia `dataRota=YYYY-MM-DD`.
- [ ] Desmarcar a opção remove `dataRota` da consulta.
- [ ] Data com rota desenha `rotaPolyline` do backend quando disponível.
- [ ] Sem polyline, partida/paradas ainda podem ser enquadradas.
- [ ] Ponto de saída é visualmente distinto dos contatos.
- [ ] Paradas da rota são destacadas sem esconder o status dos contatos.
- [ ] Resumo lateral exibe saída, quantidade de paradas, distância e duração retornadas pelo backend.
- [ ] Data sem rota mostra aviso e oferece acesso à agenda dessa data.

### Pinos e popups

- [ ] Lead usa cinza.
- [ ] Avaliação agendada usa azul.
- [ ] Comprado usa verde.
- [ ] Recompra usa âmbar.
- [ ] Perdido usa vermelho.
- [ ] Popup mostra nome, cidade, endereço, status e recompra quando existir.
- [ ] Abrir ficha navega para `/contatos?contato=<UUID>`.
- [ ] WhatsApp abre somente quando existe telefone válido.
- [ ] Com uma rota carregada, “Adicionar à rota” usa `POST /rotas/:diaRotaId/visitas`.
- [ ] Sem rota carregada, a ação abre `/agenda?data=YYYY-MM-DD` em vez de inventar uma rota pelo mapa.
- [ ] Erro ao adicionar/mover visita é mostrado sem derrubar o mapa.

### Resumo por cidade

- [ ] Lista lateral usa as contagens retornadas em `cidades`.
- [ ] Cidades são ordenadas por total decrescente.
- [ ] O detalhamento apresenta leads, avaliações, compras, recompras e perdidos quando diferentes de zero.
- [ ] Clicar em uma cidade aproxima os pinos dessa cidade.
- [ ] O clique para aproximar não precisa alterar o filtro de cidade.

### Estados e responsividade

- [ ] Loading exibe skeleton sem mapa antigo piscando.
- [ ] Estado vazio explica que o filtro não possui contatos.
- [ ] Erro de API exibe mensagem e botão Tentar novamente.
- [ ] Atualizar mapa dispara refetch sem recarregar a aplicação.
- [ ] Em 320px, filtros quebram em coluna e o mapa continua utilizável.
- [ ] Em tablet, lista de cidades vai abaixo do mapa sem overflow.
- [ ] Em desktop largo, mapa e lista lateral seguem a referência visual.
- [ ] Zoom e pan por toque/mouse continuam disponíveis.

### Observações importantes

- O mapa usa OpenStreetMap + Leaflet, sem depender de chave de basemap no frontend.
- O trajeto não é calculado no browser: a polyline continua vindo do backend/Geoapify.
- O clique “Adicionar à rota” respeita a regra backend de uma única visita futura aberta; se existir outra, o backend decide a movimentação.
- O mapa global não persiste coordenadas nem altera status; ele apenas consulta e executa ações já expostas pela API.


---

## Etapa 10 - Relatórios

### Período e fonte de verdade

- [ ] `/relatorios` abre com **Todo o período**.
- [ ] Os valores aceitos são `todo`, `mes_atual`, `30`, `90` e `365`.
- [ ] Alterar período atualiza indicadores, compras, preço médio, origem/perdas, conversão, viagens e detalhamento.
- [ ] Previsão de recompra permanece independente do período.
- [ ] O frontend não recalcula métricas financeiras ou regras de conversão/recompra; apenas apresenta os retornos do backend.
- [ ] Decimal string retornado pelo backend é formatado corretamente sem `NaN`.

### Indicadores

- [ ] Total comprado corresponde a `totalComprado`.
- [ ] Ticket médio corresponde a `ticketMedio`.
- [ ] Peso comprado mostra kg e gramas.
- [ ] Preço médio por grama usa o valor consolidado da API.
- [ ] Lucro na revenda usa `lucroRevenda`.
- [ ] Conversão geral usa `conversao`.
- [ ] Quantidade de cortes usa `quantidadeCompras`.

### Compras e preço por grama

- [ ] Compras por cidade são ordenadas visualmente por valor.
- [ ] Barras preservam valor e quantidade de cada cidade.
- [ ] Compras por mês são exibidas em ordem cronológica.
- [ ] Cor e textura usam `precoMedioPorGrama` retornado pelo backend.
- [ ] As barras âmbar não aplicam média simples no frontend.
- [ ] Sem dados, cada card mostra um estado vazio claro.

### Conversão, origens e perdas

- [ ] Tabela de conversão mostra cidade, contatos, avaliações, compras e percentual.
- [ ] Linha Total soma apenas contagens para apoio visual; a métrica geral oficial continua vindo do endpoint de indicadores.
- [ ] Origens exibem contatos, compras, conversão e valor comprado.
- [ ] Motivos de perda usam quantidade retornada pelo backend.
- [ ] Tabelas permanecem navegáveis em telas estreitas por scroll horizontal controlado.

### Resultado por viagem

- [ ] `GET /relatorios/viagens?periodo=` alimenta a tabela.
- [ ] Data, cidades, visitas, compras, pago, custos, custo/g, revenda e resultado são exibidos.
- [ ] Resultado negativo aparece em vermelho e positivo em verde.
- [ ] Quantidade `a revender` aparece abaixo da revenda quando maior que zero.
- [ ] Rodapé soma pago, custos, revenda e resultado das viagens carregadas.
- [ ] Clicar numa viagem abre `/agenda?data=<data da viagem>`.
- [ ] Nenhuma viagem no período exibe estado vazio sem quebrar o restante da página.

### Previsão de recompra

- [ ] `GET /relatorios/previsao-recompra` é consultado sem `periodo`.
- [ ] Tabela exibe cidade, vencidas, três janelas mensais e total quando o backend fornecer o shape consolidado.
- [ ] Vencidas recebem destaque visual vermelho.
- [ ] O adaptador tolera campos extras e shapes representativos já usados na documentação/testes da V1.
- [ ] Trocar período dos relatórios não dispara regra local de recompra.

### Detalhamento

- [ ] Compras são ordenadas da data mais recente para a mais antiga na apresentação.
- [ ] Nome, cidade, cabelo, peso, valor, R$/g e data do corte são exibidos.
- [ ] Clicar na linha abre a ficha real do contato.
- [ ] Tabela tem altura limitada e cabe em mobile por scroll horizontal/vertical.

### Exportação

- [ ] Botão Excel chama `GET /export/relatorios?periodo=` com `responseType: blob`.
- [ ] Arquivo baixa como `relatorios-kanzler.xlsx`.
- [ ] O navegador não tenta interpretar XLSX como JSON.
- [ ] Repetir download nos cinco períodos.
- [ ] Abrir arquivo e validar abas Resumo, Compras, Preço por grama, Origem e perdas, Conversão, Viagens, Previsão recompra e Detalhamento.

### Falhas, loading e responsividade

- [ ] Loading inicial não mostra números antigos de outro período.
- [ ] Falha parcial de um endpoint mostra aviso sem derrubar os blocos carregados.
- [ ] Detalhes de carregamento revelam mensagens dos endpoints que falharam.
- [ ] Botão Atualizar refaz todos os relatórios.
- [ ] Exportação com erro mantém a página utilizável.
- [ ] Em 320px os seis indicadores quebram para grade compacta sem overflow da página.
- [ ] Tabelas largas usam scroll interno e não aumentam a largura do documento.
- [ ] Em desktop largo a composição segue a referência: indicadores, pares de gráficos, tabelas e blocos inferiores.

### Observações importantes

- `previsao-recompra` não usa o filtro temporal dos demais endpoints.
- As barras são apenas uma representação visual dos números calculados pelo backend.
- O total de conversão mostrado no card oficial vem de `/relatorios/indicadores`; somas da tabela servem apenas como apoio de leitura.
- Viagem pode ficar negativa enquanto houver cabelo ainda não revendido.
- O Excel é gerado no backend; o frontend somente baixa o blob autenticado.


## Publicação (SPA) e sessão persistente

O app usa rotas do navegador (`/contatos`, `/agenda?data=...`). O servidor de
hospedagem precisa devolver `index.html` para qualquer caminho que não seja um
arquivo (SPA fallback); senão, acessar uma URL direto ou recarregar dá 404.

- **Netlify / Cloudflare Pages:** `public/_redirects` (já incluído, vai para o `dist`).
- **Vercel:** `vercel.json` (já incluído).
- **Nginx:** `location / { try_files $uri $uri/ /index.html; }`
- **Render (static site):** regra *Rewrite* `/*` → `/index.html`.
- `npm run preview` já faz o fallback.

Sessão: o login fica salvo no cookie HttpOnly do backend (400 dias, renovado a
cada uso). Se front e API estiverem em domínios de sites diferentes, configure no
backend `AUTH_COOKIE_SAMESITE=none` + `FRONTEND_ORIGINS` (veja `backend/.env.example`);
o ideal é publicar os dois sob o mesmo domínio (ex.: `app.` e `api.`).
