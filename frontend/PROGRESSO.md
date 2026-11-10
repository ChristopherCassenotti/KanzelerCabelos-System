# Progresso - Frontend Kanzler Cabelos

## Etapa 1 - Base do frontend ✅

Concluído em 20/10/2026.

- React + TypeScript + Vite configurados.
- Tailwind CSS configurado via plugin do Vite.
- React Router configurado.
- TanStack Query configurado.
- React Hook Form + Zod adicionados às dependências.
- Leaflet / React Leaflet adicionados às dependências.
- Axios centralizado.
- `.env.example` com `VITE_API_URL`.
- Estrutura base de pastas criada.
- Tokens visuais baseados no protótipo HTML.

## Etapa 2 - Autenticação ✅

Concluído em 20/10/2026.

- Tela de login responsiva seguindo a identidade visual do protótipo.
- Formulário com React Hook Form + Zod.
- Integração `POST /auth/login` usando `{ email, senha }`.
- Access token mantido somente em memória.
- Usuário autenticado mantido em store reativa em memória.
- `POST /auth/refresh` executado ao iniciar a aplicação para recuperar sessão por cookie HttpOnly.
- Cliente HTTP protegido envia `Authorization: Bearer <accessToken>` automaticamente.
- Renovação automática após `401`, com retry único da requisição original.
- Refresh concorrente deduplicado para evitar múltiplas renovações simultâneas.
- Falha de refresh limpa a sessão.
- `POST /auth/logout` implementado e cache do TanStack Query limpo ao sair.
- Rotas privadas protegidas.
- `/login` bloqueado para usuários já autenticados.
- Redirecionamento de volta à rota original após autenticação.
- Loading global durante recuperação inicial da sessão.
- Mensagens de erro de API normalizadas para a tela de login.

## Etapa 3 - Layout principal ✅

Concluído em 20/10/2026.

- `AppLayout` reutilizável criado.
- Sidebar baseada no protótipo visual Kanzler.
- Navegação para Painel, Contatos, Agenda e rotas, Mapa e Relatórios.
- Estado ativo da navegação via React Router.
- Atalho Novo contato preparado com `?novo=1`.
- Atalho Rota de amanhã preparado com data calculada em `America/Sao_Paulo`.
- Topbar reutilizável com título/subtítulo por página.
- Busca global integrada a `GET /contatos/busca?q=`.
- Debounce de busca para reduzir chamadas à API.
- Dropdown com loading, vazio, erro e resultados.
- Resultado da busca encaminha para `/contatos?contato=<UUID>` para integração futura com a ficha.
- Sidebar mobile com hamburger, overlay e fechamento automático na navegação.
- Logout preservado no layout principal.
- Rotas-base internas preparadas sem antecipar telas de negócio das etapas seguintes.
- README passou a manter checklist acumulativo de testes de cada etapa e base do super teste final.

## Etapa 4 - Painel ✅

Concluído em 20/10/2026.

- Tela real `/painel` criada no lugar do placeholder.
- Integração principal com `GET /painel/resumo`.
- Integração com `GET /recompras/prontas` para listar clientes elegíveis para recompra sem duplicar a regra no frontend.
- Integração com `GET /rotas?de=&ate=` para listar visitas dos próximos 7 dias.
- Integração com `GET /relatorios/indicadores?periodo=mes_atual` para cortes, valor pago e peso do mês.
- Integração com `GET /relatorios/compras?periodo=mes_atual` para valor comprado por cidade.
- Cards principais alinhados à referência visual: contatos, próximas visitas, cortes no mês, valor pago e recompra.
- Resumo do funil com leads, avaliações, comprados, perdidos e total A agendar.
- Lista de clientes prontas para recompra com último corte e indicador de vencimento.
- Lista das próximas visitas com data, cidade e horário.
- Atalhos do painel para ficha futura do contato, lista de contatos e agenda.
- Gráfico em barras de valor comprado por cidade no mês atual.
- Loading inicial em skeleton.
- Falhas parciais de API não derrubam o painel inteiro e oferecem ação de recarregar.
- Estados vazios para recompra, visitas e compras por cidade.
- Layout responsivo mantendo a identidade visual do HTML de referência.
- README atualizado com checklist detalhado da etapa e novos itens do super teste final.

