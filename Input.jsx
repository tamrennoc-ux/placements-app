import React from 'react'
export function Input(props){
  return <input {...props} className={'w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 '+(props.className||'')} />
}
