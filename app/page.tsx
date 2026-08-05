"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type GoodieType = "recado" | "memoria" | "musica" | "cupom" | "segredo";
type StickerType = "coracao" | "estrela" | "flor" | "sorriso" | "data";

type Goodie = {
  id: string;
  type: GoodieType;
  title: string;
  content: string;
  sticker?: StickerType;
};

type Parcel = {
  to: string;
  from: string;
  intro: string;
  goodies: Goodie[];
};

const goodieMeta: Record<GoodieType, { icon: string; label: string; hint: string }> = {
  recado: { icon: "✎", label: "Recado", hint: "Uma frase curta, palavra especial ou data" },
  memoria: { icon: "▣", label: "Foto", hint: "Cole o link de uma foto ou álbum" },
  musica: { icon: "♫", label: "Música", hint: "Cole um link do Spotify, YouTube ou Deezer" },
  cupom: { icon: "✦", label: "Cupom", hint: "Ex.: vale um café, abraço ou passeio" },
  segredo: { icon: "☻", label: "Surpresa", hint: "Uma piada, lembrança ou pequeno segredo" },
};

const stickerMeta: Record<StickerType, { glyph: string; label: string }> = {
  coracao: { glyph: "♥", label: "Coração" },
  estrela: { glyph: "✦", label: "Estrela" },
  flor: { glyph: "✿", label: "Flor" },
  sorriso: { glyph: "☺", label: "Sorriso" },
  data: { glyph: "17", label: "Data" },
};

