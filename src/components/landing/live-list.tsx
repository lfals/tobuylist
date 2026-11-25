"use client"

import { SignInButton } from "@clerk/nextjs"
import { Plus, X } from "lucide-react"
import { useRef, useState } from "react"

type DemoItem = { id: number; name: string; store: string; cents: number; done: boolean }

// Itens de exemplo para a página nunca aparecer vazia (nem para quem só lê o HTML).
const initialItems: DemoItem[] = [
	{ id: 1, name: "Fritadeira elétrica 4 L", store: "Casas Horizonte", cents: 29990, done: true },
	{ id: 2, name: "Mochila escolar", store: "Papelaria Ponto", cents: 12990, done: false },
	{ id: 3, name: "Caderno 10 matérias", store: "Papelaria Ponto", cents: 2750, done: false },
]

const exampleDraft = { name: "um tênis de corrida", store: "Esporte Já", price: "389,00" }
const emptyDraft = { name: "", store: "", price: "" }
const MAX_ITEMS = 20

const numberFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatCents = (cents: number) => numberFormat.format(cents / 100)

// "um tênis de corrida" vira "Tênis de corrida": tira o artigo de quem escreve em frase.
function cleanName(raw: string) {
	const trimmed = raw.trim().replace(/^(um|uma|uns|umas|o|a|os|as)\s+/i, "")
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

// Aceita "389", "389,00", "R$ 1.299,90" e "1299.90". Devolve centavos ou null.
function parsePrice(raw: string) {
	const cleaned = raw.replace(/[^\d.,]/g, "")
	if (!/\d/.test(cleaned)) return null
	let normalized = cleaned
	if (cleaned.includes(",")) {
		normalized = cleaned.replace(/\./g, "").replace(",", ".")
	} else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
		normalized = cleaned.replace(/\./g, "")
	}
	const value = Number.parseFloat(normalized)
	if (!Number.isFinite(value) || value < 0 || value > 99_999_999) return null
	return Math.round(value * 100)
}

type FieldProps = {
	value: string
	onChange: (value: string) => void
	placeholder: string
	label: string
	maxLength: number
	inputMode?: "text" | "decimal"
	inputRef?: React.Ref<HTMLInputElement>
}

// Input que cresce com o texto: um espelho invisível ocupa a mesma célula da grade e dá a largura.
function Field({ value, onChange, placeholder, label, maxLength, inputMode = "text", inputRef }: FieldProps) {
	return (
		<span className="mx-1 inline-grid max-w-full overflow-hidden rounded-t-md px-2 border-b-[0.07em] border-lp-ink align-baseline font-hand text-[1.12em] font-bold leading-[1.05] text-lp-accent-text transition-colors focus-within:border-lp-accent focus-within:bg-lp-accent-soft">
			<span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">
				{value || placeholder}
				{"\u00a0\u00a0"}
			</span>
			<input
				ref={inputRef}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				aria-label={label}
				maxLength={maxLength}
				inputMode={inputMode}
				autoComplete="off"
				enterKeyHint="done"
				className="col-start-1 row-start-1 w-0 min-w-full bg-transparent p-0 text-inherit outline-none [font:inherit] placeholder:text-lp-accent-text/40"
			/>
		</span>
	)
}