## Etapa 5 - Contatos ✅

Concluído em 20/10/2026.

- Rota real `/contatos` substituiu o placeholder.
- Listagem integrada a `GET /contatos` + ficha enriquecida por `GET /contatos/:id`.
- Concorrência limitada a 6 carregamentos de detalhes para evitar rajada descontrolada de requisições.
- Catálogo de cidades via `GET /cidades`.
- Filtros por cidade, status, origem e cabelo natural.
- Tabela desktop baseada na referência com contato, cidade, status, cabelo, valor, R$/g, corte e recompra.
- Cards responsivos para tablet/mobile.
- Novo contato via `POST /contatos` com React Hook Form + Zod.
- Edição via `PATCH /contatos/:id`.
- Drawer de ficha acionado por `?contato=<UUID>`, integrando busca global e atalhos do painel.
- Ficha exibe dados cadastrais, cabelo, recompra calculada, histórico de compras, observações e fotos existentes por signed URL.
- Transições de status usam exclusivamente `PATCH /contatos/:id/status`.
- Motivo de perda obrigatório na UI quando destino é `perdido`.
- WhatsApp e Google Maps com fallback por endereço/cidade.
- Exportação XLSX de contatos via `GET /export/contatos`, usando blob e os filtros suportados pelo backend.
- Soft delete via `DELETE /contatos/:id`.
- Hard delete LGPD via `DELETE /contatos/:id/definitivo`, com confirmação forte digitando `EXCLUIR`.
- Invalidação de caches de contatos, painel, recompra e relatórios após mutações.
- README ampliado com checklist completo da Etapa 5 e novos cenários para o super teste final.
- Upload e exclusão de fotos permanecem intencionalmente fora desta etapa.

## Etapa 6 - Fotos privadas ✅

Concluído em 20/10/2026.

- Galeria privada integrada a `GET /contatos/:contatoId/fotos`.
- URLs assinadas tratadas como temporárias, sem persistência no navegador.
- Atualização manual dos links assinados e refetch periódico enquanto a ficha está aberta.
- Upload bloqueado na UI quando `autorizouFoto=false`, mantendo também a proteção 403 do backend.
- Upload multipart integrado a `POST /contatos/:contatoId/fotos`.
- Seleção múltipla com limite de 4 arquivos por lote.
- Validação local de JPEG, PNG e WebP.
- Validação local de 10 MiB por arquivo.
- Pré-visualização local antes do envio.
- Progresso global de upload para lotes.
- Campo opcional de tipo da foto.
- Vinculação opcional das fotos a uma compra existente do mesmo contato.
- Tratamento explícito de falha parcial: arquivos já concluídos são mantidos e a galeria é recarregada.
- Galeria completa sem limite artificial de quantidade.
- Lightbox em tela cheia com navegação por botões e teclado.
- Fallback visual para signed URL expirada/quebrada.
- Exclusão integrada a `DELETE /contatos/:contatoId/fotos/:fotoId` com confirmação.
- Atualização dos caches de fotos e ficha após upload/exclusão.
- Layout responsivo para galeria, upload e lightbox.
- README atualizado com checklist de privacidade, upload, lightbox, exclusão e novos itens do super teste final.

## Etapa 7 - Agenda e rotas ✅

Concluído em 20/10/2026.

