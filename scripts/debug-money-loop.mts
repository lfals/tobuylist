/**
 * Feedback loop for Item edit quantity corruption.
 * Behaviour + call-site lock: price-stripping must not be applied to quantity.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { formSchema } from "../src/components/lists/formSchema"
import { useFormatNumber } from "../src/hooks/use-formatNumber"
import { formatBRL } from "../src/lib/productFromHtml"

type FormInput = {
	name: string
	link: string
	store: string
	imageUrl: string
	price: string
	quantity: string
}

type Stored = { price: number; quantity: number }

function persistCreate(values: FormInput): Stored {
	const parsed = formSchema.parse(values)
	const price = Number(parsed.price)
	const quantity = Number(parsed.quantity)
	return { price, quantity }
}

function persistEdit(values: FormInput): Stored {
	const parsed = formSchema.parse(values)
	const price = Number(String(parsed.price).replace("R$ ", "").replace(",", "").replace(".", ""))
	const quantity = Number(parsed.quantity)
	return { price, quantity }
}

function hydrateEdit(item: { price: number; quantity: number }): FormInput {
	return {
		name: "Item teste",
		link: "",
		store: "loja",
		imageUrl: "",
		price: useFormatNumber(item.price.toString()),
		quantity: item.quantity.toString(),
	}
}

function typedForm(reaisDigits: string, quantity: string): FormInput {
	return {
		name: "Item teste",
		link: "",
		store: "loja",
		imageUrl: "",
		price: useFormatNumber(reaisDigits),
		quantity,
	}
}

function eq(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) === JSON.stringify(b)
}

let failed = 0

function check(name: string, actual: unknown, expected: unknown) {
	if (!eq(actual, expected)) {
		failed += 1
		console.log(`FAIL  ${name}`)
		console.log(`      expected ${JSON.stringify(expected)}`)
		console.log(`      actual   ${JSON.stringify(actual)}`)
		return
	}
	console.log(`PASS  ${name}`)
}

check(
	"quantity 1.0 on edit stays 1, not 10",
	persistEdit(typedForm("1234", "1.0")),
	{ price: 1234, quantity: 1 },
)

check(
	"create vs edit of the same typed form store the same values",
	persistEdit(typedForm("1234", "2")),
	persistCreate(typedForm("1234", "2")),
)

check(
	"edit-save without changes keeps cents and quantity",
	persistEdit(hydrateEdit(persistCreate(typedForm("1234", "2")))),
	persistCreate(typedForm("1234", "2")),
)

check(
	"Autofill formatBRL(12.34) then create stores 1234 cents",
	persistCreate({ ...typedForm("0", "1"), price: useFormatNumber(formatBRL(12.34)) }),
	{ price: 1234, quantity: 1 },
)

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const priceStripOnQuantity = /quantity:\s*Number\(values\.quantity\.replace\(/
const callSites = [
	"src/components/lists/body.tsx",
	"src/components/lists/shared/body.tsx",
	"src/components/lists/item-dialogs.tsx",
]
for (const file of callSites) {
	const source = readFileSync(join(root, file), "utf8")
	if (priceStripOnQuantity.test(source)) {
		failed += 1
		console.log(`FAIL  ${file} still applies price-stripping to quantity`)
	} else {
		console.log(`PASS  ${file} does not price-strip quantity`)
	}
}

console.log(failed === 0 ? "\nLOOP GREEN" : `\nLOOP RED (${failed} failing)`)
process.exit(failed === 0 ? 0 : 1)
