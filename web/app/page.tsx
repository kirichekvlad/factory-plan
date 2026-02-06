'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type Machine = {
  id: string
  name: string
}

export default function Home() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
      if (data.session) loadMachines()
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session)
      if (session) loadMachines()
      else setMachines([])
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const loadMachines = async () => {
    const res = await supabase
      .from('machines')
      .select('id, name')
      .order('name')

    setMachines(res.data || [])
  }

  if (!isAuthed) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Вход выполните через страницу станка</h1>
      </main>
    )
  }

  return (
    <main style={{ padding: 20, maxWidth: 600 }}>
      <h1>Главная</h1>

      <div style={{ marginBottom: 16 }}>
        <Link href="/items">
          <button>Номенклатура</button>
        </Link>
      </div>

      <h2>Станки</h2>
      <ul>
        {machines.map(m => (
          <li key={m.id}>
            <Link href={`/machine/${m.id}`}>{m.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
