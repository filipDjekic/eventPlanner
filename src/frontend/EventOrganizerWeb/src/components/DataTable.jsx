import React, { useMemo, useState } from 'react';

export default function DataTable({ columns, rows, actions }){
  const [sort, setSort] = useState({ key:null, dir:0 });
  const sorted = useMemo(()=>{
    if(!sort.key || sort.dir===0) return rows;
    const list = [...rows];
    list.sort((a,b)=>{
      const av=a[sort.key], bv=b[sort.key];
      if(av==null) return 1; if(bv==null) return -1;
      if(typeof av==='number' && typeof bv==='number') return sort.dir*(av-bv);
      return sort.dir*String(av).localeCompare(String(bv),'sr',{numeric:true});
    });
    return list;
  },[rows, sort]);

  function click(key){
    setSort(s=> s.key!==key ? {key,dir:1} : s.dir===1 ? {key,dir:-1} : {key:null,dir:0});
  }

  return (
    <div className="overflow-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 cursor-pointer select-none" onClick={()=>click(c.key)}>
                <div className="flex items-center gap-1">
                  <span>{c.header}</span>
                  {sort.key===c.key && (sort.dir===1? '↑' : sort.dir===-1? '↓' : '•')}
                </div>
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right">Akcije</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r,i)=> (
            <tr key={r.id||i} className="border-t border-white/5 hover:bg-white/5">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-2">{c.render? c.render(r[c.key], r) : String(r[c.key] ?? '')}</td>
              ))}
              {actions && <td className="px-4 py-2 text-right">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
