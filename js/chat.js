/* Home chat UI. Talks only to LM.Engine, so it works with any backend. */
(function(){
  const $=id=>document.getElementById(id);
  const chatLog=$('chatLog'),chatInput=$('chatInput');
  const history=[];let busy=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const scroll=()=>{chatLog.scrollTop=chatLog.scrollHeight};
  function addBubble(text,who){
    const b=document.createElement('div');b.className='bubble '+who;b.textContent=text;
    chatLog.append(b);scroll();return b;
  }
  async function sendChat(){
    const text=chatInput.value.trim();if(!text||busy)return;
    busy=true;
    addBubble(text,'user');history.push({role:'user',content:text});
    chatInput.value='';chatInput.focus();
    const t=document.createElement('div');t.className='bubble bot typing';t.innerHTML='<i></i><i></i><i></i>';
    chatLog.append(t);scroll();
    const started=Date.now();let bubble=null,full='';
    try{
      for await(const part of LM.Engine.reply(history.slice())){
        if(!bubble){
          const wait=700-(Date.now()-started);if(wait>0)await sleep(wait);
          t.remove();bubble=addBubble('','bot');
        }
        full+=part;bubble.textContent=full;scroll();await sleep(30); /* streamed token by token */
      }
    }catch(e){if(!bubble){t.remove();bubble=addBubble('','bot')}bubble.textContent=full||'Sorry, something went wrong.'}
    if(t.isConnected)t.remove();
    history.push({role:'assistant',content:full});
    busy=false;
  }
  $('chatSend').onclick=sendChat;
  chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendChat()}});
})();