const starterGoodies: Goodie[] = [
  {
    id: "hello",
    type: "recado",
    title: "Um recadinho",
    content: "Só passei para deixar seu dia um pouquinho mais bonito.",
    sticker: "coracao",
  },
  {
    id: "coupon",
    type: "cupom",
    title: "Vale um café",
    content: "Resgatável quando a saudade bater. Sem data de validade.",
  },
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
      <span className="fox-face">
        <span className="fox-eye left" />
        <span className="fox-eye right" />
        <span className="fox-nose" />
      </span>
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

function GoodieObject({ goodie }: { goodie: Goodie }) {
  const sticker = stickerMeta[goodie.sticker ?? "coracao"];

  if (goodie.type === "recado") {
    return (
      <span className="object-note">
        <i className={`object-sticker sticker-${goodie.sticker ?? "coracao"}`}>{sticker.glyph}</i>
        <b>{goodie.title}</b>
        <small>{goodie.content}</small>
      </span>
    );
  }

  if (goodie.type === "musica") {
    return (
      <span className="object-tape">
        <i /><i />
        <b>{goodie.title}</b>
        <small>mixtape</small>
      </span>
    );
  }

  if (goodie.type === "memoria") {
    return (
      <span className="object-photo">
        <i aria-hidden="true" />
        <b>{goodie.title}</b>
      </span>
    );
  }

  if (goodie.type === "cupom") {
    return (
      <span className="object-ticket">
        <small>VALE</small>
        <b>{goodie.title}</b>
        <i aria-hidden="true">✦</i>
      </span>
    );
  }

  return (
    <span className="object-surprise">
      <i aria-hidden="true">?</i>
      <b>{goodie.title}</b>
    </span>
  );
}

function ParcelView({ parcel, onCreate }: { parcel: Parcel; onCreate: () => void }) {
  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const activeGoodie = parcel.goodies.find((goodie) => goodie.id === active) ?? null;

  function openParcel() {
    setOpened(true);
    setActive(null);
  }

  return (
    <main className="viewer-page">
      <Header onCreate={onCreate} />
      <section className={`delivery-scene box-delivery ${opened ? "parcel-opened" : ""}`}>
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
        </div>

        <div className="recipient-heading box-heading">
          <p className="eyebrow">{opened ? "o correio da raposa chegou" : "entrega especial para"}</p>
          <h1>{opened ? `Oi, ${parcel.to}!` : parcel.to}</h1>
          <p>
            {opened
              ? parcel.intro || "Esta pequena entrega viajou até você com muito carinho."
              : `Uma caixa de ${parcel.from || "alguém que gosta de você"} está esperando.`}
          </p>
        </div>

        <div className="gift-stage">
          <div className="gift-floor" aria-hidden="true" />
          <div className="gift-box">
            <div className="gift-interior" aria-hidden={!opened}>
              <div className="gift-rim" />
              <div className="gift-well">
                {parcel.goodies.map((goodie, index) => (
                  <button
                    key={goodie.id}
                    className={`box-goodie box-goodie-${goodie.type} ${active === goodie.id ? "is-active" : ""}`}
                    style={{
                      "--slot": index,
                      "--delay": `${360 + index * 75}ms`,
                      "--tilt": `${[-5, 4, -2, 6, -4, 2, -6, 5][index % 8]}deg`,
                    } as CSSProperties}
                    onClick={() => setActive(active === goodie.id ? null : goodie.id)}
                    aria-label={`Abrir ${goodieMeta[goodie.type].label}: ${goodie.title}`}
                    aria-pressed={active === goodie.id}
                    tabIndex={opened ? 0 : -1}
                  >
                    <GoodieObject goodie={goodie} />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="gift-lid"
              onClick={openParcel}
              disabled={opened}
              aria-label={`Abrir a caixa de ${parcel.to}`}
            >
              <span className="lid-ribbon horizontal" />
              <span className="lid-ribbon vertical" />
              <span className="lid-label"><small>PARA</small><b>{parcel.to}</b></span>
              <span className="box-wax-seal" aria-hidden="true">
                <FoxMark />
                <span>abrir</span>
              </span>
            </button>
          </div>
        </div>

        <p className="box-instruction">
          {opened ? "passe o cursor ou toque em cada surpresa" : "toque no selo para levantar a tampa"}
        </p>

        <div className={`unwrapped-area ${activeGoodie ? "has-goodie" : ""}`}>
          {activeGoodie ? (
            <article className={`unwrapped-goodie type-${activeGoodie.type}`} aria-live="polite">
              <button className="close-goodie" onClick={() => setActive(null)} aria-label="Fechar surpresa">×</button>
              {activeGoodie.type === "recado" && (
                <span className={`detail-sticker sticker-${activeGoodie.sticker ?? "coracao"}`}>
                  {stickerMeta[activeGoodie.sticker ?? "coracao"].glyph}
                </span>
              )}
              <small>{goodieMeta[activeGoodie.type].label}</small>
              <h2>{activeGoodie.title}</h2>
              <p>{activeGoodie.content}</p>
              {isLink(activeGoodie.type, activeGoodie.content) && (
                <a href={activeGoodie.content} target="_blank" rel="noreferrer">abrir presente ↗</a>
              )}
            </article>
          ) : opened ? (
            <p className="empty-goodie-hint">Cada objeto guarda uma pequena surpresa.</p>
          ) : null}
        </div>

        {opened && (
          <footer className="parcel-footer box-footer">
            <span>com carinho, {parcel.from || "uma pessoa querida"}</span>
            <button onClick={onCreate}>criar uma entrega também →</button>
          </footer>
        )}
      </section>
    </main>
  );
}

export default function Home() {
  const [parcel, setParcel] = useState<Parcel>({ to: "", from: "", intro: "", goodies: starterGoodies });
  const [type, setType] = useState<GoodieType>("recado");
  const [sticker, setSticker] = useState<StickerType>("coracao");
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
    if (!title.trim() || !content.trim() || parcel.goodies.length >= 8) return;
    setParcel((current) => ({
      ...current,
      goodies: [
        ...current.goodies,
        {
          id: crypto.randomUUID(),
          type,
          title: title.trim(),
          content: content.trim(),
          sticker: type === "recado" ? sticker : undefined,
        },
      ],
    }));
    setTitle("");
    setContent("");
  }

  async function copyLink() {
    if (!shareLink) {
      setNotice("Escreva para quem é a entrega primeiro.");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      setNotice("Link copiado! Agora é só enviar para seu amigo.");
    } catch {
      setNotice("Seu link está pronto — copie pelo campo abaixo.");
    }
  }

  if (viewParcel) {
    return (
      <ParcelView
        parcel={viewParcel}
        onCreate={() => {
          history.replaceState(null, "", window.location.pathname);
          setViewParcel(null);
        }}
      />
    );
  }

  return (
    <main>
      <Header />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><i /> correio para dias comuns e especiais</span>
          <h1>Envie uma caixa cheia de <em>pequenas alegrias.</em></h1>
          <p>Junte recados, músicas, memórias e vales divertidos em uma entrega digital feita por você.</p>
          <div className="hero-promise">
            <span>✓ grátis</span><span>✓ sem cadastro</span><span>✓ feito no seu navegador</span>
          </div>
        </div>
        <div className="hero-mail" aria-hidden="true">
          <div className="envelope back" />
          <div className="envelope front"><FoxMark /></div>
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

            <div className="section-title">
              <span>02</span>
              <div><h3>Escolha uma surpresa</h3><p>Você pode misturar até 8 itens.</p></div>
            </div>

            <div className="type-picker" role="group" aria-label="Tipo de surpresa">
              {(Object.keys(goodieMeta) as GoodieType[]).map((key) => (
                <button key={key} className={type === key ? "active" : ""} onClick={() => setType(key)}>
                  <span>{goodieMeta[key].icon}</span>{goodieMeta[key].label}
                </button>
              ))}
            </div>

            <form className="paper-panel goodie-form" onSubmit={addGoodie}>
              <label>
                Título
                <input value={title} maxLength={42} onChange={(event) => setTitle(event.target.value)} placeholder={type === "cupom" ? "Vale um passeio" : "Dê um nome à surpresa"} />
              </label>
              <label>
                {goodieMeta[type].hint}
                <textarea
                  value={content}
                  maxLength={type === "recado" ? 140 : 500}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={type === "musica" || type === "memoria" ? "https://..." : type === "recado" ? "Ex.: 12 de junho, nossa data ♥" : "Escreva aqui..."}
                />
              </label>

              {type === "recado" && (
                <div className="sticker-editor">
                  <div><b>Escolha um adesivo</b><small>Ele ficará colado no seu bilhetinho.</small></div>
                  <div className="sticker-picker" role="group" aria-label="Adesivo do bilhete">
                    {(Object.keys(stickerMeta) as StickerType[]).map((key) => (
                      <button
                        type="button"
                        key={key}
                        className={sticker === key ? "active" : ""}
                        onClick={() => setSticker(key)}
                        aria-label={stickerMeta[key].label}
                        aria-pressed={sticker === key}
                      >
                        {stickerMeta[key].glyph}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="add-button" disabled={parcel.goodies.length >= 8}>+ colocar na caixa</button>
            </form>
          </div>

          <aside className="preview-column">
            <div className="preview-label"><span>prévia da caixa</span><small>{parcel.goodies.length}/8 surpresas</small></div>
            <div className="parcel-preview box-preview">
              <div className="preview-address"><span>PARA</span><strong>{parcel.to || "seu amigo"}</strong><small>de {parcel.from || "você"}</small></div>
              <div className="preview-goodies">
                {parcel.goodies.map((goodie) => (
                  <div className={`preview-item type-${goodie.type}`} key={goodie.id}>
                    <span>{goodie.type === "recado" ? stickerMeta[goodie.sticker ?? "coracao"].glyph : goodieMeta[goodie.type].icon}</span>
                    <b>{goodie.title}</b>
                    <button onClick={() => setParcel({ ...parcel, goodies: parcel.goodies.filter((item) => item.id !== goodie.id) })} aria-label={`Remover ${goodie.title}`}>×</button>
                  </div>
                ))}
              </div>
              <div className="preview-seal"><FoxMark /></div>
            </div>
            <button className="share-button" onClick={copyLink}><span>selar e copiar o link</span><b>→</b></button>
            {notice && <p className="notice" role="status">{notice}</p>}
            {shareLink && <button className="preview-link" onClick={() => setViewParcel(parcel)}>ver a abertura animada</button>}
          </aside>
        </div>
      </section>

      <footer className="site-footer">
        <FoxMark />
        <p><strong>MailFox</strong> — pequenas surpresas, entregues com carinho.</p>
        <span>Feito para brincar entre amigos.</span>
      </footer>
    </main>
  );
}
