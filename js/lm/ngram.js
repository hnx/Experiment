/* LM layer 2 - Model: word-level n-gram language model with back-off.
   train(text)              learn from text
   generate(prompt, opts)   continue a prompt, one token at a time, by sampling
                            P(next token | previous tokens)
   Swap this whole layer for a bigger model later; only Engine talks to it. */
window.LM=window.LM||{};
LM.NGram=function(order){
  order=order||3;
  const T=LM.Tokenizer,BOS='<s>',EOS='</s>';
  const tables=[];for(let k=0;k<order;k++)tables.push(new Map()); /* tables[k]: context of k tokens -> next-token counts */
  const vocab=new Set();let tokens=0;
  const low=t=>t.toLowerCase();

  function add(k,key,tok){
    let m=tables[k].get(key);if(!m){m=new Map();tables[k].set(key,m)}
    m.set(tok,(m.get(tok)||0)+1);
  }
  function train(text){
    let n=0;
    T.sentences(text).forEach(s=>{
      const seq=[];for(let i=0;i<order-1;i++)seq.push(BOS);
      s.forEach(t=>{seq.push(t);vocab.add(low(t))});seq.push(EOS);
      n+=s.length;
      for(let i=order-1;i<seq.length;i++)
        for(let k=0;k<order;k++)add(k,seq.slice(i-k,i).map(low).join(' '),seq[i]);
    });
    tokens+=n;return n;
  }
  /* temperature: low = safe/repetitive, high = adventurous */
  function sample(m,temp){
    const e=[...m.entries()],inv=1/Math.max(temp,.05);
    const w=e.map(x=>Math.pow(x[1],inv));
    let r=Math.random()*w.reduce((a,b)=>a+b,0);
    for(let i=0;i<e.length;i++){r-=w[i];if(r<=0)return e[i][0]}
    return e[e.length-1][0];
  }
  function next(ctx,temp){ /* back-off: longest known context first */
    for(let k=order-1;k>=0;k--){
      if(ctx.length<k)continue;
      const m=tables[k].get(ctx.slice(ctx.length-k).map(low).join(' '));
      if(m)return sample(m,temp);
    }
    return EOS;
  }
  /* Choose where to start continuing: the latest part of the prompt the model knows. */
  function seed(prompt){
    const pt=T.tokenize(prompt);
    while(pt.length&&T.isPunct(pt[pt.length-1]))pt.pop();
    for(let end=pt.length;end>=1;end--)
      for(let k=Math.min(order-1,end);k>=1;k--)
        if(tables[k].has(pt.slice(end-k,end).map(low).join(' ')))return pt.slice(0,end);
    const c=[];for(let i=0;i<order-1;i++)c.push(BOS);return c;
  }
  function generate(prompt,o){
    o=o||{};
    const max=o.maxTokens||60,temp=o.temperature||.8;
    const ctx=seed(prompt),out=[];let retries=0;
    while(out.length<max){
      const t=next(ctx,temp);
      if(t===EOS){if(out.length<3&&retries++<6)continue;break}
      out.push(t);ctx.push(t);
    }
    return out;
  }
  const stats=()=>({tokens,vocab:vocab.size,contexts:tables[order-1].size});
  return {train,generate,stats,order};
};