- Rota real `/agenda` substituiu o placeholder.
- Seleção de data sincronizada por `?data=YYYY-MM-DD`, com Hoje, Amanhã e navegação semanal.
- Semana visual com quantidade de visitas por dia e suporte a drop de contatos em outro dia.
- Fila A agendar integrada a `GET /a-agendar` e resumo a `GET /a-agendar/resumo`.
- Filtros de A agendar por tipo e cidade.
- Compatibilidade com shape achatado do serviço atual e shape aninhado representativo da documentação.
- Criação de dia via `POST /rotas`, inclusive criação automática ao adicionar a primeira visita.
- Edição de ponto de saída, horário, minutos por visita e custos via `PATCH /rotas/:id`.
- Adicionar/mover visita via `POST /rotas/:diaRotaId/visitas`, preservando a regra backend de uma visita futura aberta.
- Tarefas livres via `POST /rotas/:diaRotaId/tarefas`.
- Conclusão de tarefa e resultado de visita via endpoint próprio.
- Remarcação/adiamento usando `PATCH /rotas/:diaRotaId/visitas/:itemId/adiar`.
- Remoção de itens sem excluir o contato.
- Reordenação manual por drag-and-drop e botões subir/descer, persistida no backend.
- Organização por menor distância via endpoint backend, sem replicar heurística no frontend.
- Cálculo de horários via endpoint backend, sem cálculo paralelo local.
- Mapa da rota em Leaflet usando DTO de `GET /rotas/:id/mapa`.
- Decodificação de polyline6 apenas para renderização do trajeto.
- Google Maps com partida/retorno à base e waypoints das visitas pendentes.
- Exportação XLSX da rota via blob.
- CSS de impressão para uma versão limpa da sequência da rota.
- Handoff preparado para Registro de compra quando o resultado da visita é `comprou`.
- Layout adaptativo: não depende de drag-and-drop para uso mobile.
- README atualizado com checklist amplo da agenda e cenários 33-50 do super teste final.

## Observações

- O frontend não deve duplicar regras de status, recompra, geocoding, visita futura única, ordenação de rota, cálculo de horários ou relatórios; essas regras ficam no backend.
- O endpoint de listagem atual não entrega cidade/compras/recompra enriquecidas; a Etapa 5 usa detalhes concorrentes como solução V1 e isso deve ser medido no super teste.
- `signedUrl` de foto é temporária (3600s) e nunca deve virar URL persistente no estado de domínio.
- O formulário de edição omite campos vazios; se for necessário limpar campos já preenchidos, confirmar no schema do backend quais aceitam `null` antes de habilitar essa ação.
- O access token não é salvo em localStorage/sessionStorage.
- O refresh token continua inacessível ao JavaScript e depende de `withCredentials: true`.
- Perfis Admin/Operador e painel de IA permanecem fora da V1 desta etapa.
- O `npm install` não pôde ser concluído no ambiente de geração nas etapas anteriores por timeout; `typecheck` e `build` devem ser executados no ambiente local após instalar as dependências.

## Etapa 8 - Registro de compra ✅

Concluído em 20/10/2026.

- Serviço de compras criado para `GET/POST /contatos/:contatoId/compras`.
- Tipos dedicados de payload e retorno de compra adicionados.
- Schema Zod criado para data do corte, peso, comprimento, cor, textura, química, valor pago, pagamento e revenda.
- Modal reutilizável de Registro de compra criado.
- Fluxo disponível diretamente pela ficha da cliente.
- Fluxo disponível após concluir visita com resultado `comprou`.
- Compra iniciada pela agenda mantém e envia `visitaId` automaticamente.
- Modal aberto pela agenda usa a data selecionada como data inicial do corte.
- Modal aberto pela ficha usa a data atual em `America/Sao_Paulo`.
- Características do cabelo são pré-preenchidas pela última compra, com fallback para o cadastro da cliente.
- Prévia de preço por grama calculada apenas para UX, sem substituir cálculos de relatório do backend.
- Campos monetários aceitam vírgula na UI e são normalizados para ponto antes do POST.
- Dados opcionais de revenda, data de revenda e comprador suportados.
- Erros 404/409/validação permanecem no modal sem apagar o formulário.
- Após sucesso, caches de contatos, ficha, painel, recompra, agenda, rotas, relatórios e fotos são invalidados.
- Histórico da ficha passa a refletir a nova compra após refetch, sem reload completo da aplicação.
- Status `comprado`, auditoria e regra de recompra permanecem exclusivamente no backend.
- Deep-link `/contatos?contato=<UUID>&compra=1&visita=<UUID>` continua compatível.
- README atualizado com checklist completo da etapa e Super Teste Final consolidado até o cenário 63.
- Corrigido um fechamento duplicado de `</header>` encontrado no drawer de contato durante a integração.

## Etapa 9 - Mapa geral ✅

Concluído em 20/10/2026.

