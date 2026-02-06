'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

type Item = {
  id: string
  name: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    const res = await supabase
      .from('items')
      .select('id, name')
      .order('name')

    setItems(res.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const addItem = async () => {
    setMessage(null)

    if (!name.trim()) {
      setMessage('Введите название')
      return
    }

    const res = await supabase.from('items').insert({
      name: name.trim()
    })

    if (res.error) {
      setMessage(res.error.message)
    } else {
      setName('')
      setMessage('Позиция добавлена')
      load()
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 600 }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/">
          <button>← Назад</button>
        </Link>
      </div>

      <h1>Номенклатура</h1>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Название позиции"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={addItem}>Добавить</button>
        {message && <p>{message}</p>}
      </div>

      <ul>
        {items.map(i => (
          <li key={i.id}>{i.name}</li>
        ))}
      </ul>
    </main>
  )
}
