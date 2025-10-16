async function sha256(msg){
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
document.getElementById('go').onclick = async ()=>{
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  const url = tab?.url || 'about:blank';
  const h = await sha256(url);
  document.getElementById('out').textContent = `URL: ${url}\nHash: ${h}`;
};
