import React from 'react'
export function Button({children, className='', variant='solid', ...props}){
  const base = 'px-4 py-2 text-sm font-medium rounded-xl transition shadow-sm'
  const styles = variant==='outline'
    ? 'border border-slate-300 bg-white hover:bg-slate-50'
    : 'bg-slate-900 text-white hover:bg-slate-800'
  return <button className={base+' '+styles+' '+className} {...props}>{children}</button>
}
