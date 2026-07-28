// Testes das rotinas financeiras criticas do app (calc.js).
// Rodar com: node --test tests/calc.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { nextYM, prevYM, labelYM, fmtK, totals } = require("../calc.js");

test("nextYM avança o mês normalmente", () => {
  assert.equal(nextYM("2026-03"), "2026-04");
});

test("nextYM vira o ano em dezembro -> janeiro", () => {
  assert.equal(nextYM("2026-12"), "2027-01");
});

test("prevYM volta o mês normalmente", () => {
  assert.equal(prevYM("2026-04"), "2026-03");
});

test("prevYM vira o ano em janeiro -> dezembro do ano anterior", () => {
  assert.equal(prevYM("2026-01"), "2025-12");
});

test("labelYM formata mês por extenso em português", () => {
  assert.equal(labelYM("2026-01"), "janeiro 2026");
  assert.equal(labelYM("2026-12"), "dezembro 2026");
});

test("fmtK abrevia valores grandes em k e mantém valores pequenos por extenso", () => {
  // Intl.NumberFormat("pt-BR") usa espaço não-quebrável ( ) entre "R$" e o valor.
  assert.equal(fmtK(500), "R$ 500,00");
  assert.equal(fmtK(1000), "R$ 1k");
  assert.equal(fmtK(1500), "R$ 1,5k");
  assert.equal(fmtK(0), "R$ 0,00");
});

test("totals soma entradas e saídas e calcula o saldo corretamente", () => {
  const mes = { lancamentos: [
    { tipo: "entrada", pago: 3000 },
    { tipo: "saida", pago: 1000, cat: "Mercado" },
    { tipo: "saida", pago: 500, cat: "Aluguel" },
  ] };
  const t = totals(mes);
  assert.equal(t.entr, 3000);
  assert.equal(t.said, 1500);
  assert.equal(t.saldo, 1500);
});

test("totals detecta gastos de cartão sem depender de acento ou maiúsculas", () => {
  const mes = { lancamentos: [
    { tipo: "saida", pago: 200, cat: "Cartão de crédito" },
    { tipo: "saida", pago: 50, cat: "CARTAO" },
    { tipo: "saida", pago: 80, cat: "Mercado" },
  ] };
  const t = totals(mes);
  assert.equal(t.cartao, 250);
  assert.equal(t.said, 330);
});

test("totals com lançamentos não pagos (pago=0) não infla entradas/saídas", () => {
  const mes = { lancamentos: [
    { tipo: "entrada", pago: 0 },
    { tipo: "saida", pago: 0, cat: "Aluguel" },
  ] };
  const t = totals(mes);
  assert.equal(t.entr, 0);
  assert.equal(t.said, 0);
  assert.equal(t.saldo, 0);
});

test("totals com mês vazio não quebra e retorna zeros", () => {
  const t = totals({ lancamentos: [] });
  assert.deepEqual(t, { entr: 0, said: 0, cartao: 0, saldo: 0 });
});

test("saldo negativo quando saídas superam entradas", () => {
  const mes = { lancamentos: [
    { tipo: "entrada", pago: 100 },
    { tipo: "saida", pago: 400, cat: "Outros" },
  ] };
  const t = totals(mes);
  assert.equal(t.saldo, -300);
});
