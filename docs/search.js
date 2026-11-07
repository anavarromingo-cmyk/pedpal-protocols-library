/* Protocolos PEDPAL — motor de búsqueda local (BM25 + sinónimos clínicos).
 * Todo en el navegador: sin servidor, sin red. Expone window.PPSearch.
 */
(function () {
  "use strict";

  const STOP = new Set(("a al algo algunas algunos ante antes como con contra cual cuales cuando de del desde donde dos durante e el ella ellas ellos en entre era eran es esa esas ese eso esos esta estaba estaban estamos estan estar este esto estos fue fueron ha habia han hasta hay la las le les lo los mas me mi mis mucho muy nada ni no nos nosotros o os otra otras otro otros para pero poco por porque que quien quienes se sea sean segun ser si sin sobre son su sus tambien tanto te tiene tienen todo todos tras tu tus un una unas uno unos vosotros y ya yo cada ser estar puede pueden debe deben deberia tipo tipos caso casos forma formas ademas asi bien aunque mediante dicho dicha dichos dichas cuyo cuya este esta").split(/\s+/));

  function fold(s) {
    return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  // stemmer ligero para castellano clínico: plurales, adverbios, algunas terminaciones frecuentes
  function stem(w) {
    if (w.length <= 3) return w;
    if (/^\d/.test(w)) return w;
    w = w.replace(/mente$/, "");
    if (w.endsWith("ciones")) return w.slice(0, -5) + "cion";
    if (w.endsWith("siones")) return w.slice(0, -5) + "sion";
    if (w.endsWith("es") && w.length > 5 && !/[aeiou]es$/.test(w)) w = w.slice(0, -2);
    else if (w.endsWith("s") && w.length > 4 && !w.endsWith("is")) w = w.slice(0, -1);
    if (w.length > 6 && /(ada|ado|ido|ida)$/.test(w)) w = w.slice(0, -3);
    if (w.length > 6 && /(icos?|icas?)$/.test(w)) w = w.replace(/(icos?|icas?)$/, "ic");
    if (w.length > 5 && /[ao]$/.test(w) && !/(ia|io|ea|eo)$/.test(w)) w = w.slice(0, -1);
    return w;
  }
  function tokens(text) {
    const out = [];
    const re = /[a-z0-9µ]+(?:[.,][0-9]+)?/g;
    const f = fold(text).replace(/µ/g, "mc");
    let m;
    while ((m = re.exec(f))) {
      const w = m[0];
      if (STOP.has(w) || w.length < 2) continue;
      out.push(stem(w));
    }
    return out;
  }

  class Index {
    constructor(data, synonyms) {
      this.docs = data.docs;          // [{slug,t,a}]
      this.chunks = data.chunks;      // [[docIdx, secIdx, page, text]]
      this.N = this.chunks.length;
      this.df = new Map();
      this.postings = new Map();      // term -> [[chunkIdx, tf], ...]
      this.len = new Float32Array(this.N);
      this.titleTerms = this.docs.map((d) => new Set(tokens(d.t)));
      let total = 0;
      for (let i = 0; i < this.N; i++) {
        const c = this.chunks[i];
        const tks = tokens(c[3]);
        // el título del protocolo pondera cada pasaje (x2)
        const tt = tokens(this.docs[c[0]].t);
        const all = tks.concat(tt, tt);
        this.len[i] = all.length; total += all.length;
        const tf = new Map();
        for (const t of all) tf.set(t, (tf.get(t) || 0) + 1);
        for (const [t, n] of tf) {
          if (!this.postings.has(t)) this.postings.set(t, []);
          this.postings.get(t).push([i, n]);
          this.df.set(t, (this.df.get(t) || 0) + 1);
        }
      }
      this.avg = total / Math.max(1, this.N);
      // sinónimos: término base → grupo
      this.syn = new Map();
      this.synPhrases = [];
      for (const g of (synonyms && synonyms.grupos) || []) {
        const stems = g.map((x) => tokens(x).join(" ")).filter(Boolean);
        for (const s of stems) {
          if (!this.syn.has(s)) this.syn.set(s, new Set());
          for (const o of stems) if (o !== s) this.syn.get(s).add(o);
          if (s.includes(" ")) this.synPhrases.push(s);
        }
      }
    }

    expand(query) {
      const q = tokens(query);
      const joined = q.join(" ");
      const weights = new Map();
      const add = (t, w) => { if (!weights.has(t) || weights.get(t) < w) weights.set(t, w); };
      for (const t of q) add(t, 1);
      // frases sinónimas presentes en la consulta
      for (const ph of this.synPhrases) {
        if (joined.includes(ph)) for (const o of this.syn.get(ph)) for (const t of o.split(" ")) add(t, 0.7);
      }
      for (const t of q) {
        const g = this.syn.get(t);
        if (g) for (const o of g) for (const t2 of o.split(" ")) add(t2, 0.6);
      }
      return { q, weights };
    }

    search(query, opts = {}) {
      const k1 = 1.2, b = 0.75;
      const { q, weights } = this.expand(query);
      if (!q.length) return { hits: [], terms: [] };
      const scores = new Float32Array(this.N);
      const matched = new Map(); // chunk -> Set(terms originales)
      for (const [t, w] of weights) {
        const post = this.postings.get(t);
        if (!post) continue;
        const idf = Math.log(1 + (this.N - post.length + 0.5) / (post.length + 0.5));
        for (const [ci, tf] of post) {
          const s = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * this.len[ci] / this.avg));
          scores[ci] += w * s;
          if (q.includes(t)) { if (!matched.has(ci)) matched.set(ci, new Set()); matched.get(ci).add(t); }
        }
      }
      const fq = fold(query).trim();
      const cand = [];
      for (let i = 0; i < this.N; i++) {
        if (scores[i] <= 0) continue;
        let s = scores[i];
        const cover = (matched.get(i) || new Set()).size / q.length;
        s *= 0.6 + 0.8 * cover;                       // cobertura de términos originales
        if (fq.length > 6 && fold(this.chunks[i][3]).includes(fq)) s *= 1.5; // frase exacta
        if (opts.area && this.docs[this.chunks[i][0]].a !== opts.area) continue;
        cand.push([i, s]);
      }
      cand.sort((a, b2) => b2[1] - a[1]);
      const limit = opts.limit || 40;
      const hits = cand.slice(0, limit).map(([i, s]) => {
        const c = this.chunks[i];
        return { chunk: i, doc: c[0], slug: this.docs[c[0]].slug, titulo: this.docs[c[0]].t, area: this.docs[c[0]].a,
                 sec: c[1], page: c[2], text: c[3], score: s, cover: (matched.get(i) || new Set()).size / q.length };
      });
      return { hits, terms: q, weights };
    }

    /* agrupa por protocolo, máx. n pasajes por protocolo, ordena por mejor pasaje */
    group(hits, perDoc = 3) {
      const by = new Map();
      for (const h of hits) {
        if (!by.has(h.slug)) by.set(h.slug, { slug: h.slug, titulo: h.titulo, area: h.area, best: h.score, passages: [] });
        const g = by.get(h.slug);
        if (g.passages.length < perDoc) g.passages.push(h);
      }
      return [...by.values()].sort((a, b2) => b2.best - a.best);
    }

    /* frases más informativas (para "lo que dicen los protocolos") */
    bestSentences(hits, terms, n = 3) {
      const out = [];
      const seenDoc = new Set();
      for (const h of hits) {
        if (seenDoc.has(h.slug)) continue;
        const sents = h.text.split(/(?<=[\.\!\?;])\s+(?=[A-ZÁÉÍÓÚÑ¿¡•\d])/);
        let best = null, bs = 0;
        for (const s of sents) {
          if (s.length < 40 || s.length > 420) continue;
          const st = new Set(tokens(s));
          let c = 0; for (const t of terms) if (st.has(t)) c++;
          const sc = c / terms.length + (/\d/.test(s) ? 0.1 : 0);
          if (sc > bs) { bs = sc; best = s; }
        }
        if (best && bs >= 0.5) { out.push({ text: best.trim(), hit: h }); seenDoc.add(h.slug); }
        if (out.length >= n) break;
      }
      return out;
    }
  }

  /* Resalta términos (por raíz) y dosis dentro de un texto plano → HTML seguro */
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  const DOSE_RE = /(\d+(?:[.,]\d+)?(?:\s?[-–]\s?\d+(?:[.,]\d+)?)?\s?(?:mg|mcg|µg|ug|g|ml|mL|UI|U|mEq|mmol|%)(?:\s?\/\s?(?:kg|dosis|día|dia|h|hora|min|toma|m2|m²))*(?:\s?\/\s?(?:kg|dosis|día|dia|h|hora|min))*)/g;
  function highlight(text, terms, markDoses = true) {
    const stems = new Set(terms || []);
    let html = "";
    const re = /([a-zA-Z0-9µÁÉÍÓÚÑáéíóúñüÜ]+(?:[.,][0-9]+)?)|([^a-zA-Z0-9µÁÉÍÓÚÑáéíóúñüÜ]+)/g;
    let m;
    while ((m = re.exec(text))) {
      if (m[1]) {
        const st = stem(fold(m[1]).replace(/µ/g, "mc"));
        html += stems.size && stems.has(st) && !STOP.has(fold(m[1])) ? "<mark>" + esc(m[1]) + "</mark>" : esc(m[1]);
      } else html += esc(m[2]);
    }
    if (markDoses) html = html.replace(DOSE_RE, '<mark class="dose">$1</mark>');
    return html;
  }

  window.PPSearch = { Index, tokens, fold, stem, highlight, esc, DOSE_RE };
})();
