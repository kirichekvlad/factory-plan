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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const authed = !!data.session
      setIsAuthed(authed)
      if (authed) loadMachines()
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const authed = !!session
      setIsAuthed(authed)
      if (authed) loadMachines()
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

  const signIn = async () => {
    setStatus('Входим...')
    const res = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (res.error) setStatus('Ошибка: ' + res.error.message)
    else setStatus('')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (!isAuthed) {
    return (
      <main style={{ padding: 20, maxWidth: 420 }}>
        <h1>Вход</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10 }}
          />
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 10 }}
          />
          <button onClick={signIn} style={{ padding: 10 }}>
            Войти
          </button>
        </div>

        {status && <p style={{ marginTop: 12 }}>{status}</p>}
      </main>
    )
  }

  return (
    <main style={{ padding: 20, maxWidth: 700 }}>
      <h1>Главная</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Link href="/items">
          <button>Номенклатура</button>
        </Link>
        <button onClick={signOut}>Выйти</button>
      </div>

      <h2>Станки</h2>
      <ul>
        {machines.map((m) => (
          <li key={m.id}>
            <Link href={`/machine/${m.id}`}>{m.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
