# Auditoria de Tracking — Controle Financeiro Premium

**Data:** 2026-07-31
**Escopo:** `index.html`, `app.html`, `privacidade.html`, `termos.html` — leitura de código, sem alterações.
**Natureza:** diagnóstico read-only. Nenhuma correção foi implementada neste documento; recomendações ficam marcadas por risco para decisão em separado.

---

## 1. O que está funcionando

- **Meta Pixel** instalado nas 4 páginas HTML do site (`index.html`, `app.html`, `privacidade.html`, `termos.html`), mesmo ID (`1063747469605383`), sempre nas primeiras linhas do `<head>`. Snippet oficial (assíncrono via `t.async=true`), não bloqueia renderização.
- Eventos `fbq` confirmados no código (busca exaustiva em todo o repo):
  - `PageView` — automático, disparado no load das 4 páginas.
  - `InitiateCheckout` — disparado ao abrir o modal de checkout (`index.html:1126` na versão anterior à revisão de CRO desta branch; a lógica não foi alterada, apenas reposicionada por conta das edições de copy).
  - `Lead` — disparado ao submeter o formulário nome+WhatsApp, após validação OK, antes do redirecionamento para a Hotmart.
- Fallback `<noscript>` com pixel de imagem 1×1 para `PageView`, cobrindo visitantes sem JavaScript.
- **Vercel Web Analytics** presente em `index.html` (`/_vercel/insights/script.js`, `defer`, sem bloqueio) — depende de estar ativado no painel da Vercel; não é verificável só por leitura de código.
- **Validação de formulário** permissiva (nome ≥ 2 caracteres, telefone 10–13 dígitos após stripar não-dígitos) — não há evidência de que bloqueie envios legítimos.
- **Fetch do webhook de leads** (Google Apps Script, grava numa planilha Google) é *fire-and-forget*: não é `await`ado, então uma falha de rede não trava o redirecionamento para a Hotmart. Comportamento correto para não perder conversão.
- **Meta viewport** correto (`width=device-width, initial-scale=1.0`) nas 4 páginas.
- Nenhum `console.log`/`console.error` esquecido em produção (zero ocorrências no repo).
- Nenhum CSS/JS externo *render-blocking* no `<head>` — o CSS é Tailwind pré-compilado inline, o Pixel é inline+async, o Vercel Analytics tem `defer`.
- Vídeo (`video_instagram.mp4`, ~6,86 MB) com `preload="none"` + `poster`, só baixa sob demanda ao clique do usuário.
- Única imagem de conteúdo real (`autor_avatar.jpg`) já com `loading="lazy"`.

## 2. Gaps encontrados

- **Evento `ViewContent`**: não encontrado.
- **Evento `AddToCart`**: não encontrado.
- **Evento `Purchase`**: não encontrado. Isso é esperado dado o desenho atual do funil — o checkout final acontece 100% no domínio da Hotmart (`pay.hotmart.com`), fora deste repositório. O site nunca recebe confirmação de pagamento, então não há como disparar `Purchase` sem uma integração adicional (ver recomendações).
- **Conversions API (CAPI) server-side**: não encontrada. O único webhook existente no repo é o Google Apps Script que grava o lead (nome, WhatsApp, timestamp, origem) numa planilha Google — não tem nenhuma relação com Facebook/CAPI.
- **Deduplicação via `event_id`** entre Pixel client-side e CAPI: não encontrada. Não se aplica hoje, já que não há CAPI implementada.
- **GTM (Google Tag Manager)**: não encontrado — zero ocorrências de `googletagmanager.com/gtm.js` ou `GTM-` em qualquer arquivo do repo.
- **GA4 (Google Analytics 4)**: não encontrado — zero ocorrências de `gtag(` ou de um measurement ID (`G-...`) em qualquer arquivo.
- **Heatmap / session recording**: não encontrado. Buscado explicitamente: Hotjar, Microsoft Clarity, Lucky Orange, Mouseflow, Crazy Egg — nenhum presente.
- **Página de "obrigado" (thank-you page) pós-compra**: não existe no repositório. `app.html` é o produto entregue ao cliente (dashboard PWA), não uma thank-you page de conversão — não deve ser confundido com uma.
- **Observabilidade do webhook de leads**: o `try/catch` ao redor do `fetch` está vazio. Se o Apps Script falhar (cota excedida, URL expirada, etc.), não há log, alerta ou retry — o lead permanece salvo apenas em `localStorage` do navegador do próprio visitante, o que não é monitorável do lado do negócio.
- **Vercel Web Analytics** está presente apenas em `index.html`, não nas outras 3 páginas (`app.html`, `privacidade.html`, `termos.html`) — não avaliado se é intencional.

## 3. Hipóteses de gargalo (ranqueadas por evidência)

1. **[Alta evidência]** Sem `Purchase`/CAPI, não há como medir ROAS real por campanha de anúncio — toda a otimização de tráfego pago hoje depende de `Lead`/`InitiateCheckout` como proxy de intenção, não de venda confirmada. Isso é estrutural (checkout fora do domínio), não um bug de implementação.
2. **[Alta evidência]** Sem GA4/GTM, não há visão de funil completo (origem de tráfego × scroll por seção × cliques × abandono no formulário) — o Pixel sozinho não substitui essa granularidade.
3. **[Média evidência]** Sem heatmap/gravação de sessão, não é possível confirmar visualmente onde os visitantes hesitam antes de abrir o modal de checkout (ex.: se travam mais perto do preço, das dúvidas, ou saem antes de rolar até lá). Hipótese não verificável só por leitura de código — precisa de dados reais de uso.
4. **[Baixa evidência / não verificável via código]** Se o Vercel Web Analytics está de fato ativo no painel da Vercel — depende de configuração externa ao repositório, não é possível confirmar por aqui.

## 4. Recomendações

- **[PRECISA DE JANELA COMBINADA]** Implementar uma página de obrigado dedicada (via redirecionamento pós-compra configurável no painel da Hotmart) + evento `Purchase` disparado nela, para fechar a mensuração do funil.
- **[PRECISA DE JANELA COMBINADA]** Avaliar Conversions API server-side via webhook de postback da Hotmart, com deduplicação por `event_id` compartilhado entre Pixel client-side e CAPI.
- **[BAIXO RISCO]** Adicionar GA4 (ou GTM) ao `<head>` das 4 páginas para visão de funil e origem de tráfego — não interfere no Meta Pixel existente.
- **[BAIXO RISCO]** Adicionar um log mínimo (ex.: reaproveitar o próprio webhook de leads para reportar erro, ou expor no console apenas em modo debug) quando o `fetch` do webhook de leads falhar — sem alterar o comportamento *fire-and-forget* atual, que está correto.
- **[BAIXO RISCO]** Confirmar no painel da Vercel se o Web Analytics está de fato habilitado para o projeto (fora do escopo de código deste repositório).
- **[BAIXO RISCO]** Não implementar evento `Purchase` "encaixado" sem uma confirmação real de pagamento (ex.: disparar no clique do botão de checkout) — isso inflaria métricas de conversão com eventos que não representam vendas de fato, o que distorceria a otimização de campanha.
- **[BAIXO RISCO]** Esta branch já implementou um teste A/B leve do hero (`?v=b` na URL, ver `index.html`). Se o teste for usado em campanha, considerar — em decisão separada — anexar a variante como parâmetro nos eventos `InitiateCheckout`/`Lead` já existentes, para permitir comparar performance por variante. Não implementado nesta rodada por alterar o payload de eventos de tracking já em produção, o que está fora do escopo desta auditoria/CRO sem aprovação explícita.
