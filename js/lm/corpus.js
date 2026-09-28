/* LM layer 3 - Corpus: the training data you feed in. Saved in this browser (localStorage). */
window.LM=window.LM||{};
LM.Corpus=(function(){
  const KEY='instrumentorum:lm:corpus';
  let docs=[];const subs=[];
  try{docs=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(docs));return true}catch(e){return false}};
  const emit=()=>subs.forEach(f=>f());
  function add(name,text){
    text=String(text).trim();if(!text)return null;
    const d={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,text,tokens:LM.Tokenizer.tokenize(text).length,added:Date.now()};
    docs.push(d);
    if(!persist()){docs.pop();return false}   /* false = browser storage full */
    emit();return d;
  }
  function remove(id){docs=docs.filter(d=>d.id!==id);persist();emit()}
  function clear(){docs=[];persist();emit()}
  const all=()=>docs.slice();
  const bytes=()=>docs.reduce((n,d)=>n+d.text.length,0);
  return {add,remove,clear,all,bytes,onChange:f=>subs.push(f)};
})();
