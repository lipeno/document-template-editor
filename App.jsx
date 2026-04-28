
const BQ = {
  blue:   '#136DEB', blue5:  '#EDF5FF', blue30: '#BBDBFA',
  grey10: '#EDF1F5', grey20: '#E0E4E8', grey30: '#D6D9DB',
  grey40: '#A4A7A8', grey50: '#546972', grey60: '#415158',
  black:  '#131314', white:  '#FFFFFF', bg:     '#EDF1F5',
  red:    '#E51C2C',
};

// ─────────────────────────────────────────────────────────────
// EXPLORATION N — Document Template Editor
// Builds on M:
//   · Toolbar moved to bottom-right of preview area
//   · All line items features work (toggle + reorder → preview)
//   · Settings panel: tabbed Customize templates / Custom CSS
//     with date format, page size, doc numbering, due dates
// ─────────────────────────────────────────────────────────────

const VAR_CATEGORIES = [
  {
    id:'company', label:'Company', icon:'building',
    vars:[
      {label:'Address',    tag:'{{company_address}}'},
      {label:'Email',      tag:'{{company_email}}'},
      {label:'Phone',      tag:'{{company_phone}}'},
      {label:'VAT number', tag:'{{company_vat_number}}'},
    ]
  },
  {
    id:'customer', label:'Customer', icon:'user',
    vars:[
      {label:'Email',   tag:'{{customer_email}}'},
      {label:'Phone',   tag:'{{customer_phone}}'},
      {label:'Address', tag:'{{customer_address}}'},
    ]
  },
  {
    id:'dates', label:'Booking dates', icon:'calendar',
    vars:[
      {label:'Start date', tag:'{{start_date}}'},
      {label:'End date',   tag:'{{end_date}}'},
      {label:'Issue date', tag:'{{date}}'},
      {label:'Due date',   tag:'{{due_date}}'},
    ]
  },
  {
    id:'financial', label:'Financial', icon:'coins',
    vars:[
      {label:'Subtotal',    tag:'{{subtotal}}'},
      {label:'Tax total',   tag:'{{tax_total}}'},
      {label:'Deposit',     tag:'{{deposit}}'},
      {label:'Discount',    tag:'{{discount}}'},
      {label:'Balance due', tag:'{{balance_due}}'},
    ]
  },
  {
    id:'document', label:'Document', icon:'hashtag',
    vars:[
      {label:'Document number', tag:'{{document_number}}'},
    ]
  },
];

const VAR_TAG_MAP = Object.fromEntries(
  VAR_CATEGORIES.flatMap(c => c.vars).map(({tag,label}) => [tag, label])
);
const CHIP_STYLE = 'display:inline-block;background:#EDF5FF;color:#136DEB;border:1px solid #BBDBFA;border-radius:10px;padding:0 6px;font-size:0.85em;font-weight:500;white-space:nowrap;line-height:1.6;vertical-align:baseline;';
const renderWithChips = html => html.replace(/\{\{([^}]+)\}\}/g, (match) => {
  const label = VAR_TAG_MAP[match] || match;
  return `<span style="${CHIP_STYLE}">${label}</span>`;
});

const RichTextPanel = ({id, getBlock, updateBlock}) => {
  const C = BQ;
  const editorRef = React.useRef(null);
  const b = getBlock(id);
  const [fmts, setFmts] = React.useState({});
  const [catMenu, setCatMenu] = React.useState(null); // {id, x, y}
  const [isEmpty, setIsEmpty] = React.useState(!b.html);

  React.useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'div');
  }, []);

  React.useEffect(() => {
    if (!catMenu) return;
    const close = () => setCatMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [catMenu]);

  // Populate editor when switching sections
  React.useEffect(() => {
    setCatMenu(null);
    setIsEmpty(!b.html);
    if (!editorRef.current) return;
    editorRef.current.innerHTML = b.html || '<div><br></div>';
    // Wrap any bare text nodes in <div> so formatBlock can target them per-line
    Array.from(editorRef.current.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const div = document.createElement('div');
        editorRef.current.insertBefore(div, node);
        div.appendChild(node);
      }
    });
    editorRef.current.focus();
  }, [id]);

  const save = () => {
    const html = editorRef.current?.innerHTML || '';
    updateBlock(id, {html});
    setIsEmpty((editorRef.current?.innerText?.trim() || '') === '');
  };

  const checkFmts = () => {
    try {
      const raw = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
      const blockStyle = ['h1','h2','h3'].includes(raw) ? raw : 'div';
      setFmts({
        blockStyle,
        bold:                 document.queryCommandState('bold'),
        italic:               document.queryCommandState('italic'),
        underline:            document.queryCommandState('underline'),
        strikeThrough:        document.queryCommandState('strikeThrough'),
        insertUnorderedList:  document.queryCommandState('insertUnorderedList'),
        insertOrderedList:    document.queryCommandState('insertOrderedList'),
        justifyLeft:          document.queryCommandState('justifyLeft'),
        justifyCenter:        document.queryCommandState('justifyCenter'),
        justifyRight:         document.queryCommandState('justifyRight'),
      });
    } catch(e) {}
  };


  const exec = (cmd, val) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val || null);
    save();
    checkFmts();
  };

  const Btn = ({icon, cmd, val, sz=11}) => {
    const on = !!fmts[cmd];
    return (
      <button onMouseDown={e=>{e.preventDefault();exec(cmd,val);}}
        style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',
          border:`1px solid ${on?C.blue:C.grey30}`,borderRadius:5,cursor:'pointer',
          background:on?C.blue5:'transparent',flexShrink:0,transition:'all 120ms'}}>
        <i className={`fa-regular fa-${icon}`} style={{fontSize:sz,color:on?C.blue:C.grey60,lineHeight:1}}/>
      </button>
    );
  };

  const VarBtn = ({cat}) => {
    const btnRef = React.useRef(null);
    const isOpen = catMenu?.id === cat.id;
    return (
      <div style={{position:'relative'}}>
        <button ref={btnRef} title={cat.label}
          onMouseDown={e=>{
            e.preventDefault(); e.stopPropagation();
            if (isOpen) { setCatMenu(null); return; }
            const r = btnRef.current.getBoundingClientRect();
            setCatMenu({id:cat.id, x:r.left, y:r.bottom+4});
          }}
          style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',
            border:`1px solid ${isOpen?C.blue:C.grey30}`,borderRadius:5,cursor:'pointer',
            background:isOpen?C.blue5:'transparent',flexShrink:0,transition:'all 120ms'}}>
          <i className={`fa-regular fa-${cat.icon}`} style={{fontSize:11,color:isOpen?C.blue:C.grey60,lineHeight:1}}/>
        </button>
        {isOpen && ReactDOM.createPortal(
          <div onMouseDown={e=>e.stopPropagation()}
            style={{position:'fixed',top:catMenu.y,left:catMenu.x,zIndex:9999,
              background:C.white,border:`1px solid ${C.grey20}`,borderRadius:6,
              boxShadow:'0 4px 16px rgba(0,0,0,0.12)',minWidth:200,padding:'4px 0'}}>
            <div style={{padding:'4px 10px 3px',borderBottom:`1px solid ${C.grey10}`,marginBottom:2}}>
              <span style={{fontSize:10,color:C.grey40,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>{cat.label}</span>
            </div>
            {cat.vars.map(({label,tag})=>(
              <button key={tag}
                onMouseDown={e=>{e.preventDefault();e.stopPropagation();exec('insertText',tag);setCatMenu(null);}}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',
                  padding:'5px 10px',background:'none',border:'none',cursor:'pointer',gap:8,
                  textAlign:'left',fontFamily:'var(--font-body)',boxSizing:'border-box'}}>
                <span style={{fontSize:12,color:C.black}}>{label}</span>
                <span style={{fontSize:9,color:C.grey40,fontFamily:'monospace',flexShrink:0}}>{tag}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{position:'relative',marginBottom:10}}>
        <div ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={save} onFocus={checkFmts} onKeyUp={checkFmts} onMouseUp={checkFmts} onSelect={checkFmts}
          style={{width:'100%',minHeight:140,border:`1px solid ${C.grey30}`,borderRadius:6,
            fontSize:12,padding:'8px',fontFamily:'var(--font-body)',outline:'none',
            lineHeight:1.6,color:C.black,boxSizing:'border-box',background:C.white,cursor:'text'}}
        />
        {isEmpty && (
          <div style={{position:'absolute',top:0,left:0,right:0,padding:'8px',
            fontSize:12,color:C.grey40,fontFamily:'var(--font-body)',lineHeight:1.6,pointerEvents:'none'}}>
            Add a message, terms, or note. Use the options below to insert variables and apply formatting.
          </div>
        )}
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:C.grey50,fontFamily:'var(--font-body)',marginBottom:5}}>Format:</div>
        <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:4}}>
          <select onChange={e=>exec('formatBlock',e.target.value)} value={fmts.blockStyle||'div'}
            style={{height:28,border:`1px solid ${C.grey30}`,borderRadius:5,fontSize:11,padding:'0 4px',
              background:C.white,fontFamily:'var(--font-body)',cursor:'pointer',color:C.grey60,flex:1}}>
            <option value="div">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <Btn icon="bold"          cmd="bold"/>
          <Btn icon="italic"        cmd="italic"/>
          <Btn icon="underline"     cmd="underline"/>
          <Btn icon="strikethrough" cmd="strikeThrough"/>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <Btn icon="list-ul"      cmd="insertUnorderedList"/>
          <Btn icon="list-ol"      cmd="insertOrderedList"/>
          <Btn icon="align-left"   cmd="justifyLeft"/>
          <Btn icon="align-center" cmd="justifyCenter"/>
          <Btn icon="align-right"  cmd="justifyRight"/>
        </div>
      </div>
      <div>
        <div style={{fontSize:11,color:C.grey50,fontFamily:'var(--font-body)',marginBottom:5}}>Insert:</div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {VAR_CATEGORIES.map(cat => <VarBtn key={cat.id} cat={cat}/>)}
        </div>
      </div>
    </>
  );
};

const DInput = ({value, onChange, style, placeholder, multiline}) => {
  const [local, setLocal] = React.useState(value);
  const timer = React.useRef(null);
  React.useEffect(()=>{ setLocal(value); },[value]);
  const handle = v => { setLocal(v); clearTimeout(timer.current); timer.current=setTimeout(()=>onChange(v),150); };
  return multiline
    ? <textarea value={local} onChange={e=>handle(e.target.value)} placeholder={placeholder} style={style}/>
    : <input    value={local} onChange={e=>handle(e.target.value)} placeholder={placeholder} style={style}/>;
};

