"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type GoodieType = "recado" | "memoria" | "musica" | "cupom" | "segredo";

type Goodie = {
  id: string;
  type: GoodieType;
  title: string;
  content: string;
};

type Parcel = {
  to: string;
  from: string;
  intro: string;
  goodies: Goodie[];
};

const goodieMeta: Record<GoodieType, { icon: string; label: string; hint: string }> = {
  recado: { icon: "✎", label: "Recado", hint: "Escreva algo que merece ser guardado" },
  memoria: { icon: "▣", label: "Foto", hint: "Cole o link de uma foto ou álbum" },
  musica: { icon: "♫", label: "Música", hint: "Cole um link do Spotify, YouTube ou Deezer" },
  cupom: { icon: "✦", label: "Cupom", hint: "Ex.: vale um café, abraço ou passeio" },
  segredo: { icon: "☻", label: "Surpresa", hint: "Uma piada, lembrança ou pequeno segredo" },
};

const starterGoodies: Goodie[] = [
  { id: "hello", type: "recado", title: "Um recadinho", content: "Só passei para deixar seu dia um pouquinho mais bonito." },
  { id: "coupon", type: "cupom", title: "Vale um café", content: "Resgatável quando a saudade bater. Sem data de validade." },
];

function encodeParcel(parcel: Parcel) {
  const bytes = new TextEncoder().encode(JSON.stringify(parcel));
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeParcel(value: string): Parcel | null {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed?.to || !Array.isArray(parsed?.goodies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isLink(type: GoodieType, content: string) {
  return (type === "memoria" || type === "musica") && /^https?:\/\//i.test(content.trim());
}

function FoxMark() {
  return (
    <span className="fox-mark" aria-hidden="true">
      <span className="fox-ear fox-ear-left" />
      <span className="fox-ear fox-ear-right" />
      <span className="fox-face"><span className="fox-eye left" /><span className="fox-eye right" /><span className="fox-nose" /></span>
    </span>
  );
}

function Header({ onCreate }: { onCreate?: () => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onCreate} aria-label="Voltar para o início do MailFox">
        <FoxMark />
        <span>MailFox</span>
      </button>
      <span className="header-note">feito para enviar carinho, não spam</span>
    </header>
  );
}

function GoodieCard({ goodie, index, open, onToggle }: { goodie: Goodie; index: number; open: boolean; onToggle: () => void }) {
  const meta = goodieMeta[goodie.type] ?? goodieMeta.recado;
  return (
    <article className={`goodie-card type-${goodie.type} ${open ? "is-open" : ""}`} style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}>
      <button className="goodie-top" onClick={onToggle} aria-expanded={open}>
        <span className="goodie-icon">{meta.icon}</span>
        <span><small>{meta.label}</small><strong>{goodie.title}</strong></span>
        <span className="open-indicator">{open ? "−" : "+"}</span>
      </button>
      <div className="goodie-content">
        <p>{goodie.content}</p>
        {isLink(goodie.type, goodie.content) && (
          <a href={goodie.content} target="_blank" rel="noreferrer">abrir presente ↗</a>
        )}
      </div>
    </article>
  );
}

function ParcelView({ parcel, onCreate }: { parcel: Parcel; onCreate: () => void }) {
  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  return (
    <main className="viewer-page">
      <Header onCreate={onCreate} />
      <section className={`delivery-scene ${opened ? "parcel-opened" : ""}`}>
        <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
        {!opened ? (
          <div className="closed-parcel">
            <p className="eyebrow">entrega especial para</p>
            <h1>{parcel.to}</h1>
            <div className="package-wrap">
              <div className="package-string horizontal" />
              <div className="package-string vertical" />
              <div className="shipping-label">
                <span>DE</span><strong>{parcel.from || "alguém que gosta de você"}</strong>
              </div>
              <button className="wax-seal" onClick={() => setOpened(true)}>
                <FoxMark /><span>abrir</span>
              </button>
              <span className="postal-stamp">CORREIO<br />DO AFETO</span>
            </div>
            <button className="text-button" onClick={() => setOpened(true)}>toque no selo para abrir</button>
          </div>
        ) : (
          <div className="open-parcel">
            <div className="recipient-heading">
              <p className="eyebrow">o correio da raposa chegou</p>
              <h1>Oi, {parcel.to}!</h1>
              <p>{parcel.intro || "Esta pequena entrega viajou até você com muito carinho."}</p>
            </div>
            <div className="goodies-grid">
              {parcel.goodies.map((goodie, index) => (
                <GoodieCard key={goodie.id} goodie={goodie} index={index} open={active === goodie.id} onToggle={() => setActive(active === goodie.id ? null : goodie.id)} />
              ))}
            </div>
            <footer className="parcel-footer">
              <span>com carinho, {parcel.from || "uma pessoa querida"}</span>
              <button onClick={onCreate}>criar uma entrega também →</button>
            </footer>
          </div>
        )}
      </section>
    </main>
  );
}

export default function Home() {
  const [parcel, setParcel] = useState<Parcel>({ to: "", from: "", intro: "", goodies: starterGoodies });
  const [type, setType] = useState<GoodieType>("recado");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [viewParcel, setViewParcel] = useState<Parcel | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const readHash = () => {
      const match = window.location.hash.match(/^#entrega=(.+)$/);
      setViewParcel(match ? decodeParcel(match[1]) : null);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  const shareLink = useMemo(() => {
    if (typeof window === "undefined" || !parcel.to.trim()) return "";
    return `${window.location.origin}${window.location.pathname}#entrega=${encodeParcel(parcel)}`;
  }, [parcel]);

  function addGoodie(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setParcel((current) => ({ ...current, goodies: [...current.goodies, { id: crypto.randomUUID(), type, title: title.trim(), content: content.trim() }] }));
    setTitle("");
    setContent("");
  }

  async function copyLink() {
    if (!shareLink) { setNotice("Escreva para quem é a entrega primeiro."); return; }
    try {
      await navigator.clipboard.writeText(shareLink);
      setNotice("Link copiado! Agora é só enviar para seu amigo.");
    } catch {
      setNotice("Seu link está pronto — copie pelo campo abaixo.");
    }
  }

  if (viewParcel) return <ParcelView parcel={viewParcel} onCreate={() => { history.replaceState(null, "", window.location.pathname); setViewParcel(null); }} />;

  return (
    <main>
      <Header />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><i /> correio para dias comuns e especiais</span>
          <h1>Envie uma caixa cheia de <em>pequenas alegrias.</em></h1>
          <p>Junte recados, músicas, memórias e vales divertidos em uma entrega digital feita por você.</p>
          <div className="hero-promise"><span>✓ grátis</span><span>✓ sem cadastro</span><span>✓ feito no seu navegador</span></div>
        </div>
        <div className="hero-mail" aria-hidden="true">
          <div className="envelope back" /><div className="envelope front"><FoxMark /></div>
          <span className="doodle doodle-one">✦</span><span className="doodle doodle-two">♡</span>
        </div>
      </section>

      <section className="maker" id="criar">
        <div className="maker-heading">
          <p className="step-label">01 — endereçar</p>
          <h2>Prepare sua entrega</h2>
          <p>Ela fica somente no link que você compartilhar.</p>
        </div>
        <div className="maker-layout">
          <div className="form-column">
            <div className="paper-panel address-panel">
              <div className="field-row">
                <label>Para<input value={parcel.to} maxLength={36} onChange={(event) => setParcel({ ...parcel, to: event.target.value })} placeholder="nome ou apelido" /></label>
                <label>De<input value={parcel.from} maxLength={36} onChange={(event) => setParcel({ ...parcel, from: event.target.value })} placeholder="seu nome" /></label>
              </div>
              <label>Mensagem da abertura<textarea value={parcel.intro} maxLength={180} onChange={(event) => setParcel({ ...parcel, intro: event.target.value })} placeholder="Uma frase para receber seu amigo..." /></label>
            </div>

            <div className="section-title"><span>02</span><div><h3>Escolha uma surpresa</h3><p>Você pode misturar até 8 itens.</p></div></div>
            <div className="type-picker" role="group" aria-label="Tipo de surpresa">
              {(Object.keys(goodieMeta) as GoodieType[]).map((key) => (
                <button key={key} className={type === key ? "active" : ""} onClick={() => setType(key)}><span>{goodieMeta[key].icon}</span>{goodieMeta[key].label}</button>
              ))}
            </div>
            <form className="paper-panel goodie-form" onSubmit={addGoodie}>
              <label>Título<input value={title} maxLength={42} onChange={(event) => setTitle(event.target.value)} placeholder={type === "cupom" ? "Vale um passeio" : "Dê um nome à surpresa"} /></label>
              <label>{goodieMeta[type].hint}<textarea value={content} maxLength={500} onChange={(event) => setContent(event.target.value)} placeholder={type === "musica" || type === "memoria" ? "https://..." : "Escreva aqui..."} /></label>
              <button className="add-button" disabled={parcel.goodies.length >= 8}>+ colocar na caixa</button>
            </form>
          </div>

          <aside className="preview-column">
            <div className="preview-label"><span>prévia da caixa</span><small>{parcel.goodies.length}/8 surpresas</small></div>
            <div className="parcel-preview">
              <div className="preview-address"><span>PARA</span><strong>{parcel.to || "seu amigo"}</strong><small>de {parcel.from || "você"}</small></div>
              <div className="preview-goodies">
                {parcel.goodies.map((goodie) => (
                  <div className={`preview-item type-${goodie.type}`} key={goodie.id}>
                    <span>{goodieMeta[goodie.type].icon}</span><b>{goodie.title}</b>
                    <button onClick={() => setParcel({ ...parcel, goodies: parcel.goodies.filter((item) => item.id !== goodie.id) })} aria-label={`Remover ${goodie.title}`}>×</button>
                  </div>
                ))}
              </div>
              <div className="preview-seal"><FoxMark /></div>
            </div>
            <button className="share-button" onClick={copyLink}><span>selar e copiar o link</span><b>→</b></button>
            {notice && <p className="notice" role="status">{notice}</p>}
            {shareLink && <button className="preview-link" onClick={() => setViewParcel(parcel)}>ver como seu amigo vai receber</button>}
          </aside>
        </div>
      </section>

      <footer className="site-footer"><FoxMark /><p><strong>MailFox</strong> — pequenas surpresas, entregues com carinho.</p><span>Feito para brincar entre amigos.</span></footer>
    </main>
  );
}
