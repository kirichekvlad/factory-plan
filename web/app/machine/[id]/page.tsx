'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'

type Machine = {
  id: string
  name: string
}

type Item = {
  id: string
  name: string
}

type PlanRow = {
  id: string
  pos: number
  target_qty: number
  items: { name: string }
  done_qty: number
}

export default function MachinePage() {
  const params = useParams()
  const machineId = params.id as string

  const [machine, setMachine] = useState<Machine | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [planRows, setPlanRows] = useState<PlanRow[]>([])

  const [factQty, setFactQty] = useState('')
  const [itemId, setItemId] = useState('')
  const [targetQty, setTargetQty] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    const m = await supabase
      .from('machines')
      .select('id, name')
      .eq('id', machineId)
      .single()

    setMachine(m.data)

    const itemsRes = await supabase
      .from('items')
      .select('id, name')
      .order('name')

    setItems(itemsRes.data || [])

    const planRes = await supabase.rpc('get_plan_with_done', {
      p_machine_id: machineId
    })

    setPlanRows(planRes.data || [])
  }

  useEffect(() => {
    if (machineId) load()
  }, [machineId])

  const saveFact = async () => {
    setMessage(null)

    if (!factQty) {
      setMessage('Введи количество')
      return
    }

    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id
    if (!userId) return

    const fact = await supabase
      .from('fact_entries')
      .insert({
        machine_id: machineId,
        date: new Date().toISOString().slice(0, 10),
        qty: Number(factQty),
        created_by: userId
      })
      .select()
      .single()

    if (fact.error) {
      setMessage(fact.error.message)
      return
    }

    await supabase.rpc('allocate_fact', {
      p_fact_id: fact.data.id,
      p_machine_id: machineId,
      p_qty: Number(factQty)
    })

    setFactQty('')
    setMessage('Факт сохранён')
    load()
  }

  const addPlanRow = async () => {
    setMessage(null)

    if (!itemId || !targetQty) {
      setMessage('Выбери позицию и количество')
      return
    }

    const nextPos =
      planRows.length === 0
        ? 1
        : Math.max(...planRows.map(p => p.pos)) + 1

    const res = await supabase.from('plans').insert({
      machine_id: machineId,
      item_id: itemId,
      target_qty: Number(targetQty),
      position: nextPos,
      status: 'active'
    })

    if (res.error) {
      setMessage(res.error.message)
    } else {
      setItemId('')
      setTargetQty('')
      setMessage('Строка плана добавлена')
      load()
    }
  }

  if (!machine) return <p>Загрузка...</p>

  return (
    <main style={{ padding: 20, maxWidth: 800 }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/">
          <button>← Назад</button>
        </Link>
      </div>

      <h1>{machine.name}</h1>

      <h2>Ввод факта</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="number"
          placeholder="Сделано, шт"
          value={factQty}
          onChange={(e) => setFactQty(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={saveFact}>Сохранить факт</button>
      </div>

      <hr />

      <h2>Добавить в план</h2>
      <div style={{ marginBottom: 16 }}>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="">— выбрать позицию —</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="План, шт"
          value={targetQty}
          onChange={(e) => setTargetQty(e.target.value)}
          style={{ marginRight: 8 }}
        />

        <button onClick={addPlanRow}>Добавить</button>
      </div>

      {message && <p>{message}</p>}

      <hr />

      <h2>План</h2>
      {planRows.length === 0 ? (
        <p>План пуст</p>
      ) : (
        <ol>
          {planRows.map(r => {
            const remaining = r.target_qty - r.done_qty
            return (
              <li key={r.id}>
                {r.pos}. {r.items.name} —
                осталось <b>{remaining}</b> из {r.target_qty}
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}