// ── Product image SVG content — created once at module load, never per-render ─
const _PIBG = "#f0f2f5";
const _PI = {
  camera: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="2" y="10" width="24" height="17" rx="2" fill="#1c1c1c"/>
    <rect x="22" y="10" width="8" height="17" rx="2" fill="#141414"/>
    <rect x="5" y="7" width="7" height="4" rx="2" fill="#2a2a2a"/>
    <rect x="13" y="6" width="8" height="5" rx="1.5" fill="#222"/>
    <circle cx="27" cy="11" r="2" fill="#999"/>
    <circle cx="13" cy="18.5" r="7.5" fill="#444"/>
    <circle cx="13" cy="18.5" r="6" fill="#101828"/>
    <circle cx="13" cy="18.5" r="4.5" fill="#1a2f52"/>
    <circle cx="11" cy="17" r="1.8" fill="rgba(255,255,255,0.18)"/>
    <rect x="5" y="23.5" width="8" height="1.5" rx=".75" fill="#cc0000"/></>),
  lensD: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="10" y="3" width="12" height="26" rx="4" fill="#2a2a2a"/>
    <rect x="9" y="3" width="14" height="3" rx="1.5" fill="#666"/>
    <rect x="8" y="13" width="16" height="6" rx="1.5" fill="#4a4a4a"/>
    <rect x="9" y="21" width="14" height="3" rx="1.5" fill="#555"/>
    <circle cx="16" cy="7" r="5.5" fill="#1a2540"/>
    <circle cx="16" cy="7" r="4" fill="#1e3060"/>
    <circle cx="14.5" cy="5.8" r="1.2" fill="rgba(255,255,255,0.22)"/>
    <rect x="11" y="27" width="10" height="2" rx="1" fill="#888"/></>),
  lensL: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="10" y="3" width="12" height="26" rx="4" fill="#3d3d3d"/>
    <rect x="9" y="3" width="14" height="3" rx="1.5" fill="#666"/>
    <rect x="8" y="13" width="16" height="6" rx="1.5" fill="#4a4a4a"/>
    <rect x="9" y="21" width="14" height="3" rx="1.5" fill="#555"/>
    <circle cx="16" cy="7" r="5.5" fill="#1a2540"/>
    <circle cx="16" cy="7" r="4" fill="#1e3060"/>
    <circle cx="14.5" cy="5.8" r="1.2" fill="rgba(255,255,255,0.22)"/>
    <rect x="11" y="27" width="10" height="2" rx="1" fill="#888"/></>),
  tripod: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <circle cx="16" cy="8" r="4" fill="#333"/>
    <rect x="13" y="7" width="6" height="3" rx="1" fill="#222"/>
    <rect x="14.5" y="11" width="3" height="7" fill="#aaa"/>
    <circle cx="16" cy="18" r="2.5" fill="#888"/>
    <line x1="16" y1="18" x2="5" y2="30" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="16" y1="18" x2="27" y2="30" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="16" y1="18" x2="16" y2="31" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="5" cy="30" r="1.5" fill="#444"/>
    <circle cx="27" cy="30" r="1.5" fill="#444"/>
    <circle cx="16" cy="31" r="1.5" fill="#444"/>
    <rect x="14" y="4" width="4" height="2" rx=".5" fill="#555"/></>),
  memCards: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="6" y="8" width="13" height="18" rx="1.5" fill="#8090b0"/>
    <rect x="9" y="6" width="13" height="18" rx="1.5" fill="#5570a8"/>
    <rect x="12" y="4" width="13" height="18" rx="1.5" fill="#3a55a0"/>
    <polygon points="22,4 25,4 25,8" fill="#2a459a"/>
    <rect x="13" y="6" width="10" height="6" rx="0.5" fill="rgba(255,255,255,0.18)"/>
    <rect x="13" y="16" width="1.5" height="4" rx=".5" fill="#d4a820"/>
    <rect x="15.5" y="16" width="1.5" height="4" rx=".5" fill="#d4a820"/>
    <rect x="18" y="16" width="1.5" height="4" rx=".5" fill="#d4a820"/>
    <rect x="20.5" y="16" width="1.5" height="4" rx=".5" fill="#d4a820"/></>),
  ledPanel: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="2" y="6" width="28" height="20" rx="2" fill="#1a1a1a"/>
    <rect x="4" y="8" width="24" height="16" rx="1" fill="#111"/>
    <circle cx="8" cy="12" r="1.8" fill="#ffe060"/><circle cx="13" cy="12" r="1.8" fill="#ffd040"/>
    <circle cx="18" cy="12" r="1.8" fill="#ffe060"/><circle cx="23" cy="12" r="1.8" fill="#ffd040"/>
    <circle cx="8" cy="18" r="1.8" fill="#ffd040"/><circle cx="13" cy="18" r="1.8" fill="#ffe060"/>
    <circle cx="18" cy="18" r="1.8" fill="#ffd040"/><circle cx="23" cy="18" r="1.8" fill="#ffe060"/>
    <circle cx="28.5" cy="7.5" r="1" fill="#44ee44"/>
    <rect x="14" y="26" width="4" height="3" rx=".5" fill="#555"/></>),
  softbox: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <polygon points="4,8 8,13 8,23 4,27" fill="#888"/>
    <polygon points="28,8 24,13 24,23 28,27" fill="#888"/>
    <polygon points="4,8 28,8 24,13 8,13" fill="#aaa"/>
    <polygon points="8,23 24,23 28,27 4,27" fill="#999"/>
    <rect x="8" y="13" width="16" height="10" fill="#f0f0f0"/>
    <rect x="9" y="14" width="14" height="8" fill="rgba(255,255,240,0.92)"/>
    <rect x="13" y="5" width="6" height="4" rx="1" fill="#777"/>
    <rect x="15" y="2" width="2" height="4" rx=".5" fill="#555"/></>),
  audioRec: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="7" y="4" width="18" height="26" rx="2.5" fill="#2a2a2a"/>
    <rect x="9" y="6" width="14" height="8" rx="1" fill="#1a3a1a"/>
    <rect x="10" y="7.5" width="2.5" height="5" rx=".5" fill="#00cc44"/>
    <rect x="13.5" y="8.5" width="2.5" height="4" rx=".5" fill="#00cc44"/>
    <rect x="17" y="9" width="2.5" height="3.5" rx=".5" fill="#aacc00"/>
    <rect x="20.5" y="9.5" width="1.5" height="3" rx=".5" fill="#ffaa00"/>
    <circle cx="16" cy="19" r="4" fill="#cc0000"/>
    <circle cx="16" cy="19" r="2.5" fill="#ee1111"/>
    <circle cx="10" cy="25" r="1.5" fill="#555"/>
    <circle cx="16" cy="25" r="1.5" fill="#555"/>
    <circle cx="22" cy="25" r="1.5" fill="#555"/>
    <rect x="13" y="2.5" width="6" height="2" rx="1" fill="#444"/></>),
  boomMic: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="4" y="15" width="26" height="2.5" rx="1.25" fill="#b0b0b0"/>
    <rect x="4" y="15.5" width="18" height="1.5" rx=".75" fill="#e0e0e0"/>
    <rect x="19" y="10" width="8" height="12" rx="2.5" fill="#333"/>
    <line x1="21" y1="11" x2="21" y2="21" stroke="#555" strokeWidth="0.8"/>
    <line x1="23" y1="11" x2="23" y2="21" stroke="#555" strokeWidth="0.8"/>
    <line x1="25" y1="11" x2="25" y2="21" stroke="#555" strokeWidth="0.8"/>
    <rect x="21" y="9" width="4" height="2" rx="1" fill="#444"/>
    <rect x="18" y="13" width="10" height="2" rx="1" fill="#666"/>
    <path d="M4,16.5 Q4,22 9,24" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>),
  cStand: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="6" y="25" width="20" height="2.5" rx="1.25" fill="#888"/>
    <rect x="10" y="22" width="12" height="2" rx="1" fill="#aaa"/>
    <rect x="14" y="5" width="4" height="20" rx="1" fill="#999"/>
    <rect x="14" y="5" width="14" height="3" rx="1.5" fill="#aaa"/>
    <rect x="25" y="3" width="3" height="7" rx="1" fill="#888"/>
    <circle cx="14" cy="10" r="1.5" fill="#666"/>
    <circle cx="14" cy="16" r="1.5" fill="#666"/>
    <circle cx="28" cy="6.5" r="1.2" fill="#777"/></>),
  sandbag: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="4" y="12" width="24" height="14" rx="4" fill="#c87820"/>
    <rect x="4" y="17" width="24" height="2" fill="rgba(0,0,0,0.12)"/>
    <rect x="4" y="22" width="24" height="1.5" fill="rgba(0,0,0,0.10)"/>
    <path d="M12,12 Q16,6 20,12" stroke="#a05010" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="16" cy="7.5" r="2" fill="#a05010"/></>),
  appleBoxes: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="3" y="22" width="26" height="7" rx="1" fill="#a06820"/>
    <line x1="8" y1="22" x2="8" y2="29" stroke="#8a5810" strokeWidth="0.8"/>
    <line x1="14" y1="22" x2="14" y2="29" stroke="#8a5810" strokeWidth="0.8"/>
    <line x1="20" y1="22" x2="20" y2="29" stroke="#8a5810" strokeWidth="0.8"/>
    <line x1="26" y1="22" x2="26" y2="29" stroke="#8a5810" strokeWidth="0.8"/>
    <rect x="4" y="15" width="24" height="7" rx="1" fill="#b87830"/>
    <line x1="9" y1="15" x2="9" y2="22" stroke="#a06820" strokeWidth="0.8"/>
    <line x1="15" y1="15" x2="15" y2="22" stroke="#a06820" strokeWidth="0.8"/>
    <line x1="21" y1="15" x2="21" y2="22" stroke="#a06820" strokeWidth="0.8"/>
    <rect x="5" y="8" width="22" height="7" rx="1" fill="#c88838"/>
    <line x1="10" y1="8" x2="10" y2="15" stroke="#b07030" strokeWidth="0.8"/>
    <line x1="16" y1="8" x2="16" y2="15" stroke="#b07030" strokeWidth="0.8"/>
    <line x1="22" y1="8" x2="22" y2="15" stroke="#b07030" strokeWidth="0.8"/>
    <circle cx="16" cy="11.5" r="1.5" fill="rgba(0,0,0,0.25)"/></>),
  backdropW: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="3" y="4" width="1.5" height="22" rx=".75" fill="#888"/>
    <rect x="27.5" y="4" width="1.5" height="22" rx=".75" fill="#888"/>
    <rect x="3" y="4" width="26" height="1.5" rx=".75" fill="#888"/>
    <path d="M4.5,5.5 L4.5,20 Q4.5,28 12,28 L27.5,28 L27.5,5.5 Z" fill="#f8f8f6"/>
    <path d="M4.5,20 Q5,26 12,27" stroke="#ddd" strokeWidth="1" fill="none"/>
    <ellipse cx="15.5" cy="5.5" rx="11" ry="2" fill="#e8e8e4"/></>),
  backdropB: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="3" y="4" width="1.5" height="22" rx=".75" fill="#888"/>
    <rect x="27.5" y="4" width="1.5" height="22" rx=".75" fill="#888"/>
    <rect x="3" y="4" width="26" height="1.5" rx=".75" fill="#888"/>
    <path d="M4.5,5.5 L4.5,20 Q4.5,28 12,28 L27.5,28 L27.5,5.5 Z" fill="#1a1a1a"/>
    <path d="M4.5,20 Q5,26 12,27" stroke="#333" strokeWidth="1" fill="none"/>
    <ellipse cx="15.5" cy="5.5" rx="11" ry="2" fill="#2a2a2a"/></>),
  bkdStand: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="5" y="5" width="2" height="24" rx="1" fill="#999"/>
    <rect x="25" y="5" width="2" height="24" rx="1" fill="#999"/>
    <rect x="5" y="5" width="22" height="2.5" rx="1.25" fill="#bbb"/>
    <rect x="2" y="27" width="8" height="2.5" rx="1.25" fill="#888"/>
    <rect x="22" y="27" width="8" height="2.5" rx="1.25" fill="#888"/>
    <circle cx="6" cy="12" r="2" fill="#666"/>
    <circle cx="26" cy="12" r="2" fill="#666"/>
    <rect x="8" y="4" width="4" height="3" rx="1" fill="#777"/>
    <rect x="20" y="4" width="4" height="3" rx="1" fill="#777"/></>),
  reflector: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <circle cx="16" cy="16" r="13" fill="#c8c8c8"/>
    <path d="M16,16 L3,16 A13,13 0 0,1 9.5,5.5 Z" fill="#d4a020"/>
    <path d="M16,16 L9.5,5.5 A13,13 0 0,1 22.5,5.5 Z" fill="#f5f5f5"/>
    <path d="M16,16 L22.5,5.5 A13,13 0 0,1 29,16 Z" fill="#d8d8d8"/>
    <path d="M16,16 L29,16 A13,13 0 0,1 22.5,26.5 Z" fill="#e8e8e8"/>
    <path d="M16,16 L22.5,26.5 A13,13 0 0,1 9.5,26.5 Z" fill="#2a2a2a"/>
    <path d="M16,16 L9.5,26.5 A13,13 0 0,1 3,16 Z" fill="#c89020"/>
    <circle cx="16" cy="16" r="4" fill="#aaa"/>
    <circle cx="16" cy="16" r="2.5" fill="#888"/></>),
  colorGels: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="6" y="6" width="14" height="22" rx="1" fill="rgba(220,60,60,0.85)"/>
    <rect x="9" y="5" width="14" height="22" rx="1" fill="rgba(240,140,40,0.85)"/>
    <rect x="12" y="4" width="14" height="22" rx="1" fill="rgba(240,220,30,0.85)"/>
    <rect x="15" y="5" width="14" height="22" rx="1" fill="rgba(50,180,80,0.85)"/>
    <rect x="18" y="6" width="8" height="21" rx="1" fill="rgba(50,100,220,0.85)"/>
    <rect x="18" y="6" width="8" height="4" rx="0.5" fill="rgba(255,255,255,0.7)"/></>),
  vBattery: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="6" y="4" width="20" height="22" rx="2" fill="#1c1c1c"/>
    <rect x="5" y="24" width="22" height="5" rx="1" fill="#333"/>
    <rect x="8" y="25" width="6" height="3" rx=".5" fill="#555"/>
    <rect x="18" y="25" width="6" height="3" rx=".5" fill="#555"/>
    <rect x="9" y="8" width="14" height="4" rx="1" fill="#111"/>
    <rect x="10" y="9" width="3" height="2" rx=".5" fill="#00cc44"/>
    <rect x="14" y="9" width="3" height="2" rx=".5" fill="#00cc44"/>
    <rect x="18" y="9" width="3" height="2" rx=".5" fill="#44aa00"/>
    <rect x="22" y="9" width="1.5" height="2" rx=".5" fill="#333"/>
    <rect x="9" y="14" width="14" height="8" rx="1" fill="#252525"/>
    <rect x="11" y="16" width="10" height="1.5" rx=".75" fill="#444"/>
    <rect x="13" y="18.5" width="6" height="1.5" rx=".75" fill="#3a3a3a"/></>),
  charger: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="7" y="8" width="18" height="12" rx="2.5" fill="#2a2a2a"/>
    <rect x="8" y="9" width="16" height="4" rx="1.5" fill="rgba(255,255,255,0.07)"/>
    <rect x="13" y="20" width="3" height="4" rx=".5" fill="#555"/>
    <rect x="17" y="20" width="3" height="4" rx=".5" fill="#555"/>
    <path d="M16,20 Q16,26 22,26 Q28,26 28,20 Q28,15 22,15" stroke="#444" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="13" width="5" height="3" rx="1" fill="#444"/>
    <rect x="22" y="11" width="2" height="3" rx=".5" fill="#555"/>
    <circle cx="16" cy="14" r="1.2" fill="#44cc44"/></>),
  monitor: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="2" y="5" width="28" height="19" rx="2" fill="#1a1a1a"/>
    <rect x="4" y="7" width="11" height="15" rx="1" fill="#081408"/>
    <polyline points="5,20 7,16 9,18 11,13 13,17 14,15" stroke="#00cc44" strokeWidth="0.8" fill="none"/>
    <rect x="16" y="7" width="12" height="15" rx="1" fill="#0a0a14"/>
    <circle cx="22" cy="14.5" r="5" fill="none" stroke="#204080" strokeWidth="0.6"/>
    <circle cx="22" cy="14.5" r="3" fill="none" stroke="#204080" strokeWidth="0.6"/>
    <circle cx="22" cy="11.5" r="0.8" fill="#cc4444"/>
    <circle cx="25" cy="16.5" r="0.8" fill="#44cc44"/>
    <circle cx="19" cy="16.5" r="0.8" fill="#4444cc"/>
    <rect x="14" y="24" width="4" height="4" rx=".5" fill="#333"/>
    <rect x="10" y="27" width="12" height="2" rx="1" fill="#444"/></>),
  followFocus: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="6" y="8" width="14" height="16" rx="2" fill="#222"/>
    <rect x="7" y="9" width="12" height="2" rx=".5" fill="#333"/>
    <rect x="7" y="12" width="12" height="2" rx=".5" fill="#333"/>
    <rect x="7" y="15" width="12" height="2" rx=".5" fill="#333"/>
    <rect x="7" y="18" width="12" height="2" rx=".5" fill="#333"/>
    <circle cx="21" cy="16" r="8" fill="#3a3a3a"/>
    <circle cx="21" cy="16" r="5.5" fill="#2a2a2a"/>
    <rect x="20" y="8" width="2" height="3" rx=".5" fill="#4a4a4a"/>
    <rect x="20" y="21" width="2" height="3" rx=".5" fill="#4a4a4a"/>
    <rect x="25" y="15" width="3" height="2" rx=".5" fill="#4a4a4a"/>
    <rect x="13" y="15" width="3" height="2" rx=".5" fill="#4a4a4a"/>
    <circle cx="21" cy="16" r="2.5" fill="#555"/>
    <circle cx="21" cy="16" r="1.2" fill="#333"/>
    <rect x="3" y="14" width="6" height="4" rx="1" fill="#444"/></>),
  pelicanCase: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="2" y="6" width="28" height="22" rx="3" fill="#e8a800"/>
    <rect x="2" y="15.5" width="28" height="1.5" fill="#c89000"/>
    <path d="M11,6 Q16,2 21,6" stroke="#c89000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <rect x="5" y="13" width="5" height="5" rx="1" fill="#888"/>
    <rect x="6" y="14" width="3" height="3" rx=".5" fill="#aaa"/>
    <rect x="22" y="13" width="5" height="5" rx="1" fill="#888"/>
    <rect x="23" y="14" width="3" height="3" rx=".5" fill="#aaa"/>
    <rect x="4" y="8" width="24" height="6" rx="1" fill="rgba(0,0,0,0.08)"/>
    <rect x="2" y="6" width="5" height="5" rx="2" fill="#d09800"/>
    <rect x="25" y="6" width="5" height="5" rx="2" fill="#d09800"/>
    <rect x="2" y="23" width="5" height="5" rx="2" fill="#d09800"/>
    <rect x="25" y="23" width="5" height="5" rx="2" fill="#d09800"/></>),
  fallback: (<><rect width="32" height="32" fill={_PIBG} rx="3"/>
    <rect x="5" y="10" width="22" height="16" rx="2" fill="#888"/>
    <polygon points="5,10 16,4 27,10" fill="#aaa"/></>),
};
const _SKU_PI = {
  'R5-001':_PI.camera, 'LNS-85':_PI.lensD, 'LNS-02':_PI.lensL, 'LNS-24':_PI.lensD,
  'TRP-02':_PI.tripod, 'MEM-04':_PI.memCards, 'LED-600':_PI.ledPanel, 'SBX-02':_PI.softbox,
  'AUD-07':_PI.audioRec, 'MIC-03':_PI.boomMic, 'CST-04':_PI.cStand, 'SND-10':_PI.sandbag,
  'APL-06':_PI.appleBoxes, 'BKD-W':_PI.backdropW, 'BKD-B':_PI.backdropB, 'BKS-01':_PI.bkdStand,
  'RFL-05':_PI.reflector, 'GEL-01':_PI.colorGels, 'BAT-VM':_PI.vBattery, 'CHG-01':_PI.charger,
  'MON-07':_PI.monitor, 'WFF-01':_PI.followFocus, 'PLC-L':_PI.pelicanCase,
};

