(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CFPCalc = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  const nextYM = ym => { let [y,m]=ym.split("-").map(Number); m++; if(m>12){m=1;y++;} return y+"-"+String(m).padStart(2,"0"); };
  const prevYM = ym => { let [y,m]=ym.split("-").map(Number); m--; if(m<1){m=12;y--;} return y+"-"+String(m).padStart(2,"0"); };
  const labelYM = ym => { let [y,m]=ym.split("-").map(Number); return MESES[m-1]+" "+y; };

  const fmt = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
  const fmtK = v => { v=v||0; if(Math.abs(v)>=1000) return "R$ "+(v/1000).toFixed(v%1000?1:0).replace(".",",")+"k"; return fmt(v); };

  // Soma entradas/saidas de um mes e calcula o saldo. Trata "cartao" sem
  // acento/case para nao depender da categoria estar escrita de um jeito so.
  function totals(m) {
    let entr=0, said=0, cartao=0;
    (m.lancamentos||[]).forEach(l => {
      if (l.tipo === "entrada") entr += (+l.pago || 0);
      else {
        said += (+l.pago || 0);
        if ((l.cat||"").toLowerCase().includes("cart")) cartao += (+l.pago || 0);
      }
    });
    return { entr, said, cartao, saldo: entr - said };
  }

  return { MESES, nextYM, prevYM, labelYM, fmt, fmtK, totals };
});
