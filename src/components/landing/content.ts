// Fonte única do texto da landing: usada pela página, pelo JSON-LD e pelo llms.txt.
// Só descreva aqui o que o app realmente faz.

export const features = [
	{
		title: "Colou o link, ele tenta preencher",
		text: "Cole o endereço do produto e o app tenta puxar nome, loja, preço e foto. Algumas lojas não deixam ele ler a página, e aí você digita. Em qualquer caso, dá para conferir antes de salvar.",
	},
	{
		title: "A conta fecha sozinha",
		text: "Cada item tem preço e quantidade, e o total da lista aparece no topo. Dá para saber o tamanho do estrago antes de sair de casa.",
	},
	{
		title: "Manda para quem vai comprar junto",
		text: "O app gera um link da lista. Você decide se a pessoa só olha ou se também pode mexer nos itens. Quem recebe entra com a própria conta e pode salvar a lista.",
	},
	{
		title: "O mais urgente fica em cima",
		text: "Arraste os itens e deixe na ordem em que você pretende comprar.",
	},
	{
		title: "Lista que se repete, a gente duplica",
		text: "Compras do mês, material da escola, enxoval: duplique uma lista e ajuste só o que mudou, em vez de refazer tudo.",
	},
] as const

export const steps = [
	{
		title: "Dê um nome para a lista",
		text: "“Casa nova”, “Presentes de dezembro”, “Viagem de julho”. O que fizer sentido para você.",
	},
	{
		title: "Vá colocando as coisas",
		text: "Cole o link do produto ou digite nome, loja, preço e quantidade. Pode ser aos poucos, ao longo dos dias.",
	},
	{
		title: "Olhe o total e compartilhe",
		text: "Confira quanto deu, arrume a ordem e, se quiser, mande o link para quem vai ajudar.",
	},
] as const

// Frases que completam "Serve para…" na página.
export const useCases = [
	"o presente de aniversário",
	"a reforma do banheiro",
	"as compras do mês",
	"a viagem das férias",
	"o material da escola",
	"aquela lista de desejos que hoje mora no bloco de notas do celular",
] as const

export const faqs = [
	{
		question: "O que é o To Buy List?",
		answer:
			"É um app web, em português, para montar listas de compras. Cada item guarda nome, loja, preço, quantidade, link e imagem, e a lista mostra o total automaticamente.",
	},
	{
		question: "Preciso instalar alguma coisa?",
		answer:
			"Não. Ele funciona direto no navegador, no celular ou no computador. É só clicar em Entrar e usar a sua conta, inclusive a do Google.",
	},
	{
		question: "Como funciona o preenchimento pelo link?",
		answer:
			"Ao colar o link de um produto, o app tenta ler a página da loja e preencher nome, loja, preço e imagem. Nem toda loja permite essa leitura. Quando não der, você preenche na mão e confere os valores antes de salvar.",
	},
	{
		question: "Como compartilho uma lista com outra pessoa?",
		answer:
			"Abra a lista, clique no botão de link e escolha se a outra pessoa pode alterar os itens. O app copia o endereço para você enviar. Quem recebe entra com a própria conta, vê a lista e pode salvá-la.",
	},
	{
		question: "Posso mudar a ordem dos itens?",
		answer:
			"Pode. É só arrastar os itens para colocar primeiro o que é mais importante ou mais urgente.",
	},
	{
		question: "Dá para copiar uma lista que eu já usei?",
		answer:
			"Dá. Use a opção Duplicar no menu da lista para criar uma cópia e ajustar o que mudou.",
	},
] as const
