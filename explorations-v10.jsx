
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

const ExpN = () => {
  const C = BQ;
  const _nid = React.useRef(600);
  const nextId = () => String(++_nid.current);

  // ── Line items ────────────────────────────────────────────
  const [lineItems, setLineItems] = React.useState([
    { id:'image',       label:'Image',                                  drag:true,  on:false, dropdown:{val:'Medium',opts:['Small','Medium','Large']} },
    { id:'sku',         label:'Stock code (SKU)',                       drag:true,  on:false, dropdown:null },
    { id:'name',        label:'Product name',                           drag:true,  on:true,  dropdown:null },
    { id:'qty',         label:'Quantity',                               drag:true,  on:true,  dropdown:{val:'1x',opts:['1x','2x','Per unit']} },
    { id:'period',      label:'Period',                                 drag:true,  on:true,  dropdown:null },
    { id:'unit_price',  label:'Unit price (rate)',                      drag:true,  on:true,  dropdown:null },
    { id:'charge_lbl',  label:'Charge label (e.g. "1 day" / "Fixed")', drag:true,  on:false, dropdown:null },
    { id:'discount',    label:'Applied discount',                       drag:true,  on:false, dropdown:null },
    { id:'coupons',     label:'Applied coupons',                        drag:true,  on:false, dropdown:null },
    { id:'tax',         label:'Tax',                                    drag:true,  on:false, dropdown:null },
    { id:'price_total', label:'Price total',                            drag:true,  on:true,  dropdown:null },
    { id:'bundle',      label:'Bundle item pricing',                    drag:false, on:true,  dropdown:null, special:true },
    { id:'barcode',     label:'Barcode',                                drag:true,  on:false, dropdown:null },
    { id:'qr',          label:'QR code',                                drag:true,  on:false, dropdown:null },
    { id:'item_type',   label:'Item type (Rental, Sales, Service)',     drag:true,  on:true,  dropdown:null },
    { id:'custom',      label:'Custom fields',                          drag:true,  on:false, dropdown:null },
  ]);

  const COL_DATA = {
    image:      { label:'Image',    vals:['img','img','img'],           align:'center' },
    sku:        { label:'SKU',      vals:['R5-001','TRP-02','MEM-04'],  align:'left'   },
    name:       { label:'Product',  vals:['Canon EOS R5','Tripod & Head','Memory Cards'], align:'left' },
    qty:        { label:'Qty',      vals:['2','1','4'],                 align:'right'  },
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
  const onLIDragStart = (e,i) => { liDragRef.current=i; e.dataTransfer.effectAllowed='move'; };
  const onLIDrop = (e,i) => {
    e.preventDefault(); const from=liDragRef.current;
    if(from===null||from===i) return;
    setLineItems(p=>{ const a=[...p]; const [m]=a.splice(from,1); a.splice(i,0,m); return a; });
    liDragRef.current=null;
  };
  const [hovLI, setHovLI] = React.useState(null);

  // ── Sections ──────────────────────────────────────────────
  const [sections, setSections] = React.useState([
    {id:'header',   type:'builtin',label:'Header',          visible:true},
    {id:'logistics',type:'builtin',label:'Logistics & dates',visible:true},
    {id:'lineitems',type:'builtin',label:'Line items',       visible:true},
    {id:'totals',   type:'builtin',label:'Totals & fees',    visible:true},
    {id:'footer',   type:'builtin',label:'Footer',           visible:true},
  ]);

  const [editing,  setEditing]  = React.useState(null);
  const [mode,     setMode]     = React.useState('edit');
  const [zoom,     setZoom]     = React.useState(1);
  const [hovSec,   setHovSec]   = React.useState(null);
  const [hovPrev,  setHovPrev]  = React.useState(null);
  const [addModal,   setAddModal]   = React.useState(null);
  const [resetModal, setResetModal] = React.useState(false);

  // Settings panel state
  const [settingsTab, setSettingsTab]   = React.useState('customize');
  const [docTypeTab,  setDocTypeTab]    = React.useState('invoices');
  const [dateFormat,  setDateFormat]    = React.useState('datetime');
  const [pageSize,    setPageSize]      = React.useState('A4');
  const [docNumLevel, setDocNumLevel]   = React.useState('global');
  const [dueDatesOn,  setDueDatesOn]    = React.useState(false);
  const [customCSS,   setCustomCSS]     = React.useState('');

  const [blockData, setBlockData] = React.useState({});
  const updateBlock = (id,p2) => setBlockData(p=>({...p,[id]:{...(p[id]||{}),...p2}}));
  const getBlock = id => ({text:'',textStyle:'normal',bold:false,italic:false,underline:false,strikethrough:false,bulletList:false,numberedList:false,align:'left',...(blockData[id]||{})});

  const doReset = () => {
    setDocCfg({primaryColor:'#136DEB',showLogo:true,showContact:true,showDates:true,showLocation:true,showDiscount:true,showDeposit:false,footerNote:true,font:'Inter',logoAlign:'Left'});
    setDateFormat('datetime'); setPageSize('A4'); setDocNumLevel('global'); setDueDatesOn(false); setCustomCSS('');
    setBlockData({});
    setResetModal(false);
  };

  const [docCfg, setDocCfg] = React.useState({
    primaryColor:'#136DEB',showLogo:true,showContact:true,logoAlign:'Left',
    showDates:true,showLocation:true,showDiscount:true,showDeposit:false,footerNote:true,
    font:'Inter',
  });
  const setDoc = (k,v) => setDocCfg(p=>({...p,[k]:v!==undefined?v:!p[k]}));

  const isEdit = mode==='edit';
  const ZOOM_STEPS=[0.5,0.67,0.75,0.9,1,1.1,1.25,1.5];
  const zoomIn  = () => setZoom(z=>{const i=ZOOM_STEPS.findIndex(s=>s>z);return i>=0?ZOOM_STEPS[i]:z;});
  const zoomOut = () => setZoom(z=>{const r=[...ZOOM_STEPS].reverse();const i=r.findIndex(s=>s<z);return i>=0?r[i]:z;});

  const dragRef = React.useRef(null);
  const onDragStart = (e,i) => {dragRef.current=i;e.dataTransfer.effectAllowed='move';};
  const onDrop = (e,i) => {
    e.preventDefault();const from=dragRef.current;
    if(from===null||from===i) return;
    setSections(p=>{const a=[...p];const [m]=a.splice(from,1);a.splice(i,0,m);return a;});
    dragRef.current=null;
  };
  const toggleSection = id => setSections(p=>p.map(s=>s.id===id?{...s,visible:!s.visible}:s));
  const insertTextSection = (afterId,position) => {
    const nb={id:nextId(),type:'text',label:'Text section',visible:true};
    setSections(p=>{const a=[...p];const idx=a.findIndex(s=>s.id===afterId);a.splice(position==='above'?idx:idx+1,0,nb);return a;});
    setAddModal(null);
    setTimeout(()=>setEditing(nb.id),50);
  };

  // ── Atoms ─────────────────────────────────────────────────
  const FI = ({n,sz=12,col=C.grey50}) =>
    <i className={`fa-regular fa-${n}`} style={{fontSize:sz,color:col,lineHeight:1,flexShrink:0}}/>;

  const SmTog = ({on,onChange}) => (
    <div onClick={onChange} style={{width:34,height:18,borderRadius:9,background:on?C.blue:C.grey30,cursor:'pointer',position:'relative',transition:'background 180ms',flexShrink:0}}>
      <div style={{width:12,height:12,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?19:3,transition:'left 180ms'}}/>
    </div>
  );
  const Tog = ({on,onChange}) => (
    <div onClick={onChange} style={{width:32,height:17,borderRadius:9,background:on?C.blue:C.grey30,cursor:'pointer',position:'relative',transition:'background 180ms',flexShrink:0}}>
      <div style={{width:11,height:11,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?18:3,transition:'left 180ms'}}/>
    </div>
  );
  const SHead = ({label}) => (
    <div style={{fontSize:10,fontWeight:700,color:C.grey50,textTransform:'uppercase',letterSpacing:'.07em',padding:'11px 0 5px',fontFamily:'var(--font-body)'}}>{label}</div>
  );
  const SelF = ({label,value,onChange,opts}) => (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:11,color:C.grey60,marginBottom:4,fontFamily:'var(--font-body)'}}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:'100%',height:30,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,padding:'0 8px',background:C.white,fontFamily:'var(--font-body)'}}>
        {opts.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
  const Radio = ({checked,onChange,label,hint}) => (
    <label style={{display:'flex',alignItems:'flex-start',gap:8,padding:'7px 0',cursor:'pointer',borderBottom:`1px solid ${C.grey20}`}}>
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

  const VARS=['{{customer_name}}','{{order_number}}','{{date}}','{{due_date}}','{{company_name}}','{{total}}'];

  // ── Line Items panel ──────────────────────────────────────
  const bundleItem = lineItems.find(i=>i.id==='bundle');

  const LineItemsPanel = () => (
    <>
      <SHead label="General settings"/>
      {bundleItem && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
          <div>
            <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Bundle item pricing</div>
            <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)',marginTop:1}}>Groups bundle items with combined pricing</div>
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
            <div key={item.id}
              draggable={item.drag}
              onDragStart={item.drag?e=>onLIDragStart(e,idx):undefined}
              onDragOver={item.drag?e=>e.preventDefault():undefined}
              onDrop={item.drag?e=>onLIDrop(e,idx):undefined}
              onMouseEnter={()=>setHovLI(item.id)}
              onMouseLeave={()=>setHovLI(null)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 8px 0 14px',
                background:isHov?C.grey10:'transparent',
                borderLeft:`3px solid ${isHov?C.blue:'transparent'}`,
                opacity:item.on?1:0.45,transition:'background 100ms,border-color 100ms',minHeight:36}}>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'8px 0'}}>
                <span style={{fontSize:13,color:C.black,fontFamily:'var(--font-body)',textDecoration:item.on?'none':'line-through',lineHeight:1.3}}>{item.label}</span>
                {item.dropdown&&item.on&&(
                  <select value={item.dropdown.val} onChange={e=>setLIDrop(item.id,e.target.value)}
                    style={{height:22,border:`1px solid ${C.grey30}`,borderRadius:5,fontSize:10,padding:'0 4px',background:C.white,fontFamily:'var(--font-body)',maxWidth:72,cursor:'pointer'}}>
                    {item.dropdown.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                )}
              </div>
              <div style={{display:'flex',gap:3,alignItems:'center',opacity:isHov?1:0,transition:'opacity 150ms'}}>
                <button onClick={()=>toggleLI(item.id)}
                  style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:item.on?'transparent':C.grey20,border:`1px solid ${C.grey30}`,borderRadius:6,cursor:'pointer'}}>
                  <FI n={item.on?'eye':'eye-slash'} sz={12} col={item.on?C.grey60:C.grey40}/>
                </button>
                <div style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.grey30}`,borderRadius:6,cursor:'grab'}}>
                  <FI n="grip-lines" sz={12} col={C.grey50}/>
                </div>
              </div>
            </div>
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
        <div style={{flex:1,overflowY:'auto',padding:'0 14px'}}>

          {/* Typography — at top */}
          <SHead label="Typography"/>
          <SelF label="Font family" value={docCfg.font} onChange={v=>setDoc('font',v)} opts={['Inter','Helvetica','Georgia','Garamond','Courier']}/>

          {/* Page size */}
          <SHead label="Page size"/>
          <div style={{display:'flex',gap:4,marginBottom:4}}>
            {['A4','Letter','Legal','A5'].map(s=>(
              <button key={s} onClick={()=>setPageSize(s)}
                style={{flex:1,height:28,border:`1px solid ${pageSize===s?C.blue:C.grey30}`,borderRadius:6,background:pageSize===s?C.blue5:C.white,color:pageSize===s?C.blue:C.grey60,fontSize:11,cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:pageSize===s?600:400,transition:'all 120ms'}}>
                {s}
              </button>
            ))}
          </div>

          {/* Document numbering */}
          <SHead label="Document numbering"/>
          <div style={{fontSize:10,color:C.grey50,marginBottom:6,fontFamily:'var(--font-body)',lineHeight:1.4}}>Choose how document numbers ascend — globally or by prefix.</div>
          <Radio checked={docNumLevel==='global'} onChange={()=>setDocNumLevel('global')}
            label="Global level" hint="Numbers increment by one: #1, #2, #3, etc."/>
          <Radio checked={docNumLevel==='prefix'} onChange={()=>setDocNumLevel('prefix')}
            label="Prefix level" hint="New sequence per year, month, or customer number."/>

          {/* Invoice due dates */}
          <SHead label="Invoice due dates"/>
          <div style={{fontSize:10,color:C.grey50,marginBottom:6,fontFamily:'var(--font-body)',lineHeight:1.4}}>
            Track payments by assigning automatic due-dates to all finalized invoices.
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
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
          <textarea value={customCSS} onChange={e=>setCustomCSS(e.target.value)}
            placeholder={'/* Override default styles */\n.invoice-header { }\n.line-items td { }'}
            style={{width:'100%',height:110,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:11,padding:'8px',fontFamily:'monospace',resize:'vertical',outline:'none',lineHeight:1.6,background:'#fafafa',boxSizing:'border-box'}}/>

        </div>
      </div>
    );
  };

  // ── Branding panel ────────────────────────────────────────
  const [brandColor, setBrandColor]   = React.useState('#136DEB');
  const [secondColor, setSecondColor] = React.useState('#131314');

  const ColorRow = ({label, value, onChange}) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.grey20}`}}>
      <span style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>{label}</span>
      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
        {/* Hex display */}
        <div style={{height:32,padding:'0 10px',border:`1px solid ${C.grey20}`,borderRadius:8,background:C.grey10,display:'flex',alignItems:'center',minWidth:82}}>
          <span style={{fontSize:11,color:C.grey60,fontFamily:'monospace',letterSpacing:'.03em'}}>{value.toUpperCase()}</span>
        </div>
        {/* Color swatch — clicking opens native picker */}
        <div style={{width:32,height:32,borderRadius:8,background:value,border:`2px solid rgba(0,0,0,.1)`,position:'relative',flexShrink:0,boxShadow:'inset 0 1px 2px rgba(0,0,0,.15)'}}>
          <input type="color" value={value} onChange={e=>onChange(e.target.value)}
            style={{opacity:0,position:'absolute',inset:0,width:'100%',height:'100%',cursor:'pointer',border:'none',padding:0}}/>
        </div>
      </label>
    </div>
  );

  const BrandingPanel = () => (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'0 14px',borderBottom:`1px solid ${C.grey20}`}}>
        <button onClick={()=>setEditing(null)}
          style={{height:40,display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:C.grey50,fontSize:12,fontFamily:'var(--font-body)',padding:0}}>
          <FI n="chevron-left" sz={10} col={C.grey50}/> Branding
        </button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 14px'}}>
        <ColorRow label="Brand color"     value={brandColor}  onChange={v=>{setBrandColor(v);setDoc('primaryColor',v);}}/>
        <ColorRow label="Secondary color" value={secondColor} onChange={setSecondColor}/>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${C.grey20}`}}>
          <span style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)',paddingTop:4}}>Logo</span>
          <div style={{display:'flex',flexDirection:'column',alignItems:'stretch',gap:6,width:140}}>
            <div style={{height:90,background:C.grey10,borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,border:`1px solid ${C.grey20}`}}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" fill="#222"/>
                <path d="M10 26 C10 18 18 10 26 14 C22 18 20 22 18 26Z" fill="#fff" opacity=".6"/>
                <path d="M14 28 C14 20 20 14 28 18 C24 22 22 26 18 28Z" fill="#fff" opacity=".4"/>
              </svg>
              <span style={{fontSize:9,fontWeight:700,color:C.black,letterSpacing:2,fontFamily:'var(--font-body)'}}>COMPANY</span>
            </div>
            <button style={{height:30,border:`1px solid ${C.grey30}`,borderRadius:16,background:C.white,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',color:C.black}}>Change</button>
          </div>
        </div>
      </div>

      {/* Reset to org defaults — sticky button at bottom */}
      <div style={{padding:'12px 14px',borderTop:`1px solid ${C.grey20}`}}>
        <button style={{width:'100%',height:32,background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,color:C.black,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          <FI n="rotate-left" sz={11} col={C.grey60}/> Reset to org defaults
        </button>
      </div>
    </div>
  );

  // ── Section settings ──────────────────────────────────────
  const sectionPanels = {
    header: <>
      <SHead label="General settings"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div><div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Company logo</div></div>
        <Tog on={docCfg.showLogo} onChange={()=>setDoc('showLogo')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div><div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Contact details</div>
          <div style={{fontSize:10,color:C.grey40,fontFamily:'var(--font-body)'}}>Phone, website, address</div></div>
        <Tog on={docCfg.showContact} onChange={()=>setDoc('showContact')}/>
      </div>
      <SHead label="Logo alignment"/>
      <div style={{display:'flex',gap:4}}>
        {['Left','Center','Right'].map(a=>(
          <button key={a} onClick={()=>setDoc('logoAlign',a)}
            style={{flex:1,height:28,border:`1px solid ${docCfg.logoAlign===a?C.blue:C.grey30}`,borderRadius:6,background:docCfg.logoAlign===a?C.blue5:C.white,color:docCfg.logoAlign===a?C.blue:C.grey60,fontSize:11,cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:docCfg.logoAlign===a?600:400,transition:'all 120ms'}}>{a}</button>
        ))}
      </div>
    </>,
    logistics: <>
      <SHead label="General settings"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Pickup & return dates</div>
        <Tog on={docCfg.showDates} onChange={()=>setDoc('showDates')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Location name</div>
        <Tog on={docCfg.showLocation} onChange={()=>setDoc('showLocation')}/>
      </div>
      <SHead label="Date format"/>
      <Radio checked={dateFormat==='datetime'} onChange={()=>setDateFormat('datetime')}
        label="Show date and time" hint="Shows time in addition to date for pick up and return details"/>
      <Radio checked={dateFormat==='dateonly'} onChange={()=>setDateFormat('dateonly')}
        label="Show date only" hint="Shows only the date for pick up and return details"/>
    </>,
    lineitems: <LineItemsPanel/>,
    totals: <>
      <SHead label="General settings"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Discount line</div>
        <Tog on={docCfg.showDiscount} onChange={()=>setDoc('showDiscount')}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Security deposit</div>
        <Tog on={docCfg.showDeposit} onChange={()=>setDoc('showDeposit')}/>
      </div>
    </>,
    footer: <>
      <SHead label="General settings"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.grey20}`}}>
        <div style={{fontSize:12,color:C.black,fontFamily:'var(--font-body)'}}>Payment note</div>
        <Tog on={docCfg.footerNote} onChange={()=>setDoc('footerNote')}/>
      </div>
    </>,
  };

  // ── Text section panel — local state for fast typing ──────
  const TextSectionPanel = ({id}) => {
    const b = getBlock(id);
    const [localText, setLocalText] = React.useState(b.text);
    const debounceRef = React.useRef(null);
    React.useEffect(() => { setLocalText(getBlock(id).text); }, [id]);
    const handleText = val => {
      setLocalText(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateBlock(id, {text: val}), 120);
    };
    const FmtBtn=({icon,prop})=>(
      <button onClick={()=>updateBlock(id,{[prop]:!b[prop]})}
        style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${b[prop]?C.blue:C.grey30}`,borderRadius:5,cursor:'pointer',background:b[prop]?C.blue5:'transparent'}}>
        <FI n={icon} sz={11} col={b[prop]?C.blue:C.grey60}/>
      </button>
    );
    const AlignBtn=({icon,val})=>(
      <button onClick={()=>updateBlock(id,{align:val})}
        style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${b.align===val?C.blue:C.grey30}`,borderRadius:5,cursor:'pointer',background:b.align===val?C.blue5:'transparent'}}>
        <FI n={icon} sz={11} col={b.align===val?C.blue:C.grey60}/>
      </button>
    );
    return <>
      <SHead label="Formatting"/>
      {/* Row 1: style dropdown + B I U S */}
      <div style={{display:'flex',gap:4,marginBottom:6,alignItems:'center'}}>
        <select value={b.textStyle} onChange={e=>updateBlock(id,{textStyle:e.target.value})}
          style={{height:28,border:`1px solid ${C.grey30}`,borderRadius:5,fontSize:11,padding:'0 6px',background:C.white,fontFamily:'var(--font-body)',cursor:'pointer',flex:1}}>
          {['normal','h1','h2','h3'].map(s=><option key={s} value={s}>{{normal:'Normal',h1:'Heading 1',h2:'Heading 2',h3:'Heading 3'}[s]}</option>)}
        </select>
        <FmtBtn icon="bold" prop="bold"/>
        <FmtBtn icon="italic" prop="italic"/>
        <FmtBtn icon="underline" prop="underline"/>
        <FmtBtn icon="strikethrough" prop="strikethrough"/>
      </div>
      {/* Row 2: lists + alignment */}
      <div style={{display:'flex',gap:4,marginBottom:10,alignItems:'center'}}>
        <FmtBtn icon="list-ul" prop="bulletList"/>
        <FmtBtn icon="list-ol" prop="numberedList"/>
        <div style={{width:1,background:C.grey20,margin:'0 2px',height:20}}/>
        <AlignBtn icon="align-left" val="left"/>
        <AlignBtn icon="align-center" val="center"/>
        <AlignBtn icon="align-right" val="right"/>
      </div>
      <SHead label="Content"/>
      <textarea value={localText} onChange={e=>handleText(e.target.value)} placeholder="Enter text…"
        style={{width:'100%',height:90,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:b.textStyle==='h1'?15:b.textStyle==='h2'?13:12,padding:'8px',fontFamily:'var(--font-body)',resize:'vertical',outline:'none',lineHeight:1.5,
          fontWeight:b.bold||b.textStyle==='h1'||b.textStyle==='h2'?700:400,fontStyle:b.italic?'italic':'normal',
          textDecoration:`${b.underline?'underline ':b.strikethrough?'line-through ':''}`  .trim()||'none',textAlign:b.align}}/>
      <SHead label="Insert variable"/>
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
        {VARS.map(v=>(
          <button key={v} onClick={()=>{ const t=(localText||'')+v; handleText(t); }}
            style={{height:22,padding:'0 7px',background:C.blue5,color:C.blue,border:`1px solid ${C.blue30}`,borderRadius:10,fontSize:10,cursor:'pointer',fontFamily:'var(--font-body)',whiteSpace:'nowrap'}}>{v}</button>
        ))}
      </div>
    </>;
  };

  // ── Sidebar ───────────────────────────────────────────────
  const SidebarList = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.grey20}`}}>
        <div style={{fontSize:10,color:C.grey40,marginBottom:4,fontFamily:'var(--font-body)'}}>Template</div>
        <div style={{height:32,border:`1px solid ${C.grey20}`,borderRadius:6,fontSize:12,padding:'0 10px',background:C.grey10,color:C.grey50,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',marginBottom:10}}>
          Default invoice
        </div>
        <div style={{display:'flex',gap:6,marginBottom:2}}>
          {[{key:'__settings__',icon:'gear',label:'Settings'},{key:'__branding__',icon:'palette',label:'Branding'}].map(a=>(
            <button key={a.key} onClick={()=>setEditing(a.key)}
              style={{flex:1,height:30,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                background:editing===a.key?C.blue5:C.white,border:`1px solid ${editing===a.key?C.blue:C.grey30}`,
                borderRadius:6,cursor:'pointer',fontSize:11,color:editing===a.key?C.blue:C.black,
                fontFamily:'var(--font-body)',fontWeight:editing===a.key?600:400,transition:'all 120ms'}}>
              <FI n={a.icon} sz={10} col={editing===a.key?C.blue:C.grey60}/> {a.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        <div style={{padding:'8px 14px 4px'}}>
          <div style={{fontSize:10,fontWeight:700,color:C.grey50,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'var(--font-body)'}}>Sections</div>
        </div>
        {sections.map((s,idx)=>(
          <div key={s.id} draggable onDragStart={e=>onDragStart(e,idx)} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,idx)}
            onMouseEnter={()=>setHovSec(s.id)} onMouseLeave={()=>setHovSec(null)}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 8px 0 14px',
              background:hovSec===s.id?C.grey10:'transparent',borderLeft:`3px solid ${hovSec===s.id?C.blue:'transparent'}`,
              opacity:s.visible?1:0.45,transition:'background 100ms,border-color 100ms',minHeight:36}}>
              <div onClick={()=>setEditing(s.id)} style={{flex:1,display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'8px 0'}}>
                <span style={{fontSize:13,color:C.black,fontFamily:'var(--font-body)',textDecoration:s.visible?'none':'line-through'}}>{s.label}</span>
                {s.type==='text'&&<span style={{fontSize:9,color:C.grey40,background:C.grey10,padding:'1px 5px',borderRadius:3,fontFamily:'var(--font-body)'}}>Text</span>}
              </div>
              <div style={{display:'flex',gap:3,alignItems:'center',opacity:hovSec===s.id?1:0,transition:'opacity 150ms'}}>
                <button onClick={e=>{e.stopPropagation();toggleSection(s.id);}}
                  style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:s.visible?'transparent':C.grey20,border:`1px solid ${C.grey30}`,borderRadius:6,cursor:'pointer'}}>
                  <FI n={s.visible?'eye':'eye-slash'} sz={12} col={s.visible?C.grey60:C.grey40}/>
                </button>
                <div style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.grey30}`,borderRadius:6,cursor:'grab'}}>
                  <FI n="grip-lines" sz={12} col={C.grey50}/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SidebarSection = () => {
    if(editing==='__settings__') return <SettingsPanel/>;
    if(editing==='__branding__') return <BrandingPanel/>;
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
        <div style={{flex:1,overflowY:'auto',padding:'0 14px'}}>
          {isText?<TextSectionPanel id={editing}/>:(sectionPanels[editing]||null)}
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
      <div style={{position:'relative'}} onMouseEnter={()=>isEdit&&setHovPrev(id)} onMouseLeave={()=>isEdit&&setHovPrev(null)}>
        {isHov&&(
          <div style={{position:'absolute',top:-11,left:'50%',transform:'translateX(-50%)',zIndex:20}}>
            <div onClick={e=>{e.stopPropagation();setAddModal({afterId:id,position:'above'});}}
              style={{height:20,padding:'0 10px',background:C.blue,color:'#fff',borderRadius:10,fontSize:10,fontWeight:600,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',gap:4,cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}>
              <FI n="plus" sz={9} col="#fff"/> Add text section above
            </div>
          </div>
        )}
        <div onClick={()=>isEdit&&setEditing(id)}
          style={{cursor:isEdit?'pointer':'default',opacity:vis?1:0.22,transition:'opacity 200ms',position:'relative'}}>
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
    {name:'Canon EOS R5',  sku:'R5-001', qty:'2', period:'7 days', unit_price:'$149', charge_lbl:'1 day', discount:'—', coupons:'—', tax:'$22', price_total:'$320', item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Tripod & Head', sku:'TRP-02', qty:'1', period:'7 days', unit_price:'$49',  charge_lbl:'Fixed', discount:'—', coupons:'—', tax:'$7',  price_total:'$56',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
    {name:'Memory Cards',  sku:'MEM-04', qty:'4', period:'7 days', unit_price:'$12',  charge_lbl:'1 day', discount:'—', coupons:'—', tax:'$7',  price_total:'$55',  item_type:'Rental', barcode:'▐▌▐▌', qr:'⊞', custom:'—', image:'img'},
  ];

  const DocPreview = () => (
    <div style={{background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,overflow:'visible'}}>
      {sections.map(s=>{
        if(s.id==='header') return (
          <SectionWrap key="header" id="header" label="Header">
            <div style={{padding:'18px 22px 14px',borderBottom:`1px solid ${C.grey20}`}}>
              {(() => {
                const align = docCfg.logoAlign || 'Left';
                const LogoEl = docCfg.showLogo ? (
                  <div style={{width:68,height:20,background:docCfg.primaryColor,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{color:'#fff',fontSize:7,fontWeight:700,letterSpacing:1}}>LOGO</span>
                  </div>
                ) : null;
                const InvoiceEl = (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:13,fontWeight:700}}>INVOICE</div>
                    <div style={{fontSize:9,color:C.grey50}}>#ORD-2024-0089</div>
                  </div>
                );
                return (
                  <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'flex-start',marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'flex-start'}}>
                      {align==='Left' && LogoEl}
                    </div>
                    <div style={{display:'flex',justifyContent:'center'}}>
                      {align==='Center' && LogoEl}
                    </div>
                    <div style={{display:'flex',justifyContent:'flex-end',gap:12,alignItems:'flex-start'}}>
                      {align==='Right' && LogoEl}
                      {InvoiceEl}
                    </div>
                  </div>
                );
              })()}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div style={{fontSize:9,color:C.grey60,lineHeight:1.5}}>Acme Rentals Inc.<br/>123 Main St, NY 10001<br/>{docCfg.showContact&&'info@acme.com'}</div>
                <div style={{fontSize:9,color:C.grey60,lineHeight:1.5}}>Sarah Johnson<br/>456 Oak Ave, NY 10002</div>
              </div>
            </div>
          </SectionWrap>
        );
        if(s.id==='logistics') return (
          <SectionWrap key="logistics" id="logistics" label="Logistics & dates">
            <div style={{padding:'8px 22px',background:C.bg,display:'flex',gap:18,borderBottom:`1px solid ${C.grey20}`}}>
              {docCfg.showDates&&[['Pickup','Mar 5, 2024'],['Return','Mar 12, 2024']].map(([l,v])=>(
                <div key={l}><div style={{fontSize:7,fontWeight:700,color:C.grey40,textTransform:'uppercase',letterSpacing:1}}>{l}</div>
                  <div style={{fontSize:8,color:C.black,marginTop:1}}>{v}{dateFormat==='datetime'&&' 10:00'}</div></div>
              ))}
              {docCfg.showLocation&&<div><div style={{fontSize:7,fontWeight:700,color:C.grey40,textTransform:'uppercase',letterSpacing:1}}>Location</div><div style={{fontSize:8,color:C.black,marginTop:1}}>Main Branch</div></div>}
            </div>
          </SectionWrap>
        );
        if(s.id==='lineitems') return (
          <SectionWrap key="lineitems" id="lineitems" label="Line items">
            <div style={{padding:'8px 22px 12px',overflowX:'auto'}}>
              {visLICols.length===0 ? (
                <div style={{padding:'12px 0',textAlign:'center',fontSize:10,color:C.grey40,fontFamily:'var(--font-body)'}}>No columns enabled</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
                  <thead><tr style={{borderBottom:`2px solid ${docCfg.primaryColor}`}}>
                    {visLICols.map(col=>(
                      <th key={col.id} style={{padding:'3px 4px',fontSize:7,fontWeight:700,color:docCfg.primaryColor,textTransform:'uppercase',letterSpacing:1,
                        textAlign:COL_DATA[col.id]?.align==='left'?'left':'right',whiteSpace:'nowrap'}}>
                        {COL_DATA[col.id]?.label||col.label}
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {/* Bundle group — when bundle pricing is on */}
                    {bundleItem?.on && (<>
                      <tr style={{background:'#f8f9fa'}}>
                        <td colSpan={visLICols.length} style={{padding:'4px 4px 2px',fontSize:8,fontWeight:700,color:C.black}}>📦 Camera Bundle Kit</td>
                      </tr>
                      {[
                        {name:'Canon EOS R5',sku:'R5-001',qty:'1',period:'7 days',unit_price:'$149',charge_lbl:'1 day',discount:'—',coupons:'—',tax:'$22',price_total:'$171',item_type:'Rental',barcode:'▐▌▐▌',qr:'⊞',custom:'—',image:'img'},
                        {name:'  ↳ Lens 50mm',sku:'LNS-02',qty:'1',period:'7 days',unit_price:'$29',charge_lbl:'1 day',discount:'—',coupons:'—',tax:'$4',price_total:'$33',item_type:'Rental',barcode:'▐▌▐▌',qr:'⊞',custom:'—',image:'img'},
                      ].map((row,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${C.grey20}`,opacity:0.8}}>
                          {visLICols.map((col,ci)=>(
                            <td key={col.id} style={{padding:'3px 4px',fontSize:7,color:ci===0?C.grey60:C.grey50,textAlign:COL_DATA[col.id]?.align==='left'?'left':'right',whiteSpace:'nowrap',fontStyle:'italic'}}>
                              {row[col.id]||'—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr style={{borderBottom:`1px solid ${C.grey20}`,background:'#f8f9fa'}}>
                        {visLICols.map((col,ci)=>(
                          <td key={col.id} style={{padding:'3px 4px',fontSize:7,fontWeight:600,color:ci===0?C.black:C.grey60,textAlign:COL_DATA[col.id]?.align==='left'?'left':'right',whiteSpace:'nowrap'}}>
                            {ci===0?'Bundle total':col.id==='price_total'?'$204':col.id==='tax'?'$26':''}
                          </td>
                        ))}
                      </tr>
                    </>)}
                    {liRows.map((row,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.grey20}`}}>
                        {visLICols.map((col,ci)=>(
                          <td key={col.id} style={{padding:'4px',fontSize:8,
                            color:COL_DATA[col.id]?.align==='left'?C.black:C.grey60,
                            textAlign:COL_DATA[col.id]?.align==='left'?'left':'right',
                            whiteSpace:'nowrap'}}>
                            {row[col.id]||'—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </SectionWrap>
        );
        if(s.id==='totals') return (
          <SectionWrap key="totals" id="totals" label="Totals & fees">
            <div style={{padding:'8px 22px 14px',display:'flex',justifyContent:'flex-end',borderTop:`1px solid ${C.grey20}`}}>
              <div style={{width:140}}>
                {[['Subtotal','$431'],['Tax (15%)','$36'],docCfg.showDiscount&&['Discount','-$20'],docCfg.showDeposit&&['Deposit','-$100'],['Total','$467']].filter(Boolean).map(([l,v],i,arr)=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderTop:i===arr.length-1?`1px solid ${C.grey20}`:'none',marginTop:i===arr.length-1?4:0}}>
                    <span style={{fontSize:8,color:i===arr.length-1?C.black:C.grey50,fontWeight:i===arr.length-1?700:400}}>{l}</span>
                    <span style={{fontSize:8,color:i===arr.length-1?C.black:C.grey50,fontWeight:i===arr.length-1?700:400}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionWrap>
        );
        if(s.id==='footer') return (
          <SectionWrap key="footer" id="footer" label="Footer">
            <div style={{padding:'8px 22px',background:C.bg,borderTop:`1px solid ${C.grey20}`,fontSize:8,color:C.grey50}}>
              {docCfg.footerNote?'Thank you for your business. Payment due within 30 days.':'\u00a0'}
            </div>
          </SectionWrap>
        );
        if(s.type==='text'){
          const b=getBlock(s.id);
          return (
            <SectionWrap key={s.id} id={s.id} label="Text section">
              <div style={{padding:'10px 22px',borderTop:`1px solid ${C.grey20}`,minHeight:34,textAlign:b.align}}>
                <div style={{fontSize:9,color:C.black,lineHeight:1.6,whiteSpace:'pre-wrap',fontWeight:b.bold?700:400,fontStyle:b.italic?'italic':'normal',textDecoration:b.underline?'underline':'none'}}>
                  {b.text||<span style={{color:C.grey30,fontStyle:'italic'}}>Empty text section</span>}
                </div>
              </div>
            </SectionWrap>
          );
        }
        return null;
      })}
    </div>
  );

  // ── View toolbar — bottom-right, sticky ───────────────────
  const ViewToolbar = () => (
    <div style={{display:'flex',alignItems:'center',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:8,boxShadow:'0 2px 10px rgba(0,0,0,.09)',overflow:'hidden'}}>
      <div style={{display:'flex',padding:3,gap:2,borderRight:`1px solid ${C.grey20}`}}>
        {[{key:'edit',icon:'pen',label:'Edit'},{key:'preview',icon:'eye',label:'Preview'}].map(m=>(
          <button key={m.key} onClick={()=>{setMode(m.key);if(m.key==='preview')setEditing(null);}}
            style={{height:26,padding:'0 10px',borderRadius:4,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',
              background:mode===m.key?C.blue:'transparent',color:mode===m.key?'#fff':C.grey50,
              display:'flex',alignItems:'center',gap:4,transition:'all 150ms'}}>
            <FI n={m.icon} sz={10} col={mode===m.key?'#fff':C.grey50}/> {m.label}
          </button>
        ))}
      </div>
      <button onClick={zoomOut} disabled={zoom<=ZOOM_STEPS[0]}
        style={{width:30,height:32,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:zoom<=ZOOM_STEPS[0]?'default':'pointer',opacity:zoom<=ZOOM_STEPS[0]?0.3:1,borderRight:`1px solid ${C.grey20}`}}>
        <FI n="minus" sz={10} col={C.grey60}/>
      </button>
      <div onClick={()=>setZoom(1)} style={{width:44,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:C.grey60,fontFamily:'var(--font-body)',fontWeight:500,cursor:'pointer',userSelect:'none',borderRight:`1px solid ${C.grey20}`}}>
        {Math.round(zoom*100)}%
      </div>
      <button onClick={zoomIn} disabled={zoom>=ZOOM_STEPS[ZOOM_STEPS.length-1]}
        style={{width:30,height:32,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:zoom>=ZOOM_STEPS[ZOOM_STEPS.length-1]?'default':'pointer',opacity:zoom>=ZOOM_STEPS[ZOOM_STEPS.length-1]?0.3:1}}>
        <FI n="plus" sz={10} col={C.grey60}/>
      </button>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100vh',fontFamily:'var(--font-body)',background:C.bg,overflow:'hidden',position:'relative'}}>
      {/* Top bar */}
      <div style={{height:44,background:C.white,borderBottom:`1px solid ${C.grey30}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',flexShrink:0,position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button style={{height:30,padding:'0 10px',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,color:C.black,cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-body)'}}>
            <FI n="arrow-left" sz={10} col={C.black}/> Exit
          </button>
        </div>
        <span style={{fontSize:13,fontWeight:600,color:C.black,fontFamily:'var(--font-body)',position:'absolute',left:'50%',transform:'translateX(-50%)'}}>Default invoice</span>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setResetModal(true)} style={{height:30,padding:'0 12px',background:C.white,border:`1px solid ${C.grey30}`,borderRadius:6,fontSize:12,color:C.black,cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-body)'}}>
            <FI n="rotate-left" sz={11} col={C.grey60}/> Reset
          </button>
          <button style={{height:30,padding:'0 16px',background:C.blue,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>Save</button>
        </div>
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Sidebar */}
        <div style={{width:240,background:C.white,borderRight:`1px solid ${C.grey30}`,display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>
          {editing?<SidebarSection/>:<SidebarList/>}
        </div>

        {/* Preview — outer wrapper holds toolbar fixed, inner div scrolls */}
        <div style={{flex:1,position:'relative',background:isEdit?C.bg:'#efefeb'}}>
          <div style={{position:'absolute',inset:0,overflowY:'auto'}}>
            <div style={{padding:'20px 40px 80px'}}>
              <div style={{transformOrigin:'top center',transform:`scale(${zoom})`,transition:'transform 200ms'}}>
                <div style={{width:560,margin:'0 auto'}}>
                  <DocPreview/>
                </div>
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