export function LiveList() {
	const [items, setItems] = useState(initialItems)
	const [draft, setDraft] = useState(exampleDraft)
	const [error, setError] = useState("")
	const nextId = useRef(initialItems.length + 1)
	const nameRef = useRef<HTMLInputElement>(null)
	const priceRef = useRef<HTMLInputElement>(null)

	const total = items.reduce((sum, item) => sum + item.cents, 0)
	const bought = items.filter((item) => item.done).length

	function submit(event: React.FormEvent) {
		event.preventDefault()
		const name = cleanName(draft.name)
		if (!name) {
			setError("Diga o que você quer comprar.")
			nameRef.current?.focus()
			return
		}
		const cents = parsePrice(draft.price)
		if (cents === null) {
			setError("Coloque um preço, como 389,00.")
			priceRef.current?.focus()
			return
		}
		if (items.length >= MAX_ITEMS) {
			setError("A lista de teste aceita até 20 itens.")
			return
		}
		setItems((current) => [...current, { id: nextId.current++, name, store: draft.store.trim(), cents, done: false }])
		setDraft(emptyDraft)
		setError("")
		nameRef.current?.focus()
	}

	const toggle = (id: number) => setItems((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
	const remove = (id: number) => setItems((current) => current.filter((item) => item.id !== id))

	return (
		<div>
			<form onSubmit={submit} aria-label="Lista de teste: adicione um item" noValidate>
				<p className="font-display text-[2.3rem] leading-[1.35] tracking-[-0.01em] sm:text-6xl sm:leading-[1.3] lg:text-[4.8rem]">
					Eu quero comprar
					<Field
						value={draft.name}
						onChange={(name) => setDraft((d) => ({ ...d, name }))}
						placeholder="um tênis"
						label="O que você quer comprar"
						maxLength={40}
						inputRef={nameRef}
					/>
					na
					<Field
						value={draft.store}
						onChange={(store) => setDraft((d) => ({ ...d, store }))}
						placeholder="loja"
						label="Em qual loja (opcional)"
						maxLength={28}
					/>
					por R$
					<Field
						value={draft.price}
						onChange={(price) => setDraft((d) => ({ ...d, price }))}
						placeholder="0,00"
						label="Preço em reais"
						maxLength={12}
						inputMode="decimal"
						inputRef={priceRef}
					/>
					.
				</p>
				<div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
					<button
						type="submit"
						className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-lp-ink px-4 text-base font-bold text-lp-ink transition-colors hover:bg-lp-ink hover:text-lp-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
					>
						<Plus className="size-5" aria-hidden />
						Adicionar à lista
					</button>
					<span className="text-sm text-lp-muted">ou aperte Enter</span>
					<p role="alert" className="min-h-6 text-base font-semibold text-lp-accent-text">
						{error}
					</p>
				</div>
			</form>

			<div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14">
				<section aria-label="Sua lista de teste">
					{items.length === 0 ? (
						<p className="border-y-2 border-lp-ink py-8 text-lg text-lp-muted">A lista está vazia. Preencha a frase acima e adicione o primeiro item.</p>
					) : (
						<ul className="border-b-2 border-lp-ink">
							{items.map((item) => (
								<li key={item.id} className="grid animate-rise grid-cols-[1.75rem_minmax(0,1fr)_auto_2rem] items-center gap-3 border-t-2 border-lp-ink py-3.5 motion-reduce:animate-none sm:gap-4">
									<button
										type="button"
										role="checkbox"
										aria-checked={item.done}
										aria-label={`Marcar ${item.name} como comprado`}
										onClick={() => toggle(item.id)}
										className={`flex size-6 items-center justify-center rounded-md border-[2.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent ${
											item.done ? "border-lp-accent bg-lp-accent text-lp-accent-ink" : "border-lp-ink"
										}`}
									>
										{item.done ? (
											<svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
												<path d="m3 8.5 3.2 3L13 4.5" />
											</svg>
										) : null}
									</button>
									<span className="min-w-0">
										<span className={`block truncate text-lg font-medium sm:text-xl ${item.done ? "text-lp-muted line-through decoration-lp-accent decoration-2" : ""}`}>{item.name}</span>
										{item.store ? <span className="block truncate text-sm text-lp-muted">{item.store}</span> : null}
									</span>
									<span className="text-lg font-bold tabular-nums sm:text-xl">R$ {formatCents(item.cents)}</span>
									<button
										type="button"
										onClick={() => remove(item.id)}
										aria-label={`Remover ${item.name}`}
										className="flex size-8 items-center justify-center rounded-md text-lp-muted transition-colors hover:bg-lp-sunken hover:text-lp-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-lp-accent"
									>
										<X className="size-4" aria-hidden />
									</button>
								</li>
							))}
						</ul>
					)}
				</section>

				<div>
					<div className="rounded-3xl bg-lp-ink p-6 text-lp-bg sm:p-7">
						<p className="text-sm opacity-75">
							Total até agora{items.length > 0 ? ` · ${items.length} ${items.length === 1 ? "item" : "itens"}, ${bought} já comprado${bought === 1 ? "" : "s"}` : ""}
						</p>
						<p aria-live="polite" aria-atomic="true" className="mt-1 font-display text-[3.2rem] leading-[1.05] tabular-nums sm:text-[4.4rem]">
							<span className="text-lp-accent">R$</span> {formatCents(total)}
						</p>
					</div>
					<SignInButton mode="modal">
						<button
							type="button"
							className="mt-5 flex h-14 w-full items-center justify-center rounded-xl bg-lp-accent px-6 text-lg font-bold text-lp-accent-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-ink"
						>
							Entrar e criar minha lista
						</button>
					</SignInButton>
					<p className="mt-4 text-sm leading-relaxed text-lp-muted">
						Isto é uma demonstração: a lista de teste não fica salva. Na sua conta, as listas ficam guardadas, e você pode colar o link de um produto para o app tentar preencher loja, preço e foto.
					</p>
				</div>
			</div>
		</div>
	)
}
