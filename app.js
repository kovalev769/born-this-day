'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
let saved;try{saved=localStorage.getItem('btd-language')}catch{}
let lang=params.get('lang')||saved||'ru';if(!['ru','en'].includes(lang))lang='ru';
let data;
const words={ru:{tagline:'Каждый день — человеческая история',edition:'Пилотная коллекция · две истории',heading:'Истории, которые стоит узнать',principle:'Не каждый выдающийся человек знаменит. И не каждый знаменитый человек выдающийся',day:'Дата',today:'Сегодня',sources:'Источники',others:'Другие люди, родившиеся в этот день',empty:'На эту дату история ещё не добавлена. В пилотной коллекции доступны 18 и 23 ноября.',error:'Не удалось загрузить истории. Проверьте соединение и обновите страницу.',footer:'Знания — для всех. Персонализация — по желанию.',notFound:'Эта история пока недоступна.'},en:{tagline:'A human story, every day',edition:'Pilot collection · two stories',heading:'Lives worth discovering',principle:'Not every remarkable person is famous. And not every famous person is remarkable.',day:'Date',today:'Today',sources:'Sources',others:'Others born on this day',empty:'No story has been added for this date yet. The pilot collection includes November 18 and 23.',error:'Unable to load the stories. Check your connection and reload the page.',footer:'Knowledge for everyone. Personalization by choice.',notFound:'This story is not available yet.'}};
function localISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function validDay(key){if(!/^\d{2}-\d{2}$/.test(key||''))return false;const [m,d]=key.split('-').map(Number),v=new Date(2000,m-1,d,12);return v.getMonth()===m-1&&v.getDate()===d}
function dateText(iso,year=true){const [y,m,d]=iso.split('-').map(Number);return new Intl.DateTimeFormat(lang==='ru'?'ru-RU':'en-US',{day:'numeric',month:'long',...(year?{year:'numeric'}:{})}).format(new Date(y,m-1,d,12))}
function linkFor(day,id){const p=new URLSearchParams({date:day,lang});if(id)p.set('person',id);return '?'+p.toString()}
function syncURL(){history.replaceState(null,'',linkFor($('day').value.slice(5),params.get('person')))}
function addLink(container,label,day,id){const a=document.createElement('a');a.textContent=label;a.href=linkFor(day,id);container.append(a)}
function status(message){$('status').textContent=message;$('status').hidden=!message}
function render(){
 const t=words[lang];document.documentElement.lang=lang;
 for(const [id,key]of Object.entries({tagline:'tagline',edition:'edition',heading:'heading',principle:'principle','day-label':'day',today:'today','source-title':'sources','others-title':'others','footer-text':'footer'}))$(id).textContent=t[key];
 document.querySelector('.calendar').setAttribute('aria-label',t.day);
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 $('story').hidden=true;$('others').hidden=true;$('pilot-links').replaceChildren();
 if(!data){status(t.error);return}
 for(const key of Object.keys(data.dates))addLink($('pilot-links'),dateText('2000-'+key,false),key);
 const key=$('day').value.slice(5),people=data.dates[key]||[];
 const requested=params.get('person');
 const person=requested?people.find(p=>p.id===requested):(people.find(p=>p.id===data.featured_by_date[key])||people[0]);
 if(!person){document.title='Born This Day';status(requested?t.notFound:t.empty);return}
 status('');$('story').hidden=false;$('name').textContent=person.name[lang];document.title=person.name[lang]+' — Born This Day';
 $('section').textContent=data.sections[person.sections.includes('humanity')?'humanity':'main'][lang];
 $('life').textContent=dateText(person.birth_date)+(person.death_date?' — '+dateText(person.death_date):'');
 $('category').textContent=person.category[lang];$('bio').replaceChildren();
 for(const paragraph of person.bio[lang]){const p=document.createElement('p');p.textContent=paragraph;$('bio').append(p)}
 const photo=$('portrait');photo.hidden=true;photo.removeAttribute('src');
 if(person.portrait.rights_status==='verified'&&/^https:\/\//.test(person.portrait.url||'')){photo.src=person.portrait.url;photo.alt=person.name[lang];photo.classList.toggle('deceased',!person.is_alive);photo.hidden=false}
 $('sources').replaceChildren();for(const source of person.sources){if(!/^https:\/\//.test(source.url))continue;const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('sources').append(li)}
 $('other-links').replaceChildren();for(const other of people.filter(p=>p.id!==person.id))addLink($('other-links'),other.name[lang],key,other.id);
 $('others').hidden=people.length<2;
}
const initial=params.get('date');
// Use this year; February 29 links use a leap year when necessary.
const year=new Date().getFullYear();
const leap=year%4===0&&(year%100!==0||year%400===0);
$('day').value=validDay(initial)?`${initial==='02-29'&&!leap?2000:year}-${initial}`:localISO();
$('day').addEventListener('change',()=>{if(!$('day').value)return;params.delete('person');syncURL();render()});
$('today').addEventListener('click',()=>{$('day').value=localISO();params.delete('person');syncURL();render()});
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;try{localStorage.setItem('btd-language',lang)}catch{}syncURL();render()}));
(async()=>{try{const response=await fetch('./born-this-day-pilot.json');if(!response.ok)throw Error(response.status);const json=await response.json();if(json.schema_version!==2||!json.dates||!json.featured_by_date)throw Error('Unsupported data');data=json}catch(e){console.error(e)}render()})();
