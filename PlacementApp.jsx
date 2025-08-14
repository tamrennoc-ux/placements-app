import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent } from './components/ui/Card.jsx'
import { Button } from './components/ui/Button.jsx'
import { Input } from './components/ui/Input.jsx'
import { Textarea } from './components/ui/Textarea.jsx'
import { ChevronDown, ChevronUp, CalendarDays, Share2, Copy, Download, Filter } from 'lucide-react'

const SAMPLE_EMAIL = `BSc (Honours) Diagnostic Imaging Practice Placement Timetable for Academic Session 2025-26
**Student Name:**
**Conner, Thomas**
Matriculation Number / Student Reference Number:
**S2430985**
**Week 7**
Monday
27.10.2025
RAH : Fluoro
Tuesday
28.10.2025
RHC
Wednesday
29.10.2025
RAH : IR
Thursday
30.10.2025
RAH : Gen
Friday
31.10.2025
RAH : Gen
Saturday
01.11.2025
OFF
Sunday
02.11.2025
OFF
**Week 8**
Monday
03.11.2025
VOL : CT
Tuesday
04.11.2025
VOL : CT
**Trimester B Week 2**
Monday
02.02.2026
RAH : 9-9
Tuesday
03.02.2026
RAH : 9-9
**Trimester C Week 0**
Monday
04.05.2026
RAH : MRI
Tuesday
05.05.2026
RAH : MRI
Wednesday
06.05.2026
RAH : 9-9
Thursday
07.05.2026
RAH : Mob/Th
Friday
08.05.2026
RAH : Mob/Th
`