const ExpN = ({ onExit, docType, isPreviewOnly = false }) => {  const C = BQ;
  const _nid = React.useRef(600);
  const nextId = () => String(++_nid.current);

  // ── Line items ────────────────────────────────────────────
  const [lineItems, setLineItems] = React.useState([
    { id:'qty',         label:'Quantity',                               drag:true,  on:true,  dropdown:{val:'1x',opts:['1x','2x','Per unit']} },
    { id:'image',       label:'Image',                                  drag:true,  on:true,  dropdown:{val:'Medium',opts:['Small','Medium','Large']} },
    { id:'sku',         label:'Stock code (SKU)',                       drag:true,  on:false, dropdown:null },
    { id:'name',        label:'Product name',                           drag:true,  on:true,  dropdown:null },
    { id:'period',      label:'Period',                                 drag:true,  on:true,  dropdown:null },
    { id:'unit_price',  label:'Unit price (rate)',                      drag:true,  on:true,  dropdown:null },
    { id:'tax',         label:'Tax',                                    drag:true,  on:true,  dropdown:null },
    { id:'charge_lbl',  label:'Charge label (e.g. "1 day" / "Fixed")', drag:true,  on:false, dropdown:null },
    { id:'discount',    label:'Applied discount',                       drag:true,  on:false, dropdown:null },
    { id:'coupons',     label:'Applied coupons',                        drag:true,  on:false, dropdown:null },
    { id:'price_total', label:'Price total',                            drag:true,  on:true,  dropdown:null },
    { id:'bundle',      label:'Bundle item pricing',                    drag:false, on:true,  dropdown:null, special:true },
    { id:'barcode',     label:'Barcode',                                drag:true,  on:false, dropdown:null },
    { id:'qr',          label:'QR code',                                drag:true,  on:false, dropdown:null },
    { id:'item_type',   label:'Item type (Rental, Sales, Service)',     drag:true,  on:false, dropdown:null },
    { id:'custom',      label:'Custom fields',                          drag:true,  on:false, dropdown:null },
  ]);

  const COL_DATA = {
    image:      { label:'Image',    vals:['img','img','img'],           align:'center' },
    sku:        { label:'SKU',      vals:['R5-001','TRP-02','MEM-04'],  align:'left'   },
    name:       { label:'Product',  vals:['Canon EOS R5','Tripod & Head','Memory Cards'], align:'left' },
    qty:        { label:'Qty',      vals:['2','1','4'],                 align:'right',  width:28 },
    period:     { label:'Period',   vals:['7 days','7 days','7 days'],  align:'right'  },
    unit_price: { label:'Rate',     vals:['$149','$49','$12'],          align:'right'  },
    charge_lbl: { label:'Charge',   vals:['1 day','Fixed','1 day'],     align:'right'  },
    discount:   { label:'Discount', vals:['—','—','—'],                 align:'right'  },
    coupons:    { label:'Coupons',  vals:['—','—','—'],                 align:'right'  },
    tax:        { label:'Tax',      vals:['$22','$7','$7'],             align:'right'  },
    price_total:{ label:'Total',    vals:['$320','$56','$55'],          align:'right'  },
    item_type:  { label:'Type',     vals:['Rental','Rental','Rental'],  align:'right'  },
    barcode:    { label:'Barcode',  vals:['▐▌▐▐▌▌','▐▌▐▐▌▌','▐▌▐▐▌▌'], align:'center' },
    qr:         { label:'QR',       vals:['⊞','⊞','⊞'],                align:'center' },
    custom:     { label:'Custom',   vals:['—','—','—'],                 align:'right'  },
  };

  const toggleLI  = id => setLineItems(p => p.map(i => i.id===id?{...i,on:!i.on}:i));
  const setLIDrop = (id,val) => setLineItems(p => p.map(i => i.id===id&&i.dropdown?{...i,dropdown:{...i.dropdown,val}}:i));

  const liDragRef = React.useRef(null);
  const [dragOverLI, setDragOverLI] = React.useState(null);
  const onLIDragStart = (e,i) => { liDragRef.current=i; e.dataTransfer.effectAllowed='move'; };
  const onLIDragOver = (e,i) => { e.preventDefault(); setDragOverLI(i); };
  const onLIDrop = (e,i) => {
    e.preventDefault(); const from=liDragRef.current;
    setDragOverLI(null); liDragRef.current=null;
    if(from===null||from===i) return;
    setLineItems(p=>{ const a=[...p]; const [m]=a.splice(from,1); a.splice(i,0,m); return a; });
  };
  const onLIDragEnd = () => { setDragOverLI(null); liDragRef.current=null; };
  const [hovLI, setHovLI] = React.useState(null);

  // ── Sections ──────────────────────────────────────────────
  const [sections, setSections] = React.useState([
    {id:'header',   type:'builtin',label:'Header',          visible:true},
    {id:'logistics',type:'builtin',label:'Pick-up & Return',visible:true},
    {id:'lineitems',type:'builtin',label:'Line Items',       visible:true},
    {id:'totals',   type:'builtin',label:'Totals & Fees',    visible:true},
    {id:'footer',   type:'builtin',label:'Footer',           visible:true},
  ]);

  const [editing, setEditing] = React.useState(null);
  const [zoom,     setZoom]     = React.useState(1);
  const [hovSec,   setHovSec]   = React.useState(null);
  const [hovPrev,  setHovPrev]  = React.useState(null);
  const [addModal,   setAddModal]   = React.useState(null);
  const [resetModal, setResetModal] = React.useState(false);

  // Template switcher state (contracts only)
  const [templates,       setTemplates]       = React.useState([{id:'tpl1', name:'Contract template'}]);
  const [activeTplId,     setActiveTplId]     = React.useState('tpl1');
  const [tplDropOpen,     setTplDropOpen]     = React.useState(false);
  const [newTplName,      setNewTplName]      = React.useState('');
  const [showNewTplInput, setShowNewTplInput] = React.useState(false);
  const [hovTpl,          setHovTpl]          = React.useState(null);
  const [renamingTplId,   setRenamingTplId]   = React.useState(null);
  const [renameTplName,   setRenameTplName]   = React.useState('');
  const tplDropRef = React.useRef(null);
  const sectionRefs = React.useRef({});
  const commitRename = id => { const v=renameTplName.trim(); if(v) setTemplates(p=>p.map(t=>t.id===id?{...t,name:v}:t)); setRenamingTplId(null); setRenameTplName(''); };
  React.useEffect(() => {
    if (!tplDropOpen) return;
    const handler = e => { if (tplDropRef.current && !tplDropRef.current.contains(e.target)) { setTplDropOpen(false); setShowNewTplInput(false); setNewTplName(''); setRenamingTplId(null); setRenameTplName(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tplDropOpen]);
  React.useEffect(() => {
    if (!hovSec) return;
    const el = sectionRefs.current[hovSec];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [hovSec]);

  // Settings panel state
  const [settingsTab, setSettingsTab]   = React.useState('customize');
  const [docTypeTab,  setDocTypeTab]    = React.useState('invoices');
  const [dateFormat,  setDateFormat]    = React.useState('datetime');
  const [pageSize,    setPageSize]      = React.useState('A4');
  const [docNumLevel, setDocNumLevel]   = React.useState('global');
  const [prefixFormat, setPrefixFormat] = React.useState('{year}-');
  const [dueDatesOn,  setDueDatesOn]    = React.useState(false);
  const [customCSS,   setCustomCSS]     = React.useState('');

  const [blockData, setBlockData] = React.useState({});
  const updateBlock = (id,p2) => setBlockData(p=>({...p,[id]:{...(p[id]||{}),...p2}}));
  const getBlock = id => ({text:'',textStyle:'normal',bold:false,italic:false,underline:false,strikethrough:false,bulletList:false,numberedList:false,align:'left',bgStyle:'white',...(blockData[id]||{})});

  const doReset = () => {
    setDocCfg({primaryColor:'#136DEB',showLogo:true,showContact:true,showCompanyInfo:true,logoAlign:'Left',logoSize:'L',documentTitle:'Invoice',showDates:true,showLocation:true,showAddress:false,showSubtotal:true,showTotalDiscount:true,showAppliedCoupons:false,showSecurityDeposit:false,showCustomCharge:false,showTaxBreakdown:false,showTotalInclTaxes:true,footerCompanyDetails:true,footerContactDetails:true,footerVatNumber:true,footerPaymentDetails:true,footerPageNumbers:true,font:'Inter',partyOrder:'seller-first',showPartyLabels:false});
    setDateFormat('datetime'); setPageSize('A4'); setDocNumLevel('global'); setPrefixFormat('{year}-'); setDueDatesOn(false); setCustomCSS('');
    setBrandColor('#136DEB');
    setBlockData({});
    setResetModal(false);
  };

  const [docCfg, setDocCfg] = React.useState({
    primaryColor:'#136DEB',showLogo:true,showContact:true,showCompanyInfo:true,logoAlign:'Left',logoSize:'L',documentTitle:docType?.label||'Invoice',
    showDates:true,showLocation:true,showAddress:false,
    showSubtotal:true,showTotalDiscount:true,showAppliedCoupons:false,
    showSecurityDeposit:false,showCustomCharge:false,showTaxBreakdown:false,showTotalInclTaxes:true,
    footerCompanyDetails:true,footerContactDetails:true,footerVatNumber:true,footerPaymentDetails:true,footerPageNumbers:true,
    font:'Inter',
    partyOrder:'seller-first',showPartyLabels:false,
  });
  const setDoc = (k,v) => setDocCfg(p=>({...p,[k]:v!==undefined?v:!p[k]}));

  const isEdit = !isPreviewOnly;
  const ZOOM_STEPS=[0.5,0.67,0.75,0.9,1,1.1,1.25,1.5];
  // Page dimensions in CSS px at 72 DPI (PDF standard points)
  const PAGE_DIMS = {A4:{w:595,h:842},A5:{w:420,h:595},Letter:{w:612,h:792},Legal:{w:612,h:1008}};
  const pageDim = PAGE_DIMS[pageSize] || PAGE_DIMS.A4;
  const zoomIn  = () => setZoom(z=>{const i=ZOOM_STEPS.findIndex(s=>s>z);return i>=0?ZOOM_STEPS[i]:z;});
  const zoomOut = () => setZoom(z=>{const r=[...ZOOM_STEPS].reverse();const i=r.findIndex(s=>s<z);return i>=0?r[i]:z;});

  const canvasRef = React.useRef(null);
  const [viewScale, setViewScale] = React.useState(1);
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth - 80;
      const fill = Math.max(0.55, Math.min(0.90, 0.85 - (available - 600) * 0.00025));
      setViewScale(Math.max(0.5, Math.min(1.45, available * fill / pageDim.w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageDim.w]);

  const dragRef = React.useRef(null);
  const [dragOverSec, setDragOverSec] = React.useState(null);
  const onDragStart = (e,i) => {dragRef.current=i;e.dataTransfer.effectAllowed='move';};
  const onSecDragOver = (e,i) => {e.preventDefault();setDragOverSec(i);};
  const onDrop = (e,i) => {
    e.preventDefault();const from=dragRef.current;
    setDragOverSec(null);dragRef.current=null;
    if(from===null||from===i) return;
    setSections(p=>{
      const locked=s=>s.id==='header'||s.id==='footer';
      if(locked(p[from])||locked(p[i])) return p;
      const a=[...p];const [m]=a.splice(from,1);a.splice(i,0,m);return a;
    });
  };
  const onSecDragEnd = () => {setDragOverSec(null);dragRef.current=null;};
  const toggleSection = id => setSections(p=>p.map(s=>s.id===id?{...s,visible:!s.visible}:s));
  const insertTextSection = (afterId,position) => {
    const nb={id:nextId(),type:'text',label:'Text section',visible:true};
    setSections(p=>{const a=[...p];const idx=a.findIndex(s=>s.id===afterId);a.splice(position==='above'?idx:idx+1,0,nb);return a;});
    setAddModal(null);
    setTimeout(()=>{setEditing(nb.id);const el=sectionRefs.current[nb.id];if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});},80);
  };

  // ── Atoms ─────────────────────────────────────────────────
  const FI = ({n,sz=12,col=C.grey50}) =>
    <i className={`fa-regular fa-${n}`} style={{fontSize:sz,color:col,lineHeight:1,flexShrink:0}}/>;

  const SmTog = ({on,onChange}) => (
    <div onClick={onChange} style={{width:34,height:18,borderRadius:9,background:on?C.blue:C.grey30,cursor:'pointer',position:'relative',transition:'background 180ms',flexShrink:0}}>
      <div style={{width:12,height:12,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?19:3,transition:'left 180ms'}}/>
    </div>
  );
  const Tooltip = ({text, children}) => {
    const [show, setShow] = React.useState(false);
    return (
      <div style={{position:'relative',flexShrink:0}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
        {children}
        {show&&<div style={{position:'absolute',bottom:'calc(100% + 6px)',right:0,background:C.black,color:'#fff',fontSize:10,lineHeight:1.4,padding:'5px 8px',borderRadius:5,whiteSpace:'nowrap',fontFamily:'var(--font-body)',pointerEvents:'none',zIndex:200}}>{text}</div>}
      </div>
    );
  };
  const Tog = ({on,onChange,disabled,tooltip}) => {
    const el = (
      <div onClick={disabled?undefined:onChange} style={{width:32,height:17,borderRadius:9,background:disabled?C.grey20:on?C.blue:C.grey30,cursor:disabled?'default':'pointer',position:'relative',transition:'background 180ms',flexShrink:0,opacity:disabled?0.5:1}}>
        <div style={{width:11,height:11,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on&&!disabled?18:3,transition:'left 180ms'}}/>
      </div>
    );
    return disabled&&tooltip ? <Tooltip text={tooltip}>{el}</Tooltip> : el;
  };
  const SHead = ({label}) => (
    <div style={{margin:'-4px -14px 0',padding:'11px 14px',background:C.grey10,borderTop:`1px solid ${C.grey20}`,borderBottom:`1px solid ${C.grey20}`,fontSize:13,fontWeight:700,color:C.black,fontFamily:'var(--font-body)'}}>{label}</div>
  );
  const SelF = ({label,value,onChange,opts}) => (
    <div style={{marginTop:8,marginBottom:10}}>
      <div style={{fontSize:11,color:C.grey60,marginBottom:4,fontFamily:'var(--font-body)'}}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:'100%',height:30,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,padding:'0 8px',background:C.white,fontFamily:'var(--font-body)'}}>
        {opts.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
  const Radio = ({checked,onChange,label,hint}) => (
    <label style={{display:'flex',alignItems:'flex-start',gap:8,padding:'7px 0',cursor:'pointer'}}>
      <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${checked?C.blue:C.grey30}`,background:checked?C.blue:'transparent',flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 150ms'}} onClick={onChange}>
        {checked&&<div style={{width:5,height:5,borderRadius:'50%',background:'#fff'}}/>}
      </div>
      <div>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)',lineHeight:1.3}}>{label}</div>
        {hint&&<div style={{fontSize:10,color:C.grey50,marginTop:2,fontFamily:'var(--font-body)',lineHeight:1.4}}>{hint}</div>}
      </div>
    </label>
  );
  const SaveBtn = () => (
    <button style={{height:28,padding:'0 12px',background:C.blue,color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',marginTop:8}}>Save</button>
  );


  // ── Line Items panel ──────────────────────────────────────
  const bundleItem = lineItems.find(i=>i.id==='bundle');

  const LineItemsPanel = () => (
    <>
      <SHead label="Line item settings"/>
      {bundleItem && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
          <div>
            <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Bundle item pricing</div>
            <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Shows bundles as one combined price</div>
          </div>
          <Tog on={bundleItem.on} onChange={()=>toggleLI(bundleItem.id)}/>
        </div>
      )}

      <SHead label="Columns"/>
      <div style={{marginBottom:8}}>
        {lineItems.map((item,idx)=>{
          const isHov=hovLI===item.id;
          if(item.special) return null;
          return (
            <React.Fragment key={item.id}>
            {item.drag&&dragOverLI===idx&&<div style={{height:2,background:C.blue,borderRadius:1,margin:'1px 8px'}}/>}
            <div
              draggable={item.drag}
              onDragStart={item.drag?e=>onLIDragStart(e,idx):undefined}
              onDragOver={item.drag?e=>onLIDragOver(e,idx):undefined}
              onDrop={item.drag?e=>onLIDrop(e,idx):undefined}
              onDragEnd={item.drag?onLIDragEnd:undefined}
              onMouseEnter={()=>setHovLI(item.id)}
              onMouseLeave={()=>setHovLI(null)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 8px 0 14px',
                margin:'0 -14px',
                background:isHov?C.grey10:'transparent',
                borderLeft:`3px solid ${isHov?C.blue:'transparent'}`,
                transition:'background 100ms,border-color 100ms',minHeight:36}}>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'8px 0'}}>
                <span style={{fontSize:13,color:C.black,fontFamily:'var(--font-body)',lineHeight:1.3}}>{item.label}</span>
                {item.dropdown&&item.on&&(
                  <select value={item.dropdown.val} onChange={e=>setLIDrop(item.id,e.target.value)}
                    style={{height:22,border:`1px solid ${C.grey30}`,borderRadius:5,fontSize:10,padding:'0 4px',background:C.white,fontFamily:'var(--font-body)',maxWidth:72,cursor:'pointer'}}>
                    {item.dropdown.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                )}
              </div>
              <div style={{display:'flex',gap:3,alignItems:'center'}}>
                <button onClick={()=>toggleLI(item.id)}
                  style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'1px solid transparent',borderRadius:6,cursor:'pointer',opacity:item.on?(isHov?1:0):1,transition:'opacity 150ms'}}>
                  <FI n={item.on?'eye':'eye-slash'} sz={12} col={item.on?C.grey60:C.grey50}/>
                </button>
                <div style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.grey30}`,borderRadius:6,cursor:'grab',opacity:isHov?1:0,transition:'opacity 150ms'}}>
                  <FI n="grip-lines" sz={12} col={C.grey50}/>
                </div>
              </div>
            </div>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );

  // ── Settings panel ────────────────────────────────────────
  const SettingsPanel = () => {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
        {/* Back */}
        <div style={{padding:'0 14px',borderBottom:`1px solid ${C.grey20}`}}>
          <button onClick={()=>setEditing(null)}
            style={{height:40,display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:C.grey50,fontSize:12,fontFamily:'var(--font-body)',padding:0}}>
            <FI n="chevron-left" sz={10} col={C.grey50}/> Settings
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'4px 14px 7px'}}>

          {/* Branding */}
          <SHead label="Branding"/>
          <ColorRow label="Brand color" value={brandColor} onChange={v=>{setBrandColor(v);setDoc('primaryColor',v);}}/>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'8px 0'}}>
            <span style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Logo</span>
            <div style={{width:140}}>
              <div style={{height:110,background:C.grey10,borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,border:`1px solid ${C.grey20}`,position:'relative',overflow:'hidden',paddingBottom:28}}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="16" fill="#222"/>
                  <path d="M10 26 C10 18 18 10 26 14 C22 18 20 22 18 26Z" fill="#fff" opacity=".6"/>
                  <path d="M14 28 C14 20 20 14 28 18 C24 22 22 26 18 28Z" fill="#fff" opacity=".4"/>
                </svg>
                <span style={{fontSize:9,fontWeight:700,color:C.black,letterSpacing:2,fontFamily:'var(--font-body)'}}>COMPANY</span>
                <button style={{position:'absolute',bottom:0,left:0,right:0,height:28,border:'none',borderTop:`1px solid ${C.grey20}`,borderRadius:0,background:C.white,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',color:C.black}}>Change</button>
              </div>
            </div>
          </div>
          <div style={{padding:'10px 0',display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={()=>{setBrandColor('#136DEB');setSecondColor('#131314');setDoc('primaryColor','#136DEB');}} style={{width:'100%',height:32,background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,fontWeight:500,color:C.black,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'var(--font-body)'}}>
              <FI n="rotate-left" sz={11} col={C.grey60}/> Load branding defaults
            </button>
            <a href="#" onClick={e=>e.preventDefault()} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontSize:12,color:C.blue,fontFamily:'var(--font-body)',textDecoration:'none',cursor:'pointer'}}>
              <FI n="arrow-up-right-from-square" sz={10} col={C.blue}/> Global Branding
            </a>
          </div>

          {/* Document numbering */}
          <SHead label="Document numbering"/>
          <Radio checked={docNumLevel==='global'} onChange={()=>setDocNumLevel('global')}
            label="Global sequence" hint="Numbers increment by one: #1, #2, #3, etc."/>
          <Radio checked={docNumLevel==='prefix'} onChange={()=>setDocNumLevel('prefix')}
            label="Prefix sequence" hint="Customize the prefix with static or dynamic values."/>
          {docNumLevel==='prefix' && (() => {
            const VARS = [
              {label:'Year',        token:'{year}',        ex:'2026'},
              {label:'Month',       token:'{month}',       ex:'04'},
              {label:'Customer #',  token:'{customer_nr}', ex:'42'},
              {label:'Order #',     token:'{order_nr}',    ex:'18'},
            ];
            const preview = VARS.reduce((s,v)=>s.replaceAll(v.token,v.ex), prefixFormat||'') + '1';
            return (
              <div style={{marginTop:4,marginBottom:4,background:C.grey10,borderRadius:7,padding:'10px 10px 10px'}}>
                <div style={{fontSize:10,color:C.grey60,marginBottom:10,lineHeight:1.55,fontFamily:'var(--font-body)'}}>
                  Prefix document numbers with custom or dynamic values.
                </div>
                <div style={{fontSize:10,color:C.grey50,marginBottom:4,fontFamily:'var(--font-body)'}}>Prefix format</div>
                <input value={prefixFormat} onChange={e=>setPrefixFormat(e.target.value)}
                  placeholder="{year}-"
                  style={{width:'100%',height:28,border:`1px solid ${C.grey30}`,borderRadius:5,fontSize:12,padding:'0 8px',background:C.white,fontFamily:'var(--font-body)',boxSizing:'border-box',outline:'none'}}/>
                <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
                  {VARS.map(v=>(
                    <button key={v.token} onClick={()=>setPrefixFormat(p=>(p||'')+v.token)}
                      style={{fontSize:10,padding:'2px 7px',border:`1px solid ${C.blue30}`,borderRadius:4,background:C.blue5,color:C.blue,cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:500,lineHeight:1.6}}>
                      + {v.label}
                    </button>
                  ))}
                </div>
                <div style={{marginTop:8,fontSize:10,color:C.grey50,fontFamily:'var(--font-body)'}}>
                  Preview: <span style={{color:C.black,fontWeight:600,fontFamily:'monospace'}}>{preview}</span>
                </div>
              </div>
            );
          })()}

          {/* Invoice due dates */}
          <SHead label="Invoice due dates"/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
            <div>
              <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Enable invoice due dates</div>
              <div style={{fontSize:10,color:C.grey50,fontFamily:'var(--font-body)',marginTop:1}}>Automatically set a due date for every finalized invoice.</div>
            </div>
            <Tog on={dueDatesOn} onChange={()=>setDueDatesOn(p=>!p)}/>
          </div>

          {/* Custom CSS */}
          <SHead label="Custom CSS"/>
          <div style={{fontSize:10,color:C.grey50,marginBottom:6,fontFamily:'var(--font-body)',lineHeight:1.4}}>
            Override default styles. <span style={{color:C.blue,cursor:'pointer'}}>Learn more</span>
          </div>
          <DInput multiline value={customCSS} onChange={setCustomCSS}
            placeholder={'/* Override default styles */\n.invoice-header { }\n.line-items td { }'}
            style={{width:'100%',height:110,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:11,padding:'8px',fontFamily:'monospace',resize:'vertical',outline:'none',lineHeight:1.6,background:'#fafafa',boxSizing:'border-box'}}/>

        </div>
        <div style={{padding:'12px 14px',borderTop:`1px solid ${C.grey20}`,flexShrink:0}}>
          <button onClick={()=>setResetModal(true)} style={{width:'100%',height:32,background:'#e53e3e',border:'none',borderRadius:6,fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'var(--font-body)'}}>
            <FI n="rotate-left" sz={11} col="#fff"/> Reset template
          </button>
        </div>
      </div>
    );
  };

  // ── Branding panel ────────────────────────────────────────
  const [brandColor, setBrandColor] = React.useState('#136DEB');

  const ColorRow = ({label, value, onChange}) => {
    const [hex, setHex] = React.useState(value.replace('#','').toUpperCase());
    React.useEffect(()=>{ setHex(value.replace('#','').toUpperCase()); },[value]);
    const commit = (raw) => {
      const v = raw.replace(/[^0-9a-fA-F]/g,'');
      if(v.length===6) onChange('#'+v);
    };
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <span style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>{label}</span>
        {/* Single pill: hex input + color swatch */}
        <div style={{display:'flex',alignItems:'center',border:`1px solid ${C.grey20}`,borderRadius:8,overflow:'hidden',height:32}}>
          <span style={{fontSize:11,color:C.grey50,fontFamily:'monospace',paddingLeft:10,userSelect:'none'}}>#</span>
          <input
            value={hex}
            onChange={e=>{ const v=e.target.value.replace(/[^0-9a-fA-F]/g,'').toUpperCase().slice(0,6); setHex(v); commit(v); }}
            onBlur={()=>commit(hex)}
            style={{width:62,border:'none',outline:'none',background:'transparent',fontSize:11,fontFamily:'monospace',letterSpacing:'.03em',color:C.black,padding:'0 6px 0 2px'}}
          />
          {/* Color swatch — clicking opens native picker */}
          <div style={{width:32,height:32,background:value,position:'relative',flexShrink:0}}>
            <input type="color" value={value} onChange={e=>onChange(e.target.value)}
              style={{opacity:0,position:'absolute',inset:0,width:'100%',height:'100%',cursor:'pointer',border:'none',padding:0}}/>
          </div>
        </div>
      </div>
    );
  };


  // ── Section settings ──────────────────────────────────────
  const sectionPanels = {
    header: <>
      <SHead label="Logo & title"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Company logo</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Shown at the top of the document</div>
        </div>
        <Tog on={docCfg.showLogo} onChange={()=>setDoc('showLogo')}/>
      </div>
      {docCfg.showLogo && (
        <div style={{padding:'10px 0 12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <div style={{fontSize:11,color:C.grey60,fontFamily:'var(--font-body)',width:36,flexShrink:0}}>Size</div>
            <div style={{display:'flex',gap:4,flex:1}}>
              {['S','M','L'].map(sz=>(
                <button key={sz} onClick={()=>setDoc('logoSize',sz)}
                  style={{flex:1,height:26,border:`1px solid ${docCfg.logoSize===sz?C.blue:C.grey30}`,borderRadius:6,background:docCfg.logoSize===sz?C.blue5:C.white,color:docCfg.logoSize===sz?C.blue:C.grey60,fontSize:11,cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:docCfg.logoSize===sz?600:400,transition:'all 120ms'}}>{sz}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:11,color:C.grey60,fontFamily:'var(--font-body)',width:36,flexShrink:0}}>Side</div>
            <div style={{display:'flex',gap:4,flex:1}}>
              {[['Left','align-left'],['Right','align-right']].map(([a,icon])=>(
                <button key={a} onClick={()=>setDoc('logoAlign',a)}
                  style={{flex:1,height:26,border:`1px solid ${docCfg.logoAlign===a?C.blue:C.grey30}`,borderRadius:6,background:docCfg.logoAlign===a?C.blue5:C.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 120ms'}}>
                  <FI n={icon} sz={11} col={docCfg.logoAlign===a?C.blue:C.grey50}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{padding:'7px 0'}}>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)',marginBottom:6}}>Document title</div>
        <DInput
          value={docCfg.documentTitle}
          onChange={v=>setDoc('documentTitle',v)}
          style={{width:'100%',height:32,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,padding:'0 8px',background:C.white,fontFamily:'var(--font-body)',color:C.black,boxSizing:'border-box',outline:'none'}}
        />
      </div>
      <SHead label="Company details"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Company contact details</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)'}}>Phone, email, website</div>
        </div>
        <Tog on={docCfg.showContact} onChange={()=>setDoc('showContact')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Company information</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)'}}>Address and registration info</div>
        </div>
        <Tog on={docCfg.showCompanyInfo} onChange={()=>setDoc('showCompanyInfo')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Swap party order</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Places customer on the left, seller on the right</div>
        </div>
        <Tog on={docCfg.partyOrder==='customer-first'} onChange={()=>setDoc('partyOrder',docCfg.partyOrder==='customer-first'?'seller-first':'customer-first')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Party labels</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Shows "From" and "Bill to" above each column</div>
        </div>
        <Tog on={docCfg.showPartyLabels} onChange={()=>setDoc('showPartyLabels')}/>
      </div>
    </>,
    logistics: <>
      <SHead label="Pickup & return settings"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Dates</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Rental start and end dates</div>
        </div>
        <Tog on={docCfg.showDates} onChange={()=>setDoc('showDates')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Times</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Includes time with dates</div>
        </div>
        <Tog on={dateFormat==='datetime'} onChange={()=>setDateFormat(dateFormat==='datetime'?'dateonly':'datetime')} disabled={!docCfg.showDates} tooltip="Requires pickup & return dates"/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Locations</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Branch name</div>
        </div>
        <Tog on={docCfg.showLocation} onChange={()=>setDoc('showLocation')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Addresses</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Location name with its address</div>
        </div>
        <Tog on={docCfg.showAddress} onChange={()=>setDoc('showAddress')} disabled={!docCfg.showLocation} tooltip="Requires pickup & return locations"/>
      </div>
    </>,
    lineitems: <LineItemsPanel/>,
    totals: <>
      <SHead label="Totals & fees settings"/>
      {[
        ['Subtotal',          'showSubtotal',        false, 'Sum before discounts and taxes'],
        ['Total discount',    'showTotalDiscount',   false, 'All discounts combined'],
        ['Applied coupons',   'showAppliedCoupons',  false, 'Coupon codes and savings'],
        ['Security deposit',  'showSecurityDeposit', false, 'Refundable deposit during rental'],
        ['Custom charge',     'showCustomCharge',    false, 'Manually added charges'],
        ['Tax breakdown',     'showTaxBreakdown',    false, 'Tax per applicable rate'],
        ['Total incl. taxes', 'showTotalInclTaxes',  false, 'Final amount including all taxes'],
      ].map(([label,key,bold,hint])=>(
        <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
          <div>
            <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)',fontWeight:bold?700:400}}>{label}</div>
            <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>{hint}</div>
          </div>
          <Tog on={docCfg[key]} onChange={()=>setDoc(key)}/>
        </div>
      ))}
    </>,
    footer: <>
      <SHead label="Footer settings"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Company details</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Business name and address</div>
        </div>
        <Tog on={docCfg.footerCompanyDetails} onChange={()=>setDoc('footerCompanyDetails')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Contact details</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Phone, email, and website</div>
        </div>
        <Tog on={docCfg.footerContactDetails} onChange={()=>setDoc('footerContactDetails')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>VAT number</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Your registered VAT or tax ID</div>
        </div>
        <Tog on={docCfg.footerVatNumber} onChange={()=>setDoc('footerVatNumber')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Payment details</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Bank details or payment info</div>
        </div>
        <Tog on={docCfg.footerPaymentDetails} onChange={()=>setDoc('footerPaymentDetails')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
        <div>
          <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Page numbers</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Current page and total count</div>
        </div>
        <Tog on={docCfg.footerPageNumbers} onChange={()=>setDoc('footerPageNumbers')}/>
      </div>
    </>,
  };

  // ── Text section panel ────────────────────────────────────
  const TextSectionPanel = ({id}) => {
    const b = getBlock(id);
    return (
      <>
        <SHead label="Content"/>
        <div style={{padding:'8px 0'}}>
          <RichTextPanel id={id} getBlock={getBlock} updateBlock={updateBlock}/>
        </div>
        <SHead label="Styling"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
          <div>
            <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Grey Background</div>
            <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Use a grey background on this section</div>
          </div>
          <Tog on={(b.bgStyle||'white')==='grey'} onChange={()=>updateBlock(id,{bgStyle:(b.bgStyle||'white')==='grey'?'white':'grey'})}/>
        </div>
      </>
    );
  };

  // ── Sidebar ───────────────────────────────────────────────
  const SidebarList = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'10px 14px'}}>
        <div style={{fontSize:10,color:C.grey40,marginBottom:4,fontFamily:'var(--font-body)'}}>Template</div>
        {docType?.key==='contract'
          ? <div ref={tplDropRef} style={{position:'relative'}}>
              <div onClick={()=>setTplDropOpen(o=>!o)}
                style={{height:32,border:`1px solid ${tplDropOpen?C.blue:C.grey30}`,borderRadius:6,fontSize:12,padding:'0 10px',background:C.white,color:C.black,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',gap:6,userSelect:'none'}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{templates.find(t=>t.id===activeTplId)?.name||'Contract template'}</span>
                <FI n={tplDropOpen?'chevron-up':'chevron-down'} sz={10} col={C.grey50}/>
              </div>
              {tplDropOpen && (
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:C.white,border:`1px solid ${C.grey20}`,borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.12)',zIndex:200,overflow:'hidden'}}>
                  {templates.map(t=>(
                    <div key={t.id} onMouseEnter={()=>setHovTpl(t.id)} onMouseLeave={()=>setHovTpl(null)}
                      style={{display:'flex',alignItems:'center',padding:'0 8px 0 10px',height:34,background:hovTpl===t.id||renamingTplId===t.id?C.grey10:'transparent',gap:6}}>
                      {renamingTplId===t.id
                        ? <input autoFocus value={renameTplName} onChange={e=>setRenameTplName(e.target.value)}
                            onKeyDown={e=>{if(e.key==='Enter')commitRename(t.id);if(e.key==='Escape'){setRenamingTplId(null);setRenameTplName('');}}}
                            style={{flex:1,height:24,border:`1px solid ${C.blue}`,borderRadius:4,fontSize:12,padding:'0 6px',fontFamily:'var(--font-body)',outline:'none',minWidth:0}}/>
                        : <div onClick={()=>{setActiveTplId(t.id);setTplDropOpen(false);setShowNewTplInput(false);}}
                            style={{flex:1,display:'flex',alignItems:'center',gap:6,cursor:'pointer',minWidth:0}}>
                            <FI n="check" sz={10} col={t.id===activeTplId?C.blue:'transparent'}/>
                            <span style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
                          </div>
                      }
                      {renamingTplId===t.id
                        ? <div style={{display:'flex',gap:2,flexShrink:0}}>
                            <button onMouseDown={e=>{e.preventDefault();commitRename(t.id);}}
                              style={{width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',background:C.blue,border:'none',cursor:'pointer',borderRadius:4}}>
                              <FI n="check" sz={11} col="#fff"/>
                            </button>
                            <button onMouseDown={e=>{e.preventDefault();setRenamingTplId(null);setRenameTplName('');}}
                              style={{width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:`1px solid ${C.grey30}`,cursor:'pointer',borderRadius:4}}>
                              <FI n="xmark" sz={11} col={C.grey50}/>
                            </button>
                          </div>
                        : <div style={{display:'flex',gap:2,opacity:hovTpl===t.id?1:0,transition:'opacity 100ms',flexShrink:0}}>
                            <button onClick={e=>{e.stopPropagation();setRenamingTplId(t.id);setRenameTplName(t.name);}}
                              style={{width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',borderRadius:4}}>
                              <FI n="pencil" sz={11} col={C.grey50}/>
                            </button>
                            {templates.length>1&&(
                              <button onClick={e=>{e.stopPropagation();const remaining=templates.filter(x=>x.id!==t.id);setTemplates(remaining);if(activeTplId===t.id)setActiveTplId(remaining[0].id);}}
                                style={{width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',borderRadius:4}}>
                                <FI n="trash" sz={11} col={C.grey50}/>
                              </button>
                            )}
                          </div>
                      }
                    </div>
                  ))}
                  <div style={{borderTop:`1px solid ${C.grey20}`,padding:'4px 0'}}>
                    {showNewTplInput
                      ? <div style={{padding:'8px'}}>
                          <input autoFocus value={newTplName} onChange={e=>setNewTplName(e.target.value)}
                            onKeyDown={e=>{
                              if(e.key==='Enter'&&newTplName.trim()){const id='tpl'+Date.now();setTemplates(p=>[...p,{id,name:newTplName.trim()}]);setActiveTplId(id);setNewTplName('');setShowNewTplInput(false);setTplDropOpen(false);}
                              if(e.key==='Escape'){setNewTplName('');setShowNewTplInput(false);}
                            }}
                            placeholder="Template name"
                            style={{display:'block',width:'100%',height:30,border:`1px solid ${C.grey30}`,borderRadius:5,fontSize:12,padding:'0 8px',fontFamily:'var(--font-body)',outline:'none',boxSizing:'border-box',marginBottom:6}}/>
                          <button onClick={()=>{if(newTplName.trim()){const id='tpl'+Date.now();setTemplates(p=>[...p,{id,name:newTplName.trim()}]);setActiveTplId(id);setNewTplName('');setShowNewTplInput(false);setTplDropOpen(false);}}}
                            style={{display:'block',width:'100%',height:30,background:newTplName.trim()?C.blue:C.grey20,color:newTplName.trim()?'#fff':C.grey50,border:'none',borderRadius:5,fontSize:12,cursor:newTplName.trim()?'pointer':'default',fontFamily:'var(--font-body)',fontWeight:600,transition:'background 150ms'}}>Create</button>
                        </div>
                      : <div onClick={()=>setShowNewTplInput(true)}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'0 10px',height:34,cursor:'pointer',color:C.blue,fontSize:12,fontFamily:'var(--font-body)'}}>
                          <FI n="plus" sz={10} col={C.blue}/>
                          <span>New template</span>
                        </div>
                    }
                  </div>
                </div>
              )}
            </div>
          : <div style={{height:32,border:`1px solid ${C.grey20}`,borderRadius:6,fontSize:12,padding:'0 10px',background:C.grey10,color:C.grey50,fontFamily:'var(--font-body)',display:'flex',alignItems:'center'}}>
              {(docType?.label||'Invoice')+' template'}
            </div>
        }
      </div>
      <div style={{borderBottom:`1px solid ${C.grey20}`}}/>
      <div style={{flex:1,overflowY:'auto'}}>
        <div style={{padding:'8px 14px 4px'}}>
          <div style={{fontSize:10,fontWeight:700,color:C.grey50,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'var(--font-body)'}}>Sections</div>
        </div>
        {!editing&&<div style={{padding:'2px 14px 6px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:C.blue5,border:`1px solid ${C.blue30}`,borderRadius:6}}>
            <FI n="circle-info" sz={13} col={C.blue}/>
            <span style={{fontSize:12,color:C.grey60,fontFamily:'var(--font-body)',lineHeight:1.4}}>Click on a section name to edit and configure its content.</span>
          </div>
        </div>}
        {sections.map((s,idx)=>{
          const locked=s.id==='header'||s.id==='footer';
          return (
          <React.Fragment key={s.id}>
          {!locked&&dragOverSec===idx&&<div style={{height:2,background:C.blue,borderRadius:1,margin:'1px 8px'}}/>}
          <div {...(!locked&&{draggable:true,onDragStart:e=>onDragStart(e,idx),onDragOver:e=>onSecDragOver(e,idx),onDrop:e=>onDrop(e,idx),onDragEnd:onSecDragEnd})}
            onMouseEnter={()=>setHovSec(s.id)} onMouseLeave={()=>setHovSec(null)}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 8px 0 14px',
              background:hovSec===s.id?C.grey10:'transparent',borderLeft:`3px solid ${!locked&&hovSec===s.id?C.blue:'transparent'}`,
              transition:'background 100ms,border-color 100ms',minHeight:36}}>
              <div onClick={()=>setEditing(s.id)} style={{flex:1,display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'8px 0'}}>
                <span style={{fontSize:13,color:C.black,fontFamily:'var(--font-body)'}}>{s.label}</span>
              </div>
              <div style={{display:'flex',gap:3,alignItems:'center'}}>
                <button onClick={e=>{e.stopPropagation();toggleSection(s.id);}}
                  style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:'1px solid transparent',borderRadius:6,cursor:'pointer',opacity:s.visible?(hovSec===s.id?1:0):1,transition:'opacity 150ms'}}>
                  <FI n={s.visible?'eye':'eye-slash'} sz={12} col={s.visible?C.grey60:C.grey50}/>
                </button>
                {!locked&&<div style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.grey30}`,borderRadius:6,cursor:'grab',opacity:hovSec===s.id?1:0,transition:'opacity 150ms'}}>
                  <FI n="grip-lines" sz={12} col={C.grey50}/>
                </div>}
              </div>
            </div>
          </div>
          </React.Fragment>
          );
        })}
      </div>
      <div style={{padding:'0 14px 10px'}}>
        <button onClick={()=>{const nb={id:nextId(),type:'text',label:'Text section',visible:true};setSections(p=>{const a=[...p];const li=a.findIndex(s=>s.id==='lineitems');a.splice(li>=0?li+1:a.length,0,nb);return a;});setTimeout(()=>{setEditing(nb.id);const el=sectionRefs.current[nb.id];if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});},80);}}
          style={{width:'100%',height:34,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,
            cursor:'pointer',fontSize:13,color:C.grey60,fontFamily:'var(--font-body)',
            fontWeight:500,transition:'background 100ms,border-color 100ms'}}>
          <FI n="plus" sz={12} col={C.grey60}/> Add text section
        </button>
      </div>
      <div style={{padding:'10px 14px',borderTop:`1px solid ${C.grey20}`,display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:C.grey60,fontFamily:'var(--font-body)',flex:'0 0 62px'}}>Font</span>
          <select value={docCfg.font} onChange={e=>setDoc('font',e.target.value)}
            style={{flex:1,height:28,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,padding:'0 6px',background:C.white,fontFamily:'var(--font-body)',cursor:'pointer',color:C.black}}>
            {['Inter','Helvetica','Georgia','Garamond','Courier'].map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:C.grey60,fontFamily:'var(--font-body)',flex:'0 0 62px'}}>Page size</span>
          <select value={pageSize} onChange={e=>setPageSize(e.target.value)}
            style={{flex:1,height:28,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,padding:'0 6px',background:C.white,fontFamily:'var(--font-body)',cursor:'pointer',color:C.black}}>
            {['A4','Letter','Legal','A5'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={()=>setEditing('__settings__')}
          style={{width:'100%',height:34,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            background:editing==='__settings__'?C.blue5:C.white,border:`1px solid ${editing==='__settings__'?C.blue:C.grey30}`,borderRadius:6,
            cursor:'pointer',fontSize:12,color:editing==='__settings__'?C.blue:C.grey50,fontFamily:'var(--font-body)',
            fontWeight:500,transition:'background 100ms,border-color 100ms,color 100ms'}}>
          <FI n="gear" sz={11} col={editing==='__settings__'?C.blue:C.grey50}/> Settings
        </button>
      </div>
    </div>
  );

  const SidebarSection = () => {
    if(editing==='__settings__') return <SettingsPanel/>;
    const sec=sections.find(s=>s.id===editing);
    const isText=sec?.type==='text';
    const label=sec?.label||'';
    return (
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <div style={{padding:'0 14px',borderBottom:`1px solid ${C.grey20}`}}>
          <button onClick={()=>setEditing(null)}
            style={{height:40,display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:C.grey50,fontSize:12,fontFamily:'var(--font-body)',padding:0}}>
            <FI n="chevron-left" sz={10} col={C.grey50}/> {label}
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'4px 14px 7px'}}>
          {isText?TextSectionPanel({id:editing}):(sectionPanels[editing]||null)}
        </div>
        {isText&&(
          <div style={{padding:'12px 14px',borderTop:`1px solid ${C.grey20}`}}>
            <button onClick={()=>{setSections(p=>p.filter(s=>s.id!==editing));setEditing(null);}}
              style={{width:'100%',height:32,background:C.red,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <FI n="trash" sz={11} col="#fff"/> Remove text section
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Preview ───────────────────────────────────────────────
  const SectionWrap = ({id,label,children}) => {
    const sec=sections.find(s=>s.id===id);
    const vis=sec?.visible??true;
    const isHov=isEdit&&hovPrev===id;
    const isHighlighted=isEdit&&(hovPrev===id||hovSec===id);
    const isActive=isEdit&&editing===id;
    return (
      <div ref={el => { sectionRefs.current[id] = el; }} style={{position:'relative'}} onMouseEnter={()=>isEdit&&setHovPrev(id)} onMouseLeave={()=>isEdit&&setHovPrev(null)}>
        {isHov&&(
          <div style={{position:'absolute',top:-11,left:'50%',transform:'translateX(-50%)',zIndex:20}}>
            <div onClick={e=>{e.stopPropagation();setAddModal({afterId:id,position:'above'});}}
              style={{height:20,padding:'0 10px',background:C.blue,color:'#fff',borderRadius:10,fontSize:10,fontWeight:600,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',gap:4,cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}>
              <FI n="plus" sz={9} col="#fff"/> Add text section above
            </div>
          </div>
        )}
        <div onClick={()=>isEdit&&setEditing(id)}
          style={{cursor:isEdit?'pointer':'default',position:'relative',display:vis?'block':'none'}}>
          {isActive&&(
            <div style={{position:'absolute',top:3,bottom:3,left:14,right:14,border:`2px solid ${C.blue}`,borderRadius:3,pointerEvents:'none',zIndex:2}}/>
          )}
          {isHighlighted&&!isActive&&(
            <div style={{position:'absolute',top:3,bottom:3,left:14,right:14,border:`1px dashed ${C.grey40}`,borderRadius:3,pointerEvents:'none',zIndex:2}}/>
          )}
          {(isHov||isActive)&&(
            <div style={{position:'absolute',top:4,right:4,zIndex:10,display:'flex',gap:4}}>
              {!vis&&<div style={{height:20,padding:'0 7px',background:C.grey40,borderRadius:4,display:'flex',alignItems:'center',gap:4,color:'#fff',fontSize:9,fontWeight:600,fontFamily:'var(--font-body)'}}>
                <FI n="eye-slash" sz={9} col="#fff"/> Hidden
              </div>}
              <div style={{height:22,padding:'0 8px',background:C.blue,borderRadius:4,display:'flex',alignItems:'center',gap:5,color:'#fff',fontSize:10,fontWeight:600,fontFamily:'var(--font-body)',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}>
                <FI n="pen" sz={9} col="#fff"/> {label}
              </div>
            </div>
          )}
          {children}
        </div>
        {isHov&&(
          <div style={{position:'absolute',bottom:-11,left:'50%',transform:'translateX(-50%)',zIndex:20}}>
            <div onClick={e=>{e.stopPropagation();setAddModal({afterId:id,position:'below'});}}
              style={{height:20,padding:'0 10px',background:C.blue,color:'#fff',borderRadius:10,fontSize:10,fontWeight:600,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',gap:4,cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}>
              <FI n="plus" sz={9} col="#fff"/> Add text section below
            </div>
          </div>
        )}
      </div>
    );
  };

  // Visible line item columns in order
  const visLICols = lineItems.filter(i=>i.on&&!i.special&&COL_DATA[i.id]);
  const liRows = [
    {name:'Tripod & Head',     sku:'TRP-02',  qty:'1', period:'7 days', unit_price:'$49',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$7',  price_total:'$56',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Memory Cards',      sku:'MEM-04',  qty:'4', period:'7 days', unit_price:'$12',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$7',  price_total:'$55',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Prime Lens 85mm',   sku:'LNS-85',  qty:'1', period:'7 days', unit_price:'$59',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$9',  price_total:'$68',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Canon EOS R5',      sku:'R5-001',  qty:'1', period:'7 days', unit_price:'$149', charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$22', price_total:'$171', item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img', bundleKit:'Camera Bundle Kit'},
    {name:'Lens 50mm',         sku:'LNS-02',  qty:'1', period:'7 days', unit_price:'$29',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$4',  price_total:'$33',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img', bundleKit:'Camera Bundle Kit'},
    {name:'Zoom Lens 24-70mm', sku:'LNS-24',  qty:'1', period:'7 days', unit_price:'$79',  charge_lbl:'1 day',  discount:'10%', coupons:'—', tax:'$10', price_total:'$81',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'LED Panel 600',     sku:'LED-600', qty:'3', period:'7 days', unit_price:'$35',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$15', price_total:'$120', item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Softbox Kit',       sku:'SBX-02',  qty:'2', period:'7 days', unit_price:'$25',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$7',  price_total:'$57',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Audio Recorder',    sku:'AUD-07',  qty:'1', period:'7 days', unit_price:'$45',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$7',  price_total:'$52',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Boom Pole & Mic',   sku:'MIC-03',  qty:'1', period:'7 days', unit_price:'$29',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$4',  price_total:'$33',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'C-Stand Set (×4)',  sku:'CST-04',  qty:'4', period:'7 days', unit_price:'$15',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$9',  price_total:'$69',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Sandbags (×10)',    sku:'SND-10',  qty:'1', period:'7 days', unit_price:'$18',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$3',  price_total:'$21',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Apple Boxes (×6)',  sku:'APL-06',  qty:'1', period:'7 days', unit_price:'$12',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$2',  price_total:'$14',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:"Director's Monitor 7\"", sku:'MON-7',  qty:'1', period:'7 days', unit_price:'$55',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$8',  price_total:'$63',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Follow Focus System', sku:'FF-01',   qty:'1', period:'7 days', unit_price:'$45',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$7',  price_total:'$52',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'V-Mount Battery',    sku:'BAT-VM',  qty:'2', period:'7 days', unit_price:'$35',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$10', price_total:'$80',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Dual Battery Charger', sku:'CHR-02', qty:'1', period:'7 days', unit_price:'$25',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$4',  price_total:'$29',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Backdrop White',     sku:'BKD-W1',  qty:'1', period:'7 days', unit_price:'$18',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$3',  price_total:'$21',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Backdrop Black',     sku:'BKD-B1',  qty:'1', period:'7 days', unit_price:'$18',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$3',  price_total:'$21',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Reflector 5-in-1',   sku:'RFL-05',  qty:'2', period:'7 days', unit_price:'$15',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$4',  price_total:'$34',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Color Gels Set',     sku:'GEL-01',  qty:'1', period:'7 days', unit_price:'$22',  charge_lbl:'Fixed',  discount:'5%',  coupons:'—', tax:'$3',  price_total:'$24',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Pelican Case 1510',  sku:'PLC-15',  qty:'1', period:'7 days', unit_price:'$20',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$3',  price_total:'$23',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
  ];
  const _amt = s => parseFloat((s||'0').replace(/[^0-9.]/g,''))||0;
  const liSubtotal = liRows.reduce((s,r)=>s+_amt(r.unit_price)*_amt(r.qty),0);
  const liTax      = liRows.reduce((s,r)=>s+_amt(r.tax),0);
  const liDiscount = liRows.reduce((s,r)=>{
    if(!r.discount||r.discount==='—')return s;
    return s+_amt(r.unit_price)*_amt(r.qty)*(parseFloat(r.discount)/100);
  },0);
  const liTotal = liSubtotal - liDiscount + liTax;
  const fmtAmt = n=>'$'+Math.round(n);

  // ── Visual column renderers ───────────────────────────────
  const _piByName = (name) => {
    if (/canon|eos|r5|camera/i.test(name)) return _PI.camera;
    if (/zoom lens|prime lens|lens/i.test(name)) return _PI.lensL;
    if (/tripod/i.test(name)) return _PI.tripod;
    if (/memory|card/i.test(name)) return _PI.memCards;
    if (/led|panel/i.test(name)) return _PI.ledPanel;
    if (/softbox/i.test(name)) return _PI.softbox;
    if (/audio|recorder/i.test(name)) return _PI.audioRec;
    if (/boom|mic/i.test(name)) return _PI.boomMic;
    if (/c-stand|stand/i.test(name)) return _PI.cStand;
    if (/sandbag/i.test(name)) return _PI.sandbag;
    if (/apple box/i.test(name)) return _PI.appleBoxes;
    if (/backdrop/i.test(name)) return /black/i.test(name) ? _PI.backdropB : _PI.backdropW;
    if (/reflector/i.test(name)) return _PI.reflector;
    if (/gel/i.test(name)) return _PI.colorGels;
    if (/battery/i.test(name)) return _PI.vBattery;
    if (/charger|cable/i.test(name)) return _PI.charger;
    if (/monitor/i.test(name)) return _PI.monitor;
    if (/follow focus/i.test(name)) return _PI.followFocus;
    if (/pelican|case/i.test(name)) return _PI.pelicanCase;
    return _PI.fallback;
  };
  const ProductImage = ({name, sku, size}) => {
    const sz = size==='Small'?18:size==='Large'?32:24;
    const st = {width:sz,height:sz,display:'inline-block',verticalAlign:'middle',flexShrink:0};
    const content = _SKU_PI[sku] || _piByName(name);
    return <svg style={st} viewBox="0 0 32 32">{content}</svg>;
  };

  const BarcodeImg = ({sku}) => {
    const w=54, h=15;
    let seed=(sku||'X').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
    const next=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
    const segs=Array.from({length:46},(_,i)=>({dark:i%2===0,wt:i%2===0?(next()>.52?2:1):(next()>.6?2:1)}));
    const total=segs.reduce((a,s)=>a+s.wt,0);
    const sc=w/total;
    const bars=[];
    segs.reduce((x,s)=>{ if(s.dark) bars.push({x:x*sc,w:s.wt*sc}); return x+s.wt; },0);
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'inline-block',verticalAlign:'middle'}}>
        <rect width={w} height={h} fill="white"/>
        {bars.map((b,i)=><rect key={i} x={b.x.toFixed(2)} y={0} width={Math.max(.5,b.w).toFixed(2)} height={h*.88} fill="#111"/>)}
      </svg>
    );
  };

  const QRImg = ({sku}) => {
    const sz=22, N=11;
    const grid=Array.from({length:N},()=>Array(N).fill(0));
    const sf=(r0,c0)=>{
      for(let r=r0;r<r0+5;r++) for(let c=c0;c<c0+5;c++){
        grid[r][c]=(r===r0||r===r0+4||c===c0||c===c0+4||(r===r0+2&&c===c0+2))?1:0;
      }
    };
    sf(0,0); sf(0,N-5); sf(N-5,0);
    let seed=(sku||'X').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,13);
    const next=()=>{ seed=(seed*1664525+1013904223)>>>0; return (seed>>16)&1; };
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      if((r<5&&c<5)||(r<5&&c>=N-5)||(r>=N-5&&c<5)) continue;
      grid[r][c]=next();
    }
    const cs=sz/N;
    return (
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{display:'inline-block',verticalAlign:'middle'}}>
        <rect width={sz} height={sz} fill="white"/>
        {grid.flatMap((row,r)=>row.map((cell,c)=>
          cell?<rect key={`${r}-${c}`} x={(c*cs+.2).toFixed(2)} y={(r*cs+.2).toFixed(2)} width={(cs-.4).toFixed(2)} height={(cs-.4).toFixed(2)} fill="#111"/>:null
        ))}
      </svg>
    );
  };

  const renderCell = (col, row) => {
    if(col.id==='image'){
      const sz=lineItems.find(i=>i.id==='image')?.dropdown?.val||'Medium';
      return <div style={{display:'flex',justifyContent:'center'}}><ProductImage name={row.name} sku={row.sku} size={sz}/></div>;
    }
    if(col.id==='barcode') return <div style={{display:'flex',justifyContent:'center'}}><BarcodeImg sku={row.sku}/></div>;
    if(col.id==='qr') return <div style={{display:'flex',justifyContent:'center'}}><QRImg sku={row.sku}/></div>;
    return row[col.id]||'—';
  };

  const DocPreview = () => {
    const totalPages = 2;
    const footerSec = sections.find(s=>s.id==='footer');
    const footerVis = footerSec?.visible ?? true;
    const hasFooterContent = footerVis && (docCfg.footerCompanyDetails||docCfg.footerContactDetails||docCfg.footerVatNumber||docCfg.footerPaymentDetails);
    const hasPageNumbers = footerVis && docCfg.footerPageNumbers;

    // Lightweight wrapper for footer-linked elements (no add-section buttons)
    const FooterWrap = ({children}) => {
      const isActive = isEdit && editing==='footer';
      const isHighlighted = isEdit && (hovPrev==='footer'||hovSec==='footer');
      return (
        <div ref={el => { if (el) sectionRefs.current['footer'] = el; }} onClick={()=>isEdit&&setEditing('footer')}
          onMouseEnter={()=>isEdit&&setHovPrev('footer')}
          onMouseLeave={()=>isEdit&&setHovPrev(null)}
          style={{position:'relative',cursor:isEdit?'pointer':'default',opacity:footerVis?1:0.22,transition:'opacity 200ms'}}>
          {isActive&&<div style={{position:'absolute',top:2,bottom:2,left:14,right:14,border:`2px solid ${C.blue}`,borderRadius:3,pointerEvents:'none',zIndex:2}}/>}
          {isHighlighted&&!isActive&&<div style={{position:'absolute',top:2,bottom:2,left:14,right:14,border:`1px dashed ${C.grey40}`,borderRadius:3,pointerEvents:'none',zIndex:2}}/>}
          {(isHighlighted||isActive)&&(
            <div style={{position:'absolute',top:4,right:4,zIndex:10}}>
              <div style={{height:22,padding:'0 8px',background:C.blue,borderRadius:4,display:'flex',alignItems:'center',gap:5,color:'#fff',fontSize:10,fontWeight:600,fontFamily:'var(--font-body)',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}>
                <FI n="pen" sz={9} col="#fff"/> Footer
              </div>
            </div>
          )}
          {children}
        </div>
      );
    };

    const FooterContent = ({page}) => {
      if (!footerVis || (!hasFooterContent && !hasPageNumbers)) return null;
      return (
        <FooterWrap>
          <div style={{padding:'8px 22px',background:C.bg,borderTop:`1px solid ${C.grey20}`,fontSize:8,color:C.grey50,display:'flex',flexDirection:'column',gap:3,borderRadius:'0 0 5px 5px'}}>
            {docCfg.footerCompanyDetails && <div>Acme Rentals Inc. · 123 Main St, Springfield</div>}
            {docCfg.footerContactDetails && <div>hello@acmerentals.com · +1 555 000 1234</div>}
            {docCfg.footerVatNumber && <div>VAT: GB123456789</div>}
            {docCfg.footerPaymentDetails && <div>Payment due within 30 days. IBAN: GB00 BARC 1234 5678 9012 34</div>}
            {hasPageNumbers && <div style={{textAlign:'right'}}>Page {page} of {totalPages}</div>}
          </div>
        </FooterWrap>
      );
    };

    const page2Rows = [
      {name:'Backdrop Set (White)',  sku:'BKD-W',  qty:'1', period:'7 days', unit_price:'$39',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$6',  price_total:'$45',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Backdrop Set (Black)',  sku:'BKD-B',  qty:'1', period:'7 days', unit_price:'$39',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$6',  price_total:'$45',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Backdrop Stand',        sku:'BKS-01', qty:'2', period:'7 days', unit_price:'$19',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$5',  price_total:'$41',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Reflector 5-in-1',      sku:'RFL-05', qty:'2', period:'7 days', unit_price:'$14',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$4',  price_total:'$32',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Color Gels Pack',       sku:'GEL-01', qty:'1', period:'7 days', unit_price:'$9',   charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$1',  price_total:'$10',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'V-Mount Battery ×2',    sku:'BAT-VM', qty:'2', period:'7 days', unit_price:'$22',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$6',  price_total:'$50',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Charger + Cables Kit',  sku:'CHG-01', qty:'1', period:'7 days', unit_price:'$12',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$2',  price_total:'$14',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Production Monitor 7"', sku:'MON-07', qty:'1', period:'7 days', unit_price:'$55',  charge_lbl:'1 day',  discount:'—',   coupons:'—', tax:'$8',  price_total:'$63',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Wireless Follow Focus', sku:'WFF-01', qty:'1', period:'7 days', unit_price:'$69',  charge_lbl:'1 day',  discount:'5%',  coupons:'—', tax:'$9',  price_total:'$74',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
      {name:'Pelican Case (Large)',   sku:'PLC-L',  qty:'2', period:'7 days', unit_price:'$18',  charge_lbl:'Fixed',  discount:'—',   coupons:'—', tax:'$5',  price_total:'$41',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    ];

    const renderSection = s => {
      if(s.id==='header') return (
        <SectionWrap key="header" id="header" label="Header">
          <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${C.grey20}`}}>
            {(() => {
              const align = docCfg.logoAlign || 'Left';
              const logoW = docCfg.logoSize==='S'?44:docCfg.logoSize==='M'?60:80;
              const logoH = docCfg.logoSize==='S'?14:docCfg.logoSize==='M'?18:24;
              const LogoEl = docCfg.showLogo ? (
                <div style={{display:'flex',alignItems:'center',gap:logoH*0.25}}>
                  <svg width={logoH} height={logoH} viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="16" fill="#222"/>
                    <path d="M10 26 C10 18 18 10 26 14 C22 18 20 22 18 26Z" fill="#fff" opacity=".6"/>
                    <path d="M14 28 C14 20 20 14 28 18 C24 22 22 26 18 28Z" fill="#fff" opacity=".4"/>
                  </svg>
                  <span style={{fontSize:logoH*0.45,fontWeight:700,letterSpacing:'0.1em',color:C.black}}>COMPANY</span>
                </div>
              ) : null;
              const InvoiceEl = (
                <div style={{textAlign:align==='Right'?'left':'right'}}>
                  <div style={{fontSize:13,fontWeight:700}}>{(docCfg.documentTitle||'Invoice').toUpperCase()}</div>
                  <div style={{fontSize:9,color:C.grey50}}>#ORD-2024-0089</div>
                </div>
              );
              return (
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                  {align==='Right' ? InvoiceEl : LogoEl}
                  {align==='Right' ? LogoEl : InvoiceEl}
                </div>
              );
            })()}
            {(()=>{
              const labelStyle={fontSize:7,fontWeight:700,color:C.grey40,textTransform:'uppercase',letterSpacing:1,marginBottom:2};
              const sellerEl=(
                <div>
                  {docCfg.showPartyLabels&&<div style={labelStyle}>From</div>}
                  <div style={{fontSize:9,color:C.grey60,lineHeight:1.5}}>
                    Acme Rentals Inc.
                    {docCfg.showCompanyInfo&&<><br/>123 Main St, NY 10001<br/>VAT: US123456789</>}
                    {docCfg.showContact&&<><br/>info@acme.com · +1 555 123 4567<br/>www.acmerentals.com</>}
                  </div>
                </div>
              );
              const customerEl=(
                <div>
                  {docCfg.showPartyLabels&&<div style={labelStyle}>Bill to</div>}
                  <div style={{fontSize:9,color:C.grey60,lineHeight:1.5}}>Sarah Johnson<br/>456 Oak Ave, NY 10002</div>
                </div>
              );
              const [left,right]=docCfg.partyOrder==='customer-first'?[customerEl,sellerEl]:[sellerEl,customerEl];
              return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{left}{right}</div>;
            })()}
          </div>
        </SectionWrap>
      );
      if(s.id==='logistics') return (
        <SectionWrap key="logistics" id="logistics" label="Pick-up & Return">
          <div style={{padding:'8px 22px',background:C.bg,display:'flex',gap:18,borderBottom:`1px solid ${C.grey20}`}}>
            {[['Pickup','Mar 5, 2024'],['Return','Mar 12, 2024']].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:7,fontWeight:700,color:C.grey40,textTransform:'uppercase',letterSpacing:1}}>{l}</div>
                <div style={{fontSize:8,color:C.black,marginTop:1,display:'flex',gap:4,alignItems:'baseline'}}>
                  {docCfg.showDates&&<span>{v}{dateFormat==='datetime'&&' 10:00'}</span>}
                  {docCfg.showLocation&&<span style={{color:C.grey60}}>Main location</span>}
                </div>
                {docCfg.showLocation&&docCfg.showAddress&&<div style={{fontSize:7,color:C.grey60,marginTop:1}}>123 Main St, NY 10001</div>}
              </div>
            ))}
          </div>
        </SectionWrap>
      );
      if(s.id==='lineitems') return (
        <SectionWrap key="lineitems" id="lineitems" label="Line Items">
          <div style={{padding:'8px 22px 12px',overflowX:'auto'}}>
            {visLICols.length===0 ? (
              <div style={{padding:'12px 0',textAlign:'center',fontSize:10,color:C.grey40,fontFamily:'var(--font-body)'}}>No columns enabled</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
                <thead><tr style={{borderBottom:`2px solid ${docCfg.primaryColor}`}}>
                  {visLICols.map(col=>(
                    <th key={col.id} style={{padding:'3px 4px',fontSize:7,fontWeight:700,color:docCfg.primaryColor,textTransform:'uppercase',letterSpacing:1,
                      textAlign:COL_DATA[col.id]?.align||'right',whiteSpace:'nowrap',
                      width:COL_DATA[col.id]?.width||undefined,
                      background:col.id===hovLI?C.blue5:'transparent',transition:'background 100ms'}}>
                      {COL_DATA[col.id]?.label||col.label}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {(()=>{
                    if(!bundleItem?.on) return liRows.map((row,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.grey20}`}}>
                        {visLICols.map((col,ci)=>(
                          <td key={col.id} style={{padding:col.id==='image'?'2px 4px':'4px',fontSize:8,
                            color:COL_DATA[col.id]?.align==='left'?C.black:C.grey60,
                            textAlign:COL_DATA[col.id]?.align||'right',
                            whiteSpace:['image','barcode','qr'].includes(col.id)?'normal':'nowrap',
                            background:col.id===hovLI?C.blue5:'transparent',transition:'background 100ms'}}>
                            {renderCell(col,row)}
                          </td>
                        ))}
                      </tr>
                    ));
                    // Collect all items per bundle kit for totals
                    const kitAllRows={};
                    liRows.forEach(row=>{ if(row.bundleKit)(kitAllRows[row.bundleKit]=kitAllRows[row.bundleKit]||[]).push(row); });
                    const rendered=new Set();
                    const els=[];
                    liRows.forEach((row,ri)=>{
                      if(!row.bundleKit){
                        els.push(
                          <tr key={`r${ri}`} style={{borderBottom:`1px solid ${C.grey20}`}}>
                            {visLICols.map((col,ci)=>(
                              <td key={col.id} style={{padding:col.id==='image'?'2px 4px':'4px',fontSize:8,
                                color:COL_DATA[col.id]?.align==='left'?C.black:C.grey60,
                                textAlign:COL_DATA[col.id]?.align||'right',
                                whiteSpace:['image','barcode','qr'].includes(col.id)?'normal':'nowrap',
                                background:col.id===hovLI?C.blue5:'transparent',transition:'background 100ms'}}>
                                {renderCell(col,row)}
                              </td>
                            ))}
                          </tr>
                        );
                      } else if(!rendered.has(row.bundleKit)){
                        rendered.add(row.bundleKit);
                        const kitName=row.bundleKit;
                        const kitRows=kitAllRows[kitName];
                        const tp=kitRows.reduce((s,r)=>s+parseFloat(r.price_total.replace(/[^0-9.]/g,'')||0),0);
                        const tt=kitRows.reduce((s,r)=>s+parseFloat((r.tax||'').replace(/[^0-9.]/g,'')||0),0);
                        const tr_=kitRows.reduce((s,r)=>s+parseFloat((r.unit_price||'').replace(/[^0-9.]/g,'')||0),0);
                        // Header label
                        els.push(
                          <tr key={`bh-${kitName}`}>
                            <td colSpan={visLICols.length} style={{padding:'8px 4px 3px',fontSize:6.5,fontWeight:600,color:C.grey40,letterSpacing:.6,textTransform:'uppercase'}}>
                              {kitName}
                            </td>
                          </tr>
                        );
                        // Bundle items
                        kitRows.forEach((krow,ki)=>els.push(
                          <tr key={`bi-${kitName}-${ki}`} style={{borderBottom:`1px solid ${C.grey20}`}}>
                            {visLICols.map((col,ci)=>(
                              <td key={col.id} style={{padding:col.id==='image'?'2px 4px':'3px 4px',fontSize:7.5,
                                color:COL_DATA[col.id]?.align==='left'?C.grey60:C.grey50,
                                textAlign:COL_DATA[col.id]?.align||'right',
                                whiteSpace:['image','barcode','qr'].includes(col.id)?'normal':'nowrap',
                                background:col.id===hovLI?C.blue5:'transparent',transition:'background 100ms',
                                ...(ci===0?{boxShadow:`inset 2px 0 0 ${C.grey30}`}:{})}}>
                                {renderCell(col,krow)}
                              </td>
                            ))}
                          </tr>
                        ));
                        // Kit total
                        els.push(
                          <tr key={`bt-${kitName}`} style={{borderBottom:`1px solid ${C.grey20}`}}>
                            {visLICols.map((col,ci)=>(
                              <td key={col.id} style={{padding:'3px 4px 5px',
                                fontSize:ci===0?6.5:8,fontWeight:ci===0?600:600,
                                color:C.grey40,
                                letterSpacing:ci===0?.6:0,
                                textTransform:ci===0?'uppercase':'none',
                                textAlign:ci===0?'left':COL_DATA[col.id]?.align||'right',
                                whiteSpace:'nowrap',
                                borderTop:`1px solid ${C.grey30}`,
                                background:col.id===hovLI?C.blue5:'transparent',transition:'background 100ms'}}>
                                {ci===0?'Kit total':col.id==='price_total'?`$${tp}`:col.id==='tax'?`$${tt}`:col.id==='unit_price'?`$${tr_}`:''}
                              </td>
                            ))}
                          </tr>
                        );
                      }
                    });
                    return els;
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </SectionWrap>
      );
      if(s.id==='totals') return (
        <SectionWrap key="totals" id="totals" label="Totals & Fees">
          <div style={{padding:'8px 22px 14px',display:'flex',justifyContent:'flex-end',borderTop:`1px solid ${C.grey20}`}}>
            <div style={{width:140}}>
              {[
                docCfg.showSubtotal        && ['Subtotal',          fmtAmt(liSubtotal),          false],
                docCfg.showTotalDiscount   && ['Total discount',    '-'+fmtAmt(liDiscount),      false],
                docCfg.showAppliedCoupons  && ['Applied coupons',   '-$10',                      false],
                docCfg.showSecurityDeposit && ['Security deposit',  '-$100',                     false],
                docCfg.showCustomCharge    && ['Custom charge',     '$15',                       false],
                docCfg.showTaxBreakdown    && ['Tax (15%)',         fmtAmt(liTax),               false],
                docCfg.showTotalInclTaxes  && ['Total incl. taxes', fmtAmt(liTotal),             true],
              ].filter(Boolean).map(([l,v,bold])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderTop:bold?`1px solid ${C.grey20}`:'none',marginTop:bold?4:0}}>
                  <span style={{fontSize:8,color:bold?C.black:C.grey50,fontWeight:bold?700:400}}>{l}</span>
                  <span style={{fontSize:8,color:bold?C.black:C.grey50,fontWeight:bold?700:400}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionWrap>
      );
      if(s.type==='text'){
        const b=getBlock(s.id);
        const sectionBg = b.bgStyle==='grey' ? C.bg : C.white;
        return (
          <SectionWrap key={s.id} id={s.id} label="Text section">
            <div style={{padding:'10px 22px',borderTop:`1px solid ${C.grey20}`,minHeight:34,background:sectionBg}}>
              {b.html
                ? <div style={{fontSize:9,color:C.black,lineHeight:1.6,fontFamily:'var(--font-body)'}} dangerouslySetInnerHTML={{__html:renderWithChips(b.html)}}/>
                : <div style={{fontSize:9,color:C.grey30,fontStyle:'italic',lineHeight:1.6}}>Empty text section</div>
              }
            </div>
          </SectionWrap>
        );
      }
      return null;
    };

    const liIdx = sections.findIndex(s=>s.id==='lineitems');
    const page1Sections = sections.filter((s,i)=>s.id!=='footer'&&s.id!=='totals'&&(liIdx<0||i<=liIdx));
    const page2UserSections = sections.filter((s,i)=>s.id!=='footer'&&s.id!=='totals'&&s.id!=='lineitems'&&i>liIdx);
    const totalsSec = sections.find(s=>s.id==='totals');

    return (
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {/* Page 1 */}
        <div style={{background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,overflow:'visible',minHeight:pageDim.h,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <div>{page1Sections.map(renderSection)}</div>
          <FooterContent page={1}/>
        </div>
        {/* Page 2 — overflow line items, totals, footer */}
        <div style={{background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,overflow:'visible',minHeight:pageDim.h,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <div>
            {visLICols.length>0&&(sections.find(s=>s.id==='lineitems')?.visible??true)&&(
              <div style={{position:'relative'}}
                onMouseEnter={()=>isEdit&&setHovPrev('lineitems')}
                onMouseLeave={()=>isEdit&&setHovPrev(null)}>
                <div onClick={()=>isEdit&&setEditing('lineitems')}
                  style={{cursor:isEdit?'pointer':'default',position:'relative'}}>
                  {isEdit&&editing==='lineitems'&&(
                    <div style={{position:'absolute',top:3,bottom:3,left:14,right:14,border:`2px solid ${C.blue}`,borderRadius:3,pointerEvents:'none',zIndex:2}}/>
                  )}
                  {isEdit&&(hovPrev==='lineitems'||hovSec==='lineitems')&&editing!=='lineitems'&&(
                    <div style={{position:'absolute',top:3,bottom:3,left:14,right:14,border:`1px dashed ${C.grey40}`,borderRadius:3,pointerEvents:'none',zIndex:2}}/>
                  )}
                  <div style={{padding:'8px 22px 12px',overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <tbody>
                        {page2Rows.map((row,i)=>(
                          <tr key={i} style={{borderBottom:`1px solid ${C.grey20}`}}>
                            {visLICols.map((col,ci)=>(
                              <td key={col.id} style={{padding:col.id==='image'?'2px 4px':'4px',fontSize:8,
                                color:COL_DATA[col.id]?.align==='left'?C.black:C.grey60,
                                textAlign:COL_DATA[col.id]?.align||'right',
                                whiteSpace:['image','barcode','qr'].includes(col.id)?'normal':'nowrap',
                                background:col.id===hovLI?C.blue5:'transparent',transition:'background 100ms'}}>
                                {renderCell(col,row)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {page2UserSections.map(renderSection)}
            {totalsSec&&renderSection(totalsSec)}
          </div>
          <FooterContent page={2}/>
        </div>
      </div>
    );
  };

  if (isPreviewOnly) return (
    <div style={{width:'100%',minHeight:'100vh',background:C.bg,fontFamily:'var(--font-body)',padding:'40px 20px'}}>
      <div style={{width:pageDim.w,margin:'0 auto',transformOrigin:'top center',transform:`scale(${zoom})`}}>
        <DocPreview/>
      </div>
    </div>
  );

  // ── View toolbar — bottom-right, sticky ───────────────────
  const zoomBtnStyle = (disabled) => ({
    width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',
    background:C.white,border:`1px solid ${C.grey20}`,borderRadius:9,
    boxShadow:'0 2px 8px rgba(0,0,0,.10)',cursor:disabled?'default':'pointer',
    opacity:disabled?0.35:1,transition:'opacity 150ms',
  });
  const ViewToolbar = () => (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <button onClick={zoomIn} disabled={zoom>=ZOOM_STEPS[ZOOM_STEPS.length-1]}
        style={zoomBtnStyle(zoom>=ZOOM_STEPS[ZOOM_STEPS.length-1])}>
        <FI n="magnifying-glass-plus" sz={13} col={C.grey60}/>
      </button>
      <button onClick={zoomOut} disabled={zoom<=ZOOM_STEPS[0]}
        style={zoomBtnStyle(zoom<=ZOOM_STEPS[0])}>
        <FI n="magnifying-glass-minus" sz={13} col={C.grey60}/>
      </button>
      <button onClick={()=>setZoom(1)}
        style={zoomBtnStyle(false)}>
        <FI n="rotate-left" sz={13} col={C.grey60}/>
      </button>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100vh',fontFamily:'var(--font-body)',background:C.bg,overflow:'hidden',position:'relative'}}>
      {/* Top bar */}
      <div style={{height:44,background:C.white,borderBottom:`1px solid ${C.grey30}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',flexShrink:0,position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button onClick={onExit} style={{height:30,padding:'0 10px',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,color:C.black,cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-body)'}}>
            <FI n="arrow-left" sz={10} col={C.black}/> Exit
          </button>
        </div>
        <span style={{fontSize:13,fontWeight:600,color:C.black,fontFamily:'var(--font-body)',position:'absolute',left:'50%',transform:'translateX(-50%)'}}>{docType?.key==='contract' ? (templates.find(t=>t.id===activeTplId)?.name||'Contract template') : `${docType?.label||'Invoice'} template`}</span>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>window.open(window.location.href.replace(/\?.*$/,'')+`?preview&dt=${docType?.key||'invoice'}`, '_blank')}
            style={{height:30,padding:'0 12px',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-body)',color:C.black}}>
            <FI n="eye" sz={11} col={C.grey60}/> Preview
          </button>
          <button style={{height:30,padding:'0 16px',background:C.blue,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>Save</button>
        </div>
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Sidebar */}
        <div style={{width:240,background:C.white,borderRight:`1px solid ${C.grey30}`,display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>
          {editing?SidebarSection():SidebarList()}
        </div>

        {/* Preview — outer wrapper holds toolbar fixed, inner div scrolls */}
        <div style={{flex:1,position:'relative',background:C.bg}}>
          <div ref={canvasRef} style={{position:'absolute',inset:0,overflowY:'auto'}}>
            <div style={{padding:'20px 40px 80px',display:'flex',justifyContent:'center',alignItems:'flex-start'}}>
              <div style={{transformOrigin:'top center',transform:`scale(${zoom * viewScale})`,transition:'transform 200ms',width:pageDim.w,flexShrink:0}}>
                <DocPreview/>
              </div>
            </div>
          </div>

          {/* View toolbar — fixed bottom-right of preview, never moves */}
          <div style={{position:'absolute',bottom:24,right:24,zIndex:30}}>
            <ViewToolbar/>
          </div>
        </div>
      </div>

      {/* Reset confirm modal */}
      {resetModal&&(
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.28)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setResetModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:10,padding:24,width:300,boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}>
            <div style={{fontSize:14,fontWeight:700,color:C.black,marginBottom:6,fontFamily:'var(--font-body)'}}>Reset to defaults?</div>
            <div style={{fontSize:12,color:C.grey50,marginBottom:20,lineHeight:1.5,fontFamily:'var(--font-body)'}}>This will restore all template settings to their original defaults. Any customizations will be lost.</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={doReset} style={{flex:1,height:34,background:C.red,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>Reset to defaults</button>
              <button onClick={()=>setResetModal(false)} style={{height:34,padding:'0 14px',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add text section modal */}
      {addModal&&(
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.28)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setAddModal(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:C.white,borderRadius:10,padding:24,width:300,boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}>
            <div style={{fontSize:14,fontWeight:700,color:C.black,marginBottom:6,fontFamily:'var(--font-body)'}}>Add text section</div>
            <div style={{fontSize:12,color:C.grey50,marginBottom:16,lineHeight:1.5,fontFamily:'var(--font-body)'}}>
              Insert a custom text section {addModal.position==='above'?'above':'below'} this section — supports free text, formatting and variables.
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>insertTextSection(addModal.afterId,addModal.position)}
                style={{flex:1,height:34,background:C.blue,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>Add text section</button>
              <button onClick={()=>setAddModal(null)}
                style={{height:34,padding:'0 14px',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Document Type Selector — shown before the editor
// ─────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { key: 'invoice',      label: 'Invoice',      badge: 'Most used', edited: '2 days ago',   desc: 'Sent to customers when a rental is confirmed. Includes line items, pricing, taxes, and payment details.' },
  { key: 'contract',     label: 'Contract',     badge: null,        edited: '1 week ago',   desc: 'Rental agreement presented to customers before pickup. Includes terms, conditions, and signature fields.' },
  { key: 'quote',        label: 'Quote',        badge: null,        edited: '3 weeks ago',  desc: 'Price estimate sent before booking is confirmed. Customers can accept or request changes.' },
  { key: 'packing_slip', label: 'Packing slip', badge: null,        edited: 'Never',        desc: 'Internal document for warehouse staff during pickup and return. Lists items with checkboxes.' },
];

const DocThumb = ({ type }) => {
  const C = BQ;
  const lines = (startY, count, widths) =>
    Array.from({ length: count }, (_, i) => (
      <rect key={i} x={8} y={startY + i * 8} width={widths ? widths[i % widths.length] : (44 - i * 4)} height={3} rx={1.5} fill="#D6D9DB"/>
    ));

  return (
    <svg width={64} height={80} viewBox="0 0 64 80" style={{ flexShrink: 0, borderRadius: 6, border: `1px solid ${C.grey20}`, background: '#fff' }}>
      {type === 'invoice' && <>
        <rect x={8} y={8} width={28} height={6} rx={2} fill={C.blue}/>
        <rect x={8} y={18} width={18} height={3} rx={1.5} fill="#D6D9DB"/>
        {lines(26, 5, [48, 36, 44, 30, 40])}
        <rect x={8} y={68} width={48} height={3} rx={1.5} fill="rgba(19,109,235,0.25)"/>
      </>}
      {type === 'contract' && <>
        <rect x={8} y={8} width={20} height={5} rx={2} fill="#A4A7A8"/>
        {lines(18, 6, [48, 40, 44, 32, 46, 36])}
        <rect x={8} y={68} width={32} height={3} rx={1.5} fill="#D6D9DB"/>
      </>}
      {type === 'quote' && <>
        <rect x={8} y={8} width={24} height={5} rx={2} fill={C.blue}/>
        {lines(18, 3, [48, 36, 44])}
        <rect x={8} y={42} width={48} height={14} rx={3} fill="rgba(19,109,235,0.08)" stroke="rgba(19,109,235,0.2)" strokeWidth={1}/>
        <rect x={12} y={46} width={20} height={3} rx={1.5} fill={C.blue} opacity={0.4}/>
        <rect x={12} y={52} width={14} height={3} rx={1.5} fill={C.blue} opacity={0.3}/>
        {lines(62, 1, [40])}
      </>}
      {type === 'packing_slip' && <>
        <rect x={8} y={8} width={22} height={5} rx={2} fill="#A4A7A8"/>
        {[0,1,2,3].map(i => (
          <React.Fragment key={i}>
            <rect x={8} y={20 + i * 11} width={7} height={7} rx={1.5} fill="none" stroke="#D6D9DB" strokeWidth={1.2}/>
            <rect x={19} y={22 + i * 11} width={36} height={3} rx={1.5} fill="#D6D9DB"/>
          </React.Fragment>
        ))}
      </>}
    </svg>
  );
};

const DocTypeSelector = ({ onSelectDocType }) => {
  const C = BQ;

  const SettingsNavItem = ({ label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '6px 16px', width: '100%', flexShrink: 0, cursor: 'pointer' }}>
      <span style={{ fontSize: 14, lineHeight: '20px', color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );

  const MainNavItem = ({ icon, label, active }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', margin: '0 4px', width: 'calc(100% - 8px)', flexShrink: 0, cursor: 'pointer', background: active ? C.blue5 : 'transparent', borderRadius: 6 }}>
      <i className={`fa-regular fa-${icon}`} style={{ fontSize: 14, color: active ? C.blue : C.grey50, width: 16, textAlign: 'center', flexShrink: 0 }}/>
      <span style={{ fontSize: 14, lineHeight: '20px', color: active ? C.blue : C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );

  const NavDivider = () => (
    <div style={{ height: 1, background: C.grey20, margin: '4px 0', flexShrink: 0 }}/>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', fontFamily: 'var(--font-body)', background: C.bg, overflow: 'hidden' }}>

        {/* Main nav — 188px wide, white, matches actual Booqable sidebar */}
        <div style={{ width: 188, background: C.white, borderRight: `1px solid ${C.grey30}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Logo + collapse */}
            <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 0 16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 0L0 8L3 8L3 16L7 16L7 10L11 10L11 16L15 16L15 8L18 8L9 0Z" fill="#131314"/>
                </svg>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.black, fontFamily: 'var(--font-body)', letterSpacing: '-0.2px' }}>booqable</span>
              </div>
              <i className="fa-regular fa-angles-left" style={{ fontSize: 13, color: C.grey40, cursor: 'pointer' }}/>
            </div>
            <NavDivider/>
            {/* New order */}
            <div style={{ padding: '6px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa-regular fa-plus" style={{ fontSize: 11, color: '#fff' }}/>
                </div>
                <span style={{ fontSize: 14, lineHeight: '20px', color: C.blue, fontFamily: 'var(--font-body)', fontWeight: 600 }}>New order</span>
              </div>
            </div>
            <NavDivider/>
            <MainNavItem icon="gauge" label="Dashboard"/>
            <MainNavItem icon="calendar" label="Calendar"/>
            <NavDivider/>
            <MainNavItem icon="receipt" label="Orders"/>
            <MainNavItem icon="user" label="Customers"/>
            <MainNavItem icon="box" label="Inventory"/>
            <MainNavItem icon="file-lines" label="Documents"/>
            <NavDivider/>
            <MainNavItem icon="store" label="Online store"/>
            <MainNavItem icon="puzzle-piece" label="App store"/>
            <NavDivider/>
            <MainNavItem icon="chart-bar" label="Reports"/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: 8 }}>
            <MainNavItem icon="barcode" label="Scan a barcode"/>
            <MainNavItem icon="circle-question" label="Help"/>
            <MainNavItem icon="gear" label="Settings" active/>
            <NavDivider/>
            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', margin: '0 4px', cursor: 'pointer' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#4FAE8C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', letterSpacing: '0.2px' }}>AD</span>
                <div style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, borderRadius: '50%', background: '#E51C2C', border: '1.5px solid #fff' }}/>
              </div>
              <span style={{ fontSize: 14, lineHeight: '20px', color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Andrej D</span>
            </div>
          </div>
        </div>

        {/* Settings menu — 220px, #edf1f5 background */}
        <div style={{ width: 220, background: C.bg, borderRight: `1px solid ${C.grey30}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          {/* Back office */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 6px', flexShrink: 0 }}>
            <span style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600, color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Back office</span>
          </div>
          <div style={{ borderBottom: `1px solid ${C.grey30}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 16, flexShrink: 0 }}>
            {['General','Pricing','Taxes','Rental period','Payment providers','Custom fields','Locations','Emails'].map(l => <SettingsNavItem key={l} label={l}/>)}
            {/* Documents — active, expanded with 3 sub-items */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 8, width: '100%', flexShrink: 0 }}>
              <div style={{ background: '#DDEBFF', borderLeft: `2px solid ${C.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', width: '100%', flexShrink: 0 }}>
                <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 700, color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flex: 1 }}>Documents</span>
              </div>
              {/* Document templates — active sub-item */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '5px 16px 5px 32px', width: '100%', flexShrink: 0, cursor: 'pointer', background: C.blue5 }}>
                <span style={{ fontSize: 14, lineHeight: '20px', color: C.blue, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', fontWeight: 600 }}>Document templates</span>
              </div>
            </div>
            {['Translations','Security','Account and billing'].map(l => <SettingsNavItem key={l} label={l}/>)}
          </div>
          {/* Online bookings */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 6px', flexShrink: 0 }}>
            <span style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600, color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Online bookings</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 16, flexShrink: 0 }}>
            {['Overview','Booking page','Website builder','Website integration','Preferences','Pickup and delivery','Checkout','SEO'].map(l => <SettingsNavItem key={l} label={l}/>)}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, background: C.bg, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Breadcrumb header */}
          <div style={{ height: 56, background: C.white, borderBottom: `1px solid ${C.grey30}`, display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, lineHeight: '28px', color: C.grey50, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Settings</span>
              <i className="fa-regular fa-chevron-right" style={{ fontSize: 16, lineHeight: '24px', color: C.grey50 }}/>
              <span style={{ fontSize: 22, lineHeight: '28px', color: C.grey50, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Back office</span>
              <i className="fa-regular fa-chevron-right" style={{ fontSize: 16, lineHeight: '24px', color: C.grey50 }}/>
              <span style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Documents</span>
            </div>
          </div>
          <div style={{ borderBottom: `1px solid ${C.grey30}`, display: 'flex', gap: 24, alignItems: 'flex-start', padding: 24 }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start', flexShrink: 1, width: 260, minWidth: 180 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              <span style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600, color: C.black, fontFamily: 'var(--font-body)' }}>Document templates</span>
              {/* Video card */}
              <div style={{ height: 88, position: 'relative', width: '100%' }}>
                <div style={{ position: 'absolute', background: C.white, height: 72, left: 0, right: 0, top: 16, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'relative', border: `1px solid ${C.grey30}`, borderRadius: 4, overflow: 'hidden', margin: 8, width: 80, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.grey10 }}>
                    <div style={{ background: '#E51C2C', borderRadius: 6, width: 32, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 1px 24px rgba(0,0,0,0.1)' }}>
                      <i className="fa-solid fa-play" style={{ fontSize: 12, color: '#fff', lineHeight: '16px' }}/>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: C.black, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Customizing your documents</span>
                    <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: C.blue, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', cursor: 'pointer' }}>Watch video</span>
                  </div>
                </div>
              </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', width: '100%' }}>
                <span style={{ fontSize: 14, lineHeight: '20px', color: C.grey50, fontFamily: 'var(--font-body)' }}>Tailor the content and appearance of documents sent to your customers. For full control, add custom CSS to override the default styles.</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: C.blue, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', cursor: 'pointer' }}>Learn more</span>
                  <i className="fa-regular fa-arrow-up-right-from-square" style={{ fontSize: 12, color: C.blue }}/>
                </div>
              </div>
            </div>
            {/* Right column — 2×2 card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, alignContent: 'start' }}>
              {DOC_TYPES.map(dt => {
                const [btnHov, setBtnHov] = React.useState(false);
                return (
                  <div key={dt.key}
                    style={{
                      background: C.white,
                      border: `1.5px solid ${C.grey20}`,
                      borderRadius: 10,
                      padding: '14px 16px',
                      display: 'flex',
                      gap: 14,
                    }}>
                    {/* Card content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.black, fontFamily: 'var(--font-body)' }}>{dt.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.grey50, lineHeight: 1.55, fontFamily: 'var(--font-body)', margin: 0 }}>{dt.desc}</p>
                      <div style={{ marginTop: 6 }}>
                        <button onClick={() => onSelectDocType(dt)}
                          onMouseEnter={() => setBtnHov(true)}
                          onMouseLeave={() => setBtnHov(false)}
                          style={{ height: 34, padding: '0 16px', background: btnHov ? '#EBEBEB' : C.white, color: C.black, border: `1px solid ${C.grey20}`, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 150ms', whiteSpace: 'nowrap' }}>
                          Edit {dt.label.toLowerCase()} template
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Root App — manages selector ↔ editor navigation
// ─────────────────────────────────────────────────────────────

const App = () => {
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.has('preview');

  const [screen, setScreen] = React.useState('selector');
  const [docType, setDocType] = React.useState(null);

  if (isPreview) {
    const dtKey = params.get('dt') || 'invoice';
    const dtLabels = {invoice:'Invoice',quote:'Quote',contract:'Contract',packing_slip:'Packing Slip'};
    return <ExpN onExit={()=>{}} docType={{key:dtKey,label:dtLabels[dtKey]||'Invoice'}} isPreviewOnly={true}/>;
  }

  if (screen === 'editor') {
    return <ExpN onExit={() => setScreen('selector')} docType={docType} />;
  }

  return (
    <DocTypeSelector
      onSelectDocType={dt => { setDocType(dt); setScreen('editor'); }}
    />
  );
};