- Placeholder `/mapa` substituído pela tela real em Leaflet.
- Integração com `GET /mapa` e filtros suportados pelo backend.
- Catálogo de cidades reutilizado via `GET /cidades`.
- Pinos por status visual: Lead, Avaliação agendada, Comprado, Recompra e Perdido.
- Cores alinhadas ao padrão visual da referência.
- Filtro de status, cidade e somente prontas para recompra.
- Sobreposição opcional da rota por `dataRota`.
- Polyline6 da rota desenhada sem recalcular o trajeto no frontend.
- Partida e paradas da rota destacadas.
- Popup com nome, cidade, endereço, status, recompra, ficha, rota e WhatsApp.
- Adição/movimentação para rota existente usando o endpoint de visitas e a regra backend de visita futura única.
- Sem rota existente, o popup encaminha para a agenda da data selecionada em vez de criar regra paralela no mapa.
- Lista lateral por cidade com contagens retornadas pela API.
- Clique na cidade aproxima os pinos correspondentes.
- Resumo da rota mostra saída, paradas, distância e duração.
- Loading, estado vazio, erro com refetch e atualização manual.
- Layout responsivo para celular, tablet e desktop.
- README atualizado com checklist completo da Etapa 9 e Super Teste Final até o cenário 76.

## Etapa 10 - Relatórios ✅

Concluído em 21/10/2026.

- Placeholder `/relatorios` substituído pela tela funcional.
- Filtro consolidado por `todo`, `mes_atual`, `30`, `90` e `365` com query string sincronizada.
- Integração com `GET /relatorios/indicadores` para os seis KPIs oficiais.
- Integração com `GET /relatorios/compras` para compras por cidade e evolução mensal.
- Integração com `GET /relatorios/preco-medio` para cor e textura, sem recalcular média ponderada no browser.
- Integração com `GET /relatorios/origens-perdas`.
- Integração com `GET /relatorios/conversao-cidade`.
- Integração com `GET /relatorios/viagens` e navegação de cada viagem para o dia correspondente na agenda.
- Totais visuais de viagens para pago, custos, revenda e resultado.
- Integração independente com `GET /relatorios/previsao-recompra`, sem enviar período.
- Adaptador tolerante para o shape de previsão de recompra, preservando a regra do backend.
- Integração com `GET /relatorios/detalhamento-compras`, com acesso à ficha da cliente.
- Exportação via `GET /export/relatorios?periodo=` usando blob XLSX.
- Loading inicial, falha parcial, refresh manual, estados vazios e mensagens de erro.
- Layout responsivo com scroll interno para tabelas largas.
- Componentes reutilizáveis de KPI, painel e barras horizontais.
- README atualizado com checklist completo da Etapa 10.
- Super Teste Final ampliado até o cenário 90, cobrindo agora todas as telas funcionais da V1.

## Próxima etapa

### Etapa 11 - Qualidade, integração e Super Teste Final

Pendente:
- instalar dependências no ambiente real e executar `npm run typecheck`;
- executar `npm run build` e corrigir qualquer incompatibilidade real de tipos/dependências;
- iniciar backend + frontend juntos com banco DEV;
- percorrer os 90 cenários acumulados do README;
- corrigir bugs encontrados por fluxo, sem adicionar regra de negócio duplicada no frontend;
- validar sessão expirada/refresh durante telas com múltiplas consultas;
- validar desktop, tablet e 320px nas cinco áreas principais;
- medir performance da listagem enriquecida de contatos e dos relatórios paralelos;
- revisar acessibilidade, confirmações destrutivas, loading, empty states e mensagens de erro;
- preparar checklist de produção depois do aceite funcional completo.

## Assistente IA (V1) ✅

Concluído em 21/10/2026.

- Página autenticada `/assistente` e item "Assistente IA" na sidebar.
- Cadastro de contatos por linguagem natural (OpenAI pelo backend; chave nunca no frontend).
- Rascunho com perguntas de campos faltantes, correções, escolha de cidade ambígua e aviso de duplicidade.
- Card de confirmação (Confirmar / Editar / Cancelar); o banco só é alterado após confirmação.
- Idempotência por tentativa de cadastro (backend) + trava de envio no frontend.
- Sucesso com "Abrir ficha" (`/contatos?contato=<UUID>`) e invalidação de contatos, painel, recompra, relatórios, mapa e agenda.
- Testes: `npm test` (reducer, caches, navegação, service e componentes).
