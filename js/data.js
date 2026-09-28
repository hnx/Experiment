/* Settings > Data Management: feed data to the model, see stats, tune generation. */
(function(){
  const $=id=>document.getElementById(id);
  const fmt=n=>n.toLocaleString();
  const say=(m,bad)=>{const s=$('dmStatus');s.textContent=m;s.dataset.bad=bad?'1':''};

  function render(){
    const st=LM.Engine.stats(),docs=LM.Corpus.all();
    $('dmStats').textContent=docs.length?
      fmt(docs.length)+' document'+(docs.length>1?'s':'')+' \u00b7 '+fmt(st.tokens)+' words \u00b7 '+fmt(st.vocab)+' unique \u00b7 '+Math.max(1,Math.round(LM.Corpus.bytes()/1024))+' KB'
      :'No data yet \u2014 the assistant just says "How can I help you?"';
    const list=$('dmList');list.textContent='';
    docs.forEach(d=>{
      const row=document.createElement('div');row.className='dm-item';
      const n=document.createElement('div');n.className='dm-name';n.textContent=d.name;
      const c=document.createElement('span');c.textContent=fmt(d.tokens)+' words';
      const x=document.createElement('button');x.className='dm-rm';x.textContent='Remove';
      x.onclick=()=>{LM.Corpus.remove(d.id);say('Removed.')};
      row.append(n,c,x);list.append(row);
    });
  }
  function added(r,name){
    if(r===false){say('Browser storage is full \u2014 remove some data first.',true);return false}
    if(!r){say('Nothing to add.',true);return false}
    return true;
  }
  $('dmAdd').onclick=()=>{
    const ta=$('dmText'),text=ta.value.trim();
    if(!text){say('Paste some text first.',true);return}
    if(added(LM.Corpus.add('Pasted text \u00b7 '+new Date().toLocaleString(),text))){ta.value='';say('Added. The model has learned from it.')}
  };
  $('dmFile').onchange=async e=>{
    const files=[...e.target.files];let ok=0;
    for(const f of files){
      try{if(added(LM.Corpus.add(f.name,await f.text())))ok++;else break}catch(err){say('Could not read '+f.name,true);break}
    }
    e.target.value='';if(ok)say('Added '+ok+' file'+(ok>1?'s':'')+'.');
  };
  $('dmClear').onclick=()=>{if(LM.Corpus.all().length&&confirm('Remove all training data?')){LM.Corpus.clear();say('All data removed.')}};

  const s=LM.Engine.settings();
  const temp=$('dmTemp'),max=$('dmMax');
  temp.value=s.temperature;max.value=s.maxTokens;
  const sync=()=>{$('dmTempVal').textContent=(+temp.value).toFixed(2);$('dmMaxVal').textContent=max.value};
  temp.oninput=()=>{LM.Engine.set('temperature',+temp.value);sync()};
  max.oninput=()=>{LM.Engine.set('maxTokens',+max.value);sync()};
  sync();

  LM.Corpus.onChange(render);render();
})();
