/* ===========================================================
    scripts/script.js
    Integrado: preloader, dark theme, carousel, orig
    =========================================================== */

/* ---------- Helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ===========================================================
    CONTROLE DO MODAL
    =========================================================== */
function abrirModal(titulo, corpoHTML) {
    const modal = document.getElementById('search-modal');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalCorpo = document.getElementById('modal-corpo');

    if (!modal || !modalTitulo || !modalCorpo) return;

    modalTitulo.textContent = titulo;
    modalCorpo.innerHTML = corpoHTML;
    
    // Mostra o modal com animação
    modal.style.display = 'flex'; // Garante que o display flex seja usado
    setTimeout(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evita rolagem do fundo
    }, 10);
}

function fecharModal() {
    const modal = document.getElementById('search-modal');
    if (!modal) return;
    
    // Remove a classe para iniciar a transição de fechamento
    modal.classList.remove('active');
    document.body.style.overflow = ''; 
    
    // Oculta o modal após a transição
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Fechar ao clicar fora
window.addEventListener('click', (event) => {
    const modal = document.getElementById('search-modal');
    if (event.target === modal) {
        fecharModal();
    }
});

// Fechar ao pressionar ESC
document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('search-modal');
    if (event.key === 'Escape' && modal && modal.classList.contains('active')) {
        fecharModal();
    }
});

/* ===========================================================
    PRELOADER (remoção após carregamento)
    *** ATUALIZADO: Remoção do código de porcentagem/partículas. ***
    =========================================================== */
(function() {
    const preloader = document.getElementById('preloader');

    window.addEventListener('load', () => {
        if (preloader) {
            // Delay de 1000ms (1s) para garantir que a animação CSS (que é de 2s) 
            // tenha tempo suficiente para ser vista, antes de sumir.
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 1000); 
        }
    });
})();

/* ===========================================================
    BACKGROUND PARTICLES (global)
    =========================================================== */
(function() {
    // Verifica se o canvas já existe para evitar duplicação em SPAs (apesar de este ser um multipage)
    if (!document.getElementById('bg-particles')) {
        const c = document.createElement('canvas');
        c.id = 'bg-particles';
        document.body.appendChild(c);
    }
    const canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);

    const count = Math.max(30, Math.floor(W*H/90000));
    const arr = [];
    for (let i=0;i<count;i++){
        arr.push({
            x: Math.random()*W,
            y: Math.random()*H,
            r: Math.random()*1.8+0.6,
            vx: (Math.random()-0.5)*0.3,
            vy: (Math.random()-0.5)*0.3
        });
    }

    function loop(){
        ctx.clearRect(0,0,W,H);
        const dark = document.body.classList.contains('dark');
        arr.forEach(p=>{
            p.x += p.vx; p.y += p.vy;
            if (p.x < -10) p.x = W+10;
            if (p.x > W+10) p.x = -10;
            if (p.y < -10) p.y = H+10;
            if (p.y > H+10) p.y = -10;
            ctx.beginPath();
            ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
            ctx.fillStyle = dark ? 'rgba(180,220,255,0.08)' : 'rgba(0,120,255,0.04)';
            ctx.fill();
        });
        requestAnimationFrame(loop);
    }
    loop();
})();

/* ===========================================================
    DARK THEME: automática + manual + persistência
    =========================================================== */
(function() {
    const btn = document.getElementById('toggle-theme');
    if (!btn) return;

    const saved = localStorage.getItem('tema');
    function temaAutomatico() {
        const h = new Date().getHours();
        return (h >= 19 || h <= 6) ? 'dark' : 'light';
    }
    let temaAtual = saved || temaAutomatico();

    function aplicarTema(tema, usarFade=false) {
        const isDark = tema === 'dark';
        if (usarFade) {
            document.body.classList.add('fade-transition');
            setTimeout(()=> document.body.classList.remove('fade-transition'), 420);
        }
        document.body.classList.toggle('dark', isDark);
        btn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('tema', tema);
    }

    aplicarTema(temaAtual, false);

    btn.addEventListener('click', ()=> {
        temaAtual = (temaAtual === 'dark') ? 'light' : 'dark';
        aplicarTema(temaAtual, true);
    });
})();

/* ===========================================================
    CARROSSEL: Slider Card Moderno - Loop Infinito
    =========================================================== */
