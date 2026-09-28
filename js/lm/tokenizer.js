/* LM layer 1 - Tokenizer: text -> tokens (words + punctuation) and back. */
window.LM=window.LM||{};
LM.Tokenizer=(function(){
  const RE=/[\p{L}\p{N}]+(?:['\u2019][\p{L}\p{N}]+)*|[.,!?;:]/gu;
  const END=new Set(['.','!','?']);
  const PUNCT=/^[.,!?;:]$/;
  const tokenize=text=>String(text).match(RE)||[];
  /* Split text into sentences (token arrays): at . ! ? and at line breaks. */
  function sentences(text){
    const out=[];
    String(text).split(/\r?\n+/).forEach(line=>{
      let cur=[];
      tokenize(line).forEach(t=>{cur.push(t);if(END.has(t)){out.push(cur);cur=[]}});
      if(cur.length)out.push(cur);
    });
    return out;
  }
  return {tokenize,sentences,isEnd:t=>END.has(t),isPunct:t=>PUNCT.test(t)};
})();