function parseNameAndId(text) {
  const nameMatch = text.match(/Student\s*Name:\s*\*\*([^*]+)\*\*|Student\s*Name:\s*([\w',.\- ]+)/i);
  let name = '';
  if (nameMatch) name = (nameMatch[1] || nameMatch[2] || '').trim();
  if (!name) {
    const alt = text.match(/\*\*([A-Z][^*]+),\s*([A-Z][^*]+)\*\*\s*\nMatriculation/i);
    if (alt) name = `${alt[1].trim()}, ${alt[2].trim()}`;
  }
  const idMatch = text.match(/Matriculation\s*Number[^\n]*\n\*\*([A-Za-z0-9]+)\*\*|\b(S\d{7,})\b/i);
  const studentId = idMatch ? (idMatch[1] || idMatch[2] || '').trim() : '';
  return { name, studentId };
}
function monthKey(date){ return date.toLocaleString('en-GB', { month:'long', year:'numeric', timeZone:'Europe/London' }) }
function normalizePlacement(raw){ return raw.replace(/[*_]/g,'').trim().replace(/\s+/g,' ') }
function parsePlacements(text){
  const lines = text.split(/\r?\n/);
  const results = [];
  for (let i=0;i<lines.length;i++){
    const line = lines[i].trim();
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(line)) continue;
    const dateStr = line;
    let placement='';
    let j=i+1;
    while (j<lines.length){
      const nxt = lines[j].trim();
      if (nxt===''){ j++; continue }
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(nxt) || /^\*\*?Week/i.test(nxt)) break;
      if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(nxt)) { j++; continue }
      placement=nxt; break;
    }
    if (!placement || /\bOFF\b/i.test(placement)) continue;
    const [dd,mm,yyyy] = dateStr.split('.').map(Number);
    const date = new Date(Date.UTC(yyyy, mm-1, dd));
    results.push({ date, dateStr, placement: normalizePlacement(placement) });
  }
  const unique = new Map();
  for (const r of results){ const key=r.date.toISOString().slice(0,10); if(!unique.has(key)) unique.set(key,r) }
  return Array.from(unique.values()).sort((a,b)=>a.date-b.date);
}
function groupByMonth(items){
  const map = new Map();
  for (const it of items){ const key=monthKey(new Date(it.date)); if(!map.has(key)) map.set(key,[]); map.get(key).push(it) }
  return Array.from(map.entries()).map(([month, arr])=>({month, items:arr}))
}
function useLocalStorage(key, initial){
  const [value, setValue] = React.useState(()=>{ try{ const s=localStorage.getItem(key); return s?JSON.parse(s):initial }catch{ return initial } })
  React.useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(value)) }catch{} },[key,value])
  return [value, setValue]
}
export default function PlacementApp(){
  const [raw, setRaw] = useLocalStorage('placements.raw', SAMPLE_EMAIL)
  const [name, setName] = useLocalStorage('placements.name','')
  const [studentId, setStudentId] = useLocalStorage('placements.id','')
  const [expanded, setExpanded] = useState({})
  const [filter, setFilter] = useState('')
  const parsed = useMemo(()=>{ const info=parseNameAndId(raw); const placements=parsePlacements(raw); return {info, placements}},[raw])
  useEffect(()=>{ if(!name && parsed.info.name) setName(parsed.info.name); if(!studentId && parsed.info.studentId) setStudentId(parsed.info.studentId); const current=monthKey(new Date()); setExpanded(e=>({ ...e, [current]: true })) },[])
  const groups = useMemo(()=>{ let items=parsed.placements; if(filter.trim()){ const f=filter.trim().toLowerCase(); items = items.filter(x=>x.placement.toLowerCase().includes(f)) } return groupByMonth(items)},[parsed.placements, filter])
  const total = parsed.placements.length
  function toggleMonth(m){ setExpanded(e=>({ ...e, [m]: !e[m] })) }
  function share(){
    const shareText = `Placements for ${name||'Student'} (${studentId||'ID'})`
    const url = window.location.href
    if (navigator.share){ navigator.share({ title: document.title||'Placements', text: shareText, url }).catch(()=>{}) }
    else { window.open('https://wa.me/?text='+encodeURIComponent(shareText+'\n'+url),'_blank') }
  }
  function copyLink(){ navigator.clipboard.writeText(window.location.href).catch(()=>{}); alert('Link copied to clipboard') }
  function downloadCSV(){
    const rows = [['Date','Placement'], ...parsed.placements.map(p=>[p.date.toLocaleDateString('en-GB'), p.placement])]
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`placements_${studentId||'student'}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }
  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8'>
      <div className='max-w-3xl mx-auto grid gap-4'>
        <header className='flex items-center justify-between'>
          <h1 className='text-2xl md:text-3xl font-bold flex items-center gap-2'><CalendarDays className='h-7 w-7'/>Practice Placements</h1>
          <div className='flex gap-2'>
            <Button onClick={share} className='rounded-2xl shadow'><Share2 className='h-4 w-4 mr-2'/>Share</Button>
            <Button variant='outline' onClick={copyLink} className='rounded-2xl'><Copy className='h-4 w-4 mr-2'/>Copy link</Button>
          </div>
        </header>
        <Card className='rounded-2xl shadow'>
          <CardContent className='p-4 md:p-6 grid gap-3'>
            <div className='grid md:grid-cols-2 gap-3'>
              <div>
                <label className='text-xs uppercase tracking-wide text-slate-500'>Student name</label>
                <Input value={name} onChange={e=>setName(e.target.value)} placeholder='Your name' className='rounded-xl'/>
              </div>
              <div>
                <label className='text-xs uppercase tracking-wide text-slate-500'>Student ID</label>
                <Input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder='e.g. S1234567' className='rounded-xl'/>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-slate-600'>Total placement days</div>
              <div className='text-2xl font-semibold'>{total}</div>
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl shadow'>
          <CardContent className='p-4 md:p-6 grid gap-3'>
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4'/>
              <Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder='Filter by placement (e.g. MRI, CT, Gen, US)' className='rounded-xl'/>
            </div>
            <label className='text-xs uppercase tracking-wide text-slate-500'>Paste the full email here</label>
            <Textarea value={raw} onChange={e=>setRaw(e.target.value)} rows={12} className='rounded-2xl'/>
            <div className='flex gap-2'>
              <Button onClick={()=>setRaw(SAMPLE_EMAIL)} variant='outline' className='rounded-2xl'>Load example</Button>
              <Button onClick={downloadCSV} className='rounded-2xl'><Download className='h-4 w-4 mr-2'/>Export CSV</Button>
            </div>
            <p className='text-sm text-slate-600'>Tip: Share this page on WhatsApp using the Share button. When your friends open it, they can paste their email into the box and the app will generate their schedule automatically.</p>
          </CardContent>
        </Card>
        <div className='grid gap-3'>
          {groups.length===0 && (<p className='text-center text-slate-500'>No placements found yet. Paste your email above.</p>)}
          {groups.map(({month, items})=> (
            <Card key={month} className='rounded-2xl overflow-hidden'>
              <button onClick={()=>toggleMonth(month)} className='w-full flex items-center justify-between p-4 md:p-5 bg-white hover:bg-slate-50'>
                <div className='text-lg font-semibold'>{month}</div>
                <div className='flex items-center gap-3 text-slate-600'>
                  <span className='text-sm'>{items.length} day{items.length!==1?'s':''}</span>
                  {expanded[month] ? <ChevronUp className='h-5 w-5'/> : <ChevronDown className='h-5 w-5'/>}
                </div>
              </button>
              {expanded[month] && (
                <div className='bg-slate-50 border-t'>
                  {items.map((it, idx)=> (
                    <div key={idx} className='px-4 md:px-5 py-3 flex items-center justify-between border-b last:border-b-0'>
                      <div className='font-medium'>{it.date.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}</div>
                      <div className='text-slate-700'>{it.placement}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
        <footer className='text-center text-xs text-slate-500 mt-6'>Built for quick sharing. No server needed; all parsing happens in your browser.</footer>
      </div>
    </div>
  )
}
