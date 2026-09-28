/* LM layer 4 - Engine: one interface for every "brain".
   A backend is:  { label, ready():boolean, stream(messages, opts): async iterable of text chunks }
   The chat UI only calls LM.Engine.reply(messages), so backends are swappable:

     LM.Engine.registerBackend('my-llm',{
       label:'My LLM',
       ready:()=>true,
       async *stream(messages,opts){            // messages = [{role:'user'|'assistant',content}]
         const r=await fetch('/your-model-endpoint',{method:'POST',body:JSON.stringify({messages})});
         yield (await r.json()).text;            // or yield chunks as they arrive
       }
     });
     LM.Engine.use('my-llm');
*/
window.LM=window.LM||{};
LM.Engine=(function(){
  const T=LM.Tokenizer,FALLBACK='How can I help you?',SKEY='instrumentorum:lm:settings';
  let settings={temperature:.8,maxTokens:60};
  try{Object.assign(settings,JSON.parse(localStorage.getItem(SKEY)||'{}'))}catch(e){}
  const saveSettings=()=>{try{localStorage.setItem(SKEY,JSON.stringify(settings))}catch(e){}};

  let model=new LM.NGram(3);
  function rebuild(){model=new LM.NGram(3);LM.Corpus.all().forEach(d=>model.train(d.text))}

  const backends={};let active='ngram';

  /* Built-in backend: the local n-gram model trained on your Corpus. */
  backends.ngram={
    label:'Local n-gram model',
    ready:()=>model.stats().tokens>0,
    async *stream(messages,opts){
      const last=[...messages].reverse().find(m=>m.role==='user');
      const toks=model.generate(last?last.content:'',opts);
      if(!toks.length){yield FALLBACK;return}
      const end=toks.length-1;
      if(!T.isPunct(toks[end]))toks.push('.');else if(!T.isEnd(toks[end]))toks[end]='.';
      for(let i=0;i<toks.length;i++){
        let p=toks[i];
        if(i===0||T.isEnd(toks[i-1]))p=p.charAt(0).toUpperCase()+p.slice(1);
        yield (i&&!T.isPunct(toks[i])?' ':'')+p;
      }
    }
  };

  /* No data / backend not ready -> the original greeting. */
  async function* reply(messages){
    const b=backends[active];
    if(!b||!b.ready()){yield FALLBACK;return}
    try{yield* b.stream(messages,settings)}catch(e){yield 'Sorry, something went wrong.'}
  }

  LM.Corpus.onChange(rebuild);rebuild();

  return {
    reply,rebuild,
    registerBackend:(id,b)=>{backends[id]=b},
    use:id=>{if(backends[id])active=id},
    backends:()=>Object.keys(backends).map(id=>({id,label:backends[id].label,active:id===active})),
    stats:()=>model.stats(),
    settings:()=>Object.assign({},settings),
    set:(k,v)=>{settings[k]=v;saveSettings()}
  };
})();
