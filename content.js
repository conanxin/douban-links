// content.js v4.2
function enc(s){ return encodeURIComponent((s||'').trim()); }
function nonEmpty(arr){ return arr.filter(x => (x||'').trim().length > 0); }
function uniq(arr){ return [...new Set(arr)]; }

function buildMovieKeyList(info){
  return uniq(nonEmpty([
    info.titleEn && info.year ? `${info.titleEn} ${info.year}` : '',
    info.titleCn && info.year ? `${info.titleCn} ${info.year}` : '',
    info.aka && info.year ? `${info.aka} ${info.year}` : '',
    info.titleEn, info.titleCn, info.aka
  ]));
}
function buildBookKeyList(info){
  return uniq(nonEmpty([
    info.isbn, `${info.title} ${info.author}`.trim(), info.title
  ]));
}
function fillTemplate(tpl, key){ return tpl.replaceAll('{key}', enc(key)); }

function parseBook(){
  const title = document.querySelector('#wrapper h1 span')?.textContent?.trim() || '';
  const infoText = document.querySelector('#info')?.innerText || '';
  const author = (infoText.match(/作者[^:\n]*:\s*(.+)/) || [])[1]?.split('\n')[0]?.trim() || '';
  const isbn = (infoText.match(/ISBN[^:\n]*:\s*(\S+)/i) || [])[1] || '';
  return { type:'book', title, author, isbn };
}
function parseMovie(){
  const titleFull = document.querySelector('#content h1 span[property="v:itemreviewed"]')?.textContent?.trim()
                 || document.querySelector('#content h1')?.innerText?.trim() || '';
  const year = (document.querySelector('#content h1 .year')?.textContent || '').replace(/[()]/g, '');
  const info = document.querySelector('#info')?.innerText || '';
  const aka = (info.match(/又名:\s*(.+)/) || [])[1]?.split('\n')[0]?.trim() || '';
  const foreign = (info.match(/(外文名|原名|英文名)[^:\n]*:\s*(.+)/) || [])[2]?.split('\n')[0]?.trim() || '';
  const titleCn = titleFull.replace(/\s*\(\d{4}\)\s*$/, '').trim();
  const titleEn = foreign;
  return { type:'movie', titleCn, titleEn, aka, year };
}
function parsePage(){
  const isBook = location.hostname === 'book.douban.com';
  const isMovie = location.hostname === 'movie.douban.com';
  if (isBook) return parseBook();
  if (isMovie) return parseMovie();
  return null;
}

const defaultSites = [
  { name: "巧眯网", urlTemplate: "http://www.qiaomi.cn/s/{key}", enableOn: ["movie"] },
  { name: "人人影视（YYeTs）", urlTemplate: "https://yyets.click/search?keyword={key}&type=default", enableOn: ["movie"] },
  { name: "人人电影网", urlTemplate: "https://www.rrdynb.com/plus/search.php?q={key}&pagesize=10", enableOn: ["movie"] }
];

function findMountPoint(){
  const aside = document.querySelector('#content .grid-16-8 .aside') || document.querySelector('.aside');
  if (aside) return aside;
  let el = document.querySelector('#interest_sectl');
  if (el) return el;
  el = document.querySelector('#info');
  if (el) return el;
  return document.querySelector('#content');
}

function ensureBox(info){
  const mount = findMountPoint();
  if (!mount) return null;
  let box = document.querySelector('.dcl-box');
  if (box) return box;
  box = document.createElement('div');
  box.className = 'dcl-box';
  box.innerHTML = `
    <div class="dcl-vertical">
      <span>外链直达 · ${info.type === 'book' ? '书籍' : '电影'}</span>
    </div>
    <div class="dcl-links"><span style="color:#aaa;font-size:12px;">正在检查站点...</span></div>
  `;
  if (mount.classList && mount.classList.contains('aside') || mount === document.querySelector('#content .grid-16-8 .aside')) {
    mount.insertBefore(box, mount.firstChild);
  } else {
    mount.parentNode.insertBefore(box, mount.nextSibling);
  }
  return box;
}

function render(info){
  const box = ensureBox(info);
  if (!box) return;
  const list = box.querySelector('.dcl-links');
  list.innerHTML = '';

  const siteList = defaultSites.filter(s => s.enableOn?.includes(info.type));
  const keys = info.type === 'movie' ? buildMovieKeyList(info) : buildBookKeyList(info);
  if (keys.length === 0) return;

  let finished = 0, added = 0;
  siteList.forEach(site => {
    const urls = keys.map(k => site.urlTemplate.replace('{key}', encodeURIComponent(k)));
    chrome.runtime.sendMessage({ type: 'strongCheckMany', urls, keys }, (resp) => {
      finished++;
      if (resp && resp.ok && resp.url) {
        const a = document.createElement('a');
        a.className = 'dcl-btn';
        a.href = resp.url + (resp.url.includes('#') ? '&' : '#') + 'extkey=' + encodeURIComponent(keys[0]);
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = site.name;
        list.appendChild(a);
        added++;
      }
      if (finished === siteList.length && added === 0) {
        const msg = document.createElement('div');
        msg.style.cssText = 'color:#999;font-size:12px;margin-right:8px;';
        msg.textContent = '未命中结果';
        const force = document.createElement('a');
        force.href = 'javascript:void(0)';
        force.className = 'dcl-btn';
        force.textContent = '强制显示所有站点';
        force.onclick = () => {
          list.innerHTML = '';
          siteList.forEach(s => {
            const a = document.createElement('a');
            a.className = 'dcl-btn';
            const u = s.urlTemplate.replace('{key}', encodeURIComponent(keys[0]));
            a.href = u + (u.includes('#') ? '&' : '#') + 'extkey=' + encodeURIComponent(keys[0]);
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = s.name;
            list.appendChild(a);
          });
        };
        list.appendChild(msg);
        list.appendChild(force);
      }
    });
  });
}

function init(){
  const info = parsePage();
  if (!info) return;
  const hasTitle = info.type === 'book' ? info.title : (info.titleCn || info.titleEn || info.aka);
  if (!hasTitle) return;
  render(info);
}

let tries = 0;
const timer = setInterval(() => { tries++; init(); if (tries > 12) clearInterval(timer); }, 600);
const mo = new MutationObserver(() => init());
mo.observe(document.body, { childList: true, subtree: true });
