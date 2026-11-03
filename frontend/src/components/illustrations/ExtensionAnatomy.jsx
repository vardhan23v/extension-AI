import React, { createContext, useContext, useState } from 'react';

// Which part is hovered/focused, so its callout can highlight.
const ActiveCtx = createContext({ active: null, setActive: () => {} });

// Exploded technical drawing of a Manifest V3 extension: the parts Extensio
// generates and how they talk to each other. Oblique projection, hairline
// callouts. Parts settle into place once on load (static with reduced motion).

const DX = 34; // depth offset x
const DY = -20; // depth offset y

// A slab: front face + top face + right face.
const Slab = ({ x, y, w, h, tone = 'surface', delay = 0, label, mono, part, name }) => {
  const { active, setActive } = useContext(ActiveCtx);
  const on = active === part;
  const fill = tone === 'accent' ? 'rgb(var(--primary))' : tone === 'ink' ? 'rgb(var(--fg))' : 'rgb(var(--surface))';
  const side = tone === 'accent' ? 'rgb(var(--primary) / 0.75)' : tone === 'ink' ? 'rgb(var(--fg) / 0.8)' : 'rgb(var(--surface-2))';
  const text = tone === 'surface' ? 'rgb(var(--fg))' : 'rgb(var(--bg))';
  return (
    <g className="anatomy-part" style={{ animationDelay: `${delay}ms` }}>
      <g
        tabIndex={0}
        role="img"
        aria-label={name}
        className="anatomy-hit cursor-default outline-none"
        style={{ transform: on ? 'translateY(-6px)' : 'none' }}
        onMouseEnter={() => setActive(part)}
        onMouseLeave={() => setActive(null)}
        onFocus={() => setActive(part)}
        onBlur={() => setActive(null)}
      >
      <path d={`M${x} ${y} l${DX} ${DY} h${w} l${-DX} ${-DY} z`} fill={side} stroke="rgb(var(--fg))" strokeWidth="1" strokeLinejoin="round" />
      <path d={`M${x + w} ${y} l${DX} ${DY} v${h} l${-DX} ${-DY} z`} fill={side} stroke="rgb(var(--fg))" strokeWidth="1" strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke="rgb(var(--fg))" strokeWidth="1" />
      {label && (
        <text x={x + 12} y={y + h / 2 + 4} fill={text} fontSize="13.5" fontFamily={mono ? 'JetBrains Mono Variable, monospace' : 'Geist Variable, sans-serif'} fontWeight="500">
          {label}
        </text>
      )}
      {on && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5" strokeDasharray="4 3" />}
      </g>
    </g>
  );
};

const Callout = ({ from, to, title, body, align = 'start', delay = 0, part }) => {
  const { active } = useContext(ActiveCtx);
  const on = active === part;
  const [x1, y1] = from;
  const [x2, y2] = to;
  const tx = align === 'end' ? x2 - 6 : x2 + 6;
  return (
    <g className="anatomy-callout" style={{ animationDelay: `${delay}ms` }}>
      <circle cx={x1} cy={y1} r={on ? 3.5 : 2.5} fill={on ? 'rgb(var(--primary))' : 'rgb(var(--fg))'} />
      <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={on ? 'rgb(var(--primary))' : 'rgb(var(--fg) / 0.55)'} strokeWidth={on ? 1.5 : 1} fill="none" />
      <text x={tx} y={y2 - 4} textAnchor={align} fontSize="15" fontWeight="600" fill={on ? 'rgb(var(--primary))' : 'rgb(var(--fg))'} fontFamily="Geist Variable, sans-serif">
        {title}
      </text>
      <text x={tx} y={y2 + 15} textAnchor={align} fontSize="13.5" fill="rgb(var(--muted))" fontFamily="Geist Variable, sans-serif">
        {body}
      </text>
    </g>
  );
};

const ExtensionAnatomy = ({ className }) => {
  const [active, setActive] = useState(null);
  return (
  <ActiveCtx.Provider value={{ active, setActive }}>
  <figure className={className}>
    <svg
      viewBox="-136 84 730 384"
      role="img"
      aria-labelledby="anatomy-title anatomy-desc"
      className="h-auto w-full overflow-visible"
    >
      <title id="anatomy-title">Parts of a Manifest V3 Chrome extension</title>
      <desc id="anatomy-desc">
        An exploded drawing. manifest.json is the base and declares everything else. On top of it sit the background service
        worker, which reacts to browser events; a content script, which runs inside web pages; the toolbar popup, which is the
        interface people click; and the icons. The popup, service worker and content script exchange messages with
        chrome.runtime.sendMessage.
      </desc>

      <style>{`
        .anatomy-part, .anatomy-callout { animation: anatomy-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anatomy-hit { transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1); }
        .anatomy-callout { animation-name: anatomy-fade; }
        @keyframes anatomy-in { from { opacity: 0; transform: translateY(-18px); } }
        @keyframes anatomy-fade { from { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .anatomy-part, .anatomy-callout { animation: none; } }
      `}</style>

      {/* Vertical assembly guides */}
      <g stroke="rgb(var(--fg) / 0.25)" strokeDasharray="3 4" strokeWidth="1">
        <path d="M150 112 V392" />
        <path d="M318 112 V392" />
      </g>

      {/* Base: manifest */}
      <Slab x={110} y={380} w={260} h={40} tone="ink" label="manifest.json" mono delay={0} part="manifest" name="manifest.json: declares permissions and entry points" />
      {/* Service worker + content script */}
      <Slab x={110} y={300} w={126} h={36} label="background.js" mono delay={120} part="worker" name="background.js: service worker that reacts to browser events" />
      <Slab x={246} y={300} w={124} h={36} label="content.js" mono delay={200} part="content" name="content.js: content script that runs inside web pages" />
      {/* Popup */}
      <Slab x={110} y={206} w={260} h={46} tone="accent" label="popup.html · popup.js" mono delay={300} part="popup" name="popup: the toolbar interface" />
      {/* Icons */}
      <g className="anatomy-part" style={{ animationDelay: '420ms' }}>
        {[[150, 112, 22], [190, 106, 30], [238, 98, 40]].map(([x, y, s]) => (
          <g key={x}>
            <rect x={x} y={y + (40 - s)} width={s} height={s} rx="5" fill="rgb(var(--fg))" />
            <circle cx={x + s * 0.72} cy={y + (40 - s) + s * 0.72} r={s * 0.12} fill="rgb(var(--primary))" />
          </g>
        ))}
        <text x={292} y={146} fontSize="12.5" fill="rgb(var(--muted))" fontFamily="JetBrains Mono Variable, monospace">
          16 · 48 · 128 px
        </text>
      </g>

      {/* Message paths */}
      <g className="anatomy-callout" style={{ animationDelay: '600ms' }} fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5">
        <path d="M170 252 C150 270, 150 285, 170 300" markerEnd="url(#arrow)" />
        <path d="M236 314 H246" markerEnd="url(#arrow)" />
        <path d="M246 324 H236" markerEnd="url(#arrow)" />
      </g>
      <defs>
        <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 z" fill="rgb(var(--primary))" />
        </marker>
      </defs>

      {/* Callouts */}
      <Callout from={[370, 400]} to={[416, 446]} part="manifest" title="manifest.json" body="Permissions and entry points" delay={700} />
      <Callout from={[110, 318]} to={[84, 340]} align="end" part="worker" title="Service worker" body="Reacts to browser events" delay={760} />
      <Callout from={[404, 300]} to={[416, 274]} part="content" title="Content script" body="Runs inside web pages" delay={820} />
      <Callout from={[404, 206]} to={[416, 180]} part="popup" title="Popup" body="The toolbar interface" delay={880} />
      <Callout from={[152, 278]} to={[84, 262]} align="end" title="sendMessage" body="Parts talk through messages" delay={940} />
    </svg>
    <figcaption className="mt-2 text-center text-[12px] text-subtle">Hover or tab through the parts.</figcaption>
  </figure>
  </ActiveCtx.Provider>
  );
};

export default ExtensionAnatomy;
