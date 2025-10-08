(function(){
  const u = new URL(location.href);
  const extkey = u.hash.match(/extkey=([^&]+)/)?.[1];
  if (!extkey) return;
  const key = decodeURIComponent(extkey);

  function tryFill(selInputList, selSubmitList){
    const input = selInputList.map(s => document.querySelector(s)).find(Boolean);
    if (input) input.value = key;
    const form = input ? input.form : document.querySelector('form');
    const submit = selSubmitList.map(s => document.querySelector(s)).find(Boolean);
    if (form) form.submit(); else if (submit) submit.click();
  }

  const host = location.hostname;
  if (host.includes('qiaomi.cn')) {
    tryFill(['input[name="wd"]','input[type="text"]','#wd'], ['input[type="submit"]','button','.search_btn']);
  } else if (host.includes('yyets.click')) {
    tryFill(['input[name="keyword"]','input[type="search"]','input[type="text"]'], ['input[type="submit"]','button']);
  } else if (host.includes('rrdynb.com')) {
    tryFill(['input[name="wd"]','input[type="text"]'], ['input[type="submit"]','button']);
  }
})();