(function() {
    const track = document.getElementById('carousel-track');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (!track || !prev || !next) return;

    // slides (original)
    const slides = Array.from(track.querySelectorAll('.slide'));
    if (slides.length === 0) return;

    // clone first and last for infinite loop
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.classList.add('clone');
    lastClone.classList.add('clone');

    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstChild);

    // recompute slides array including clones
    let allSlides = Array.from(track.children);

    // sizes
    function getSizes() {
        const viewport = document.querySelector('.carousel-viewport');
        const viewportWidth = viewport.clientWidth;
        // Pega o primeiro slide que não seja o clone, ou o primeiro se não houver clones
        const slideEl = allSlides.find(s => !s.classList.contains('clone')) || allSlides[0];
        const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
        const slideWidth = slideEl.getBoundingClientRect().width;
        return { viewportWidth, slideWidth, gap };
    }

    // initial index pointing to the first real slide
    let index = 1; // because we added lastClone at start
    let isTransitioning = false;

    function updatePosition(animate=true) {
        const { slideWidth, gap } = getSizes();
        // Cálculo para centralizar o slide atual
        const move = (slideWidth + gap) * index - ( ( (getSizes().viewportWidth - slideWidth) / 2 ) );
        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 1.2s cubic-bezier(.22,.9,.2,1)';
        }
        track.style.transform = `translateX(${-move}px)`;
        if (!animate) {
            // força o reflow para aplicar a transição instantaneamente
            track.getBoundingClientRect();
            track.style.transition = 'transform 1.2s cubic-bezier(.22,.9,.2,1)';
        }
    }

    // chama no load para centralizar o primeiro slide
    window.addEventListener('load', ()=> {
        allSlides = Array.from(track.children);
        setTimeout(()=> updatePosition(false), 30);
    });

    // next / prev
    function gotoNext() {
        if (isTransitioning) return;
        isTransitioning = true;
        index++;
        updatePosition(true);
    }
    function gotoPrev() {
        if (isTransitioning) return;
        isTransitioning = true;
        index--;
        updatePosition(true);
    }

    next.addEventListener('click', gotoNext);
    prev.addEventListener('click', gotoPrev);

    // keyboard accessibility
    next.addEventListener('keydown', (e) => { if (e.key === 'Enter') gotoNext(); });
    prev.addEventListener('keydown', (e) => { if (e.key === 'Enter') gotoPrev(); });

    // após a transição, se estivermos em um clone, pulamos para o slide real silenciosamente
    track.addEventListener('transitionend', () => {
        allSlides = Array.from(track.children);
        // se o índice estiver no último (que é o firstClone)
        if (allSlides[index].classList.contains('clone') && index === allSlides.length - 1) {
            // pulou para o firstClone -> pula para o real primeiro (index 1)
            index = 1;
            updatePosition(false);
        }
        // se o índice estiver no primeiro (que é o lastClone)
        if (allSlides[index].classList.contains('clone') && index === 0) {
            // pulou para o lastClone -> pula para o real último (index length - 2)
            index = allSlides.length - 2;
            updatePosition(false);
        }
        isTransitioning = false;
    });

    // Auto-play (optional)
    let autoplay = setInterval(()=> { gotoNext(); }, 5000);
    // pausa na interação
    const carouselEl = document.getElementById('main-carousel');
    if (carouselEl) {
        carouselEl.addEventListener('mouseenter', ()=> clearInterval(autoplay));
        carouselEl.addEventListener('mouseleave', ()=> autoplay = setInterval(()=> gotoNext(), 5000));
    }

    // lida com o redimensionamento para recentralizar
    window.addEventListener('resize', ()=> {
        setTimeout(()=> updatePosition(false), 80);
    });
})();

/* ===========================================================
    SUAS FUNÇÕES ORIGINAIS
    =========================================================== */

// mostrarInfo
function mostrarInfo(id) {
    const elemento = document.getElementById(id);
    if (!elemento) return;

    if (elemento.style.display === "block") {
        elemento.style.opacity = "0";
        setTimeout(() => elemento.style.display = "none", 300);
    } else {
        elemento.style.display = "block";
        elemento.style.opacity = "0";
        setTimeout(() => {
            elemento.style.opacity = "1";
            elemento.style.transition = "opacity 0.5s";
        }, 50);
    }
}

// curiosidades
const curiosidades = [
    "Londrina foi fundada por britânicos e o nome significa 'Pequena Londres'.",
    "A cidade é um dos maiores polos universitários do Paraná.",
    "O Lago Igapó é um dos cartões-postais mais visitados da cidade.",
    "Londrina é conhecida como a 'Capital do Café' no norte do Paraná.",
    "A ExpoLondrina é uma das maiores feiras agropecuárias da América Latina.",
    "A cidade foi planejada antes mesmo de ser fundada oficialmente em 1934.",
    "O Jardim Botânico de Londrina abriga mais de 80 espécies de plantas nativas.",
    "O pôr do sol no Lago Igapó é um dos mais fotografados do Paraná."
];

function gerarCuriosidade() {
    const curiosidadeEl = document.getElementById("curiosidade");
    if (!curiosidadeEl) return;

    const indice = Math.floor(Math.random() * curiosidades.length);
    const curiosidadeEscolhida = curiosidades[indice];

    curiosidadeEl.style.opacity = "0";
    setTimeout(() => {
        curiosidadeEl.textContent = curiosidadeEscolhida;
        curiosidadeEl.style.opacity = "1";
        curiosidadeEl.style.transition = "opacity 0.5s";
    }, 200);
}

// smooth anchor nav
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href && href.startsWith("#")) {
            e.preventDefault();
            const destino = document.querySelector(href);
            if (destino) {
                window.scrollTo({
                    top: destino.offsetTop - 60,
                    behavior: "smooth"
                });
            }
        }
    });
});

// reveal on scroll
const elementos = document.querySelectorAll('.card, .galeria, .curiosidades, footer');
function revelarAoRolar() {
    const alturaJanela = window.innerHeight;
    elementos.forEach(el => {
        const posicao = el.getBoundingClientRect().top;
        if (posicao < alturaJanela - 100) {
            el.classList.add('visivel');
        }
    });
}
window.addEventListener('scroll', revelarAoRolar);
window.addEventListener('load', revelarAoRolar);

// typing effect
window.addEventListener("load", () => {
    const elementoTitulo = document.getElementById("titulo-animado");
    const subtexto = document.getElementById("subtexto");

    if (elementoTitulo && subtexto) {
        const titulo = "Explore os Encantos de Londrina";
        let indice = 0;

        function digitar() {
            if (indice < titulo.length) {
                elementoTitulo.textContent += titulo.charAt(indice);
                indice++;
                setTimeout(digitar, 70); // Velocidade de digitação
            } else {
                // Terminou de digitar, mostra o subtexto
                setTimeout(() => {
                    subtexto.style.opacity = "1";
                }, 500); 
            }
        }
        digitar();
    }
});