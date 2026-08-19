// onboarding-check.js
// Roda no <head> (antes do corpo da página renderizar) pra redirecionar
// quem nunca viu a introdução pra boas-vindas.html primeiro. Depois que a
// pessoa passa por lá uma vez (ou pula), nunca mais é interrompida.

(function () {
    if (window.location.pathname.endsWith("boas-vindas.html")) return;

    const visto = localStorage.getItem("onboardingVisto_demo");
    if (visto) return;

    window.location.replace("boas-vindas.html");
})();
