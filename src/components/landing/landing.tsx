import { SignInButton } from "@clerk/nextjs"
import { Fragment } from "react"
import { faqs, features, steps, useCases } from "./content"
import { bodyFont, displayFont, handFont } from "./fonts"
import { LiveList } from "./live-list"
import { LandingThemeToggle } from "./theme-toggle"

const focusRing =
	"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"

const display = "font-display font-normal tracking-[-0.01em]"

function Logo() {
	return (
		<a href="/" className={`rounded-md font-display text-2xl tracking-[-0.01em] ${focusRing}`}>
			to buy list
		</a>
	)
}

export function Landing() {
	return (
		<div
			className={`landing ${displayFont.variable} ${handFont.variable} ${bodyFont.variable} min-h-screen bg-lp-bg font-landing text-lp-ink antialiased`}
		>
			<a
				href="#conteudo"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lp-surface focus:px-4 focus:py-2 focus:text-lp-ink"
			>
				Pular para o conteúdo
			</a>

			<header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
				<Logo />
				<nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
					<ul className="mr-3 hidden items-center gap-6 md:flex">
						{[
							["#o-que-faz", "O que faz"],
							["#como-comecar", "Como começar"],
							["#duvidas", "Dúvidas"],
						].map(([href, label]) => (
							<li key={href}>
								<a href={href} className={`rounded text-[15px] font-medium underline-offset-4 hover:underline ${focusRing}`}>
									{label}
								</a>
							</li>
						))}
					</ul>
					<LandingThemeToggle />
					<SignInButton mode="modal">
						<button
							type="button"
							className={`inline-flex h-10 items-center rounded-[10px] border-2 border-lp-ink px-4 text-[15px] font-bold transition-colors hover:bg-lp-ink hover:text-lp-bg ${focusRing}`}
						>
							Entrar
						</button>
					</SignInButton>
				</nav>
			</header>

			<main id="conteudo">
				<section aria-labelledby="titulo" className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6 sm:px-8 lg:pb-28">
					<h1 id="titulo" className="text-lg font-bold text-lp-accent-text sm:text-xl">
						Anote o que quer comprar. Veja quanto vai gastar.
					</h1>
					<p className="mt-1 text-base text-lp-muted">Experimente agora, sem cadastro ↓</p>
					<div className="mt-4">
						<LiveList />
					</div>
				</section>

				<section id="o-que-faz" aria-labelledby="faz-titulo" className="scroll-mt-8 border-t-2 border-lp-ink">
					<div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
						<h2 id="faz-titulo" className={`${display} text-4xl sm:text-5xl`}>
							O que ele faz
						</h2>
						<p className="mt-3 max-w-xl text-lg text-lp-muted">Nada de planilha. Uma lista que sabe somar, e mais algumas coisas úteis.</p>
						<ul className="mt-10 border-b-2 border-lp-ink">
							{features.map((feature) => (
								<li key={feature.title} className="grid gap-2 border-t-2 border-lp-ink py-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
									<h3 className={`${display} text-2xl leading-snug sm:text-[1.7rem]`}>{feature.title}</h3>
									<p className="max-w-xl text-lg leading-relaxed text-lp-muted">{feature.text}</p>
								</li>
							))}
						</ul>
					</div>
				</section>

				<section id="como-comecar" aria-labelledby="como-titulo" className="scroll-mt-8 bg-lp-sunken">
					<div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
						<h2 id="como-titulo" className={`${display} text-4xl sm:text-5xl`}>
							Como começar
						</h2>
						<ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
							{steps.map((step, index) => (
								<li key={step.title} className="border-t-2 border-lp-ink pt-4">
									<span className="font-hand text-6xl font-bold leading-none text-lp-accent-text" aria-hidden>
										{index + 1}
									</span>
									<h3 className="mt-2 text-xl font-bold">{step.title}</h3>
									<p className="mt-2 text-lg leading-relaxed text-lp-muted">{step.text}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				<section aria-labelledby="usos-titulo">
					<div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 lg:py-24">
						<h2 id="usos-titulo" className="sr-only">
							Para que serve
						</h2>
						<p className={`${display} text-[1.9rem] leading-[1.7] sm:text-5xl sm:leading-[1.6]`}>
							Serve para
							{useCases.map((useCase, index) => (
								<Fragment key={useCase}>
									<span className="mx-1 font-hand text-[1.12em] font-bold leading-none text-lp-accent-text underline decoration-lp-ink decoration-[0.07em] underline-offset-[0.22em]">
										{useCase}
									</span>
									{index < useCases.length - 2 ? "," : index === useCases.length - 2 ? " e" : "."}
								</Fragment>
							))}
						</p>
					</div>
				</section>

				<section id="duvidas" aria-labelledby="faq-titulo" className="scroll-mt-8 border-t-2 border-lp-ink">
					<div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
						<h2 id="faq-titulo" className={`${display} text-4xl sm:text-5xl`}>
							Dúvidas comuns
						</h2>
						<dl className="mt-10 border-b-2 border-lp-ink">
							{faqs.map((faq) => (
								<div key={faq.question} className="grid gap-2 border-t-2 border-lp-ink py-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
									<dt className="text-xl font-bold leading-snug">{faq.question}</dt>
									<dd className="max-w-xl text-lg leading-relaxed text-lp-muted">{faq.answer}</dd>
								</div>
							))}
						</dl>
					</div>
				</section>

				<section aria-labelledby="cta-titulo" className="bg-lp-ink text-lp-bg">
					<div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:py-20">
						<h2 id="cta-titulo" className={`${display} max-w-2xl text-4xl leading-tight sm:text-5xl`}>
							Comece pelo que está na sua cabeça agora.
						</h2>
						<SignInButton mode="modal">
							<button
								type="button"
								className="inline-flex h-14 shrink-0 items-center justify-center rounded-xl bg-lp-accent px-7 text-lg font-bold text-lp-accent-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-bg"
							>
								Entrar e criar minha lista
							</button>
						</SignInButton>
					</div>
				</section>
			</main>

			<footer>
				<div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
					<Logo />
					<p className="text-sm text-lp-muted">Listas de compras com preço, link e total.</p>
				</div>
			</footer>
		</div>
	)
}